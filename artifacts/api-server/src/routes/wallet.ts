import { Router } from "express";
import { db, usersTable, platformSettingsTable, offersTable, noticesTable, noticeViewsTable } from "@workspace/db";
import { eq, or, isNull, lte, gte, and, inArray } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

async function getSettings() {
  const [s] = await db.select().from(platformSettingsTable).limit(1);
  return s ?? null;
}

// GET /api/settings/public — no auth required
router.get("/settings/public", async (_req, res) => {
  const settings = await getSettings();
  res.json({
    hyperCoinMinPercent: parseFloat(settings?.hyperCoinMinPercent ?? "50"),
    hyperCoinPrice: parseFloat(settings?.hyperCoinPrice ?? "1.0000"),
    launchOfferActive: settings?.launchOfferActive ?? true,
    launchOfferEndDate: settings?.launchOfferEndDate ? settings.launchOfferEndDate.toISOString() : null,
  });
});

// GET /api/notices/active — returns currently-visible notices for the signed-in user
router.get("/notices/active", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const now = new Date();
  const rows = await db.select().from(noticesTable).where(
    and(
      eq(noticesTable.active, true),
      or(isNull(noticesTable.startsAt), lte(noticesTable.startsAt, now)),
      or(isNull(noticesTable.endsAt),   gte(noticesTable.endsAt, now)),
    )
  );

  const visible = rows.filter(n => {
    if (n.audience === "all") return true;
    if (n.audience === "active")   return !!user.isActive;
    if (n.audience === "inactive") return !user.isActive;
    if (n.audience === "admin")    return !!user.isAdmin;
    return true;
  });

  const priorityRank: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 };
  visible.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    const pa = priorityRank[a.priority] ?? 2;
    const pb = priorityRank[b.priority] ?? 2;
    if (pa !== pb) return pa - pb;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  // Mark which notices the user has already viewed (server-side read state)
  let viewedIds = new Set<number>();
  if (visible.length > 0) {
    const viewedRows = await db.select({ noticeId: noticeViewsTable.noticeId })
      .from(noticeViewsTable)
      .where(and(
        eq(noticeViewsTable.userId, user.id),
        inArray(noticeViewsTable.noticeId, visible.map(n => n.id)),
      ));
    viewedIds = new Set(viewedRows.map(r => r.noticeId));
  }

  res.json(visible.map(n => ({
    id: n.id,
    title: n.title,
    message: n.message,
    type: n.type,
    priority: n.priority,
    icon: n.icon,
    ctaLabel: n.ctaLabel,
    ctaUrl: n.ctaUrl,
    pinned: n.pinned,
    dismissible: n.dismissible,
    createdAt: n.createdAt.toISOString(),
    viewed: viewedIds.has(n.id),
  })));
});

// POST /api/notices/view-all — record views for every notice currently visible to the signed-in user
router.post("/notices/view-all", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const now = new Date();

  const all = await db.select().from(noticesTable);
  const visible = all.filter(n => {
    if (!n.active) return false;
    if (n.startsAt && n.startsAt > now) return false;
    if (n.endsAt && n.endsAt < now) return false;
    if (n.audience === "active"   && !user.isActive) return false;
    if (n.audience === "inactive" &&  user.isActive) return false;
    if (n.audience === "admin"    && !user.isAdmin)  return false;
    return true;
  });

  if (visible.length === 0) { res.json({ success: true, marked: 0 }); return; }

  try {
    await db.insert(noticeViewsTable)
      .values(visible.map(n => ({ noticeId: n.id, userId: user.id })))
      .onConflictDoNothing();
  } catch (err) {
    req.log.error({ err }, "Failed to bulk-record notice views");
  }
  res.json({ success: true, marked: visible.length });
});

// POST /api/notices/:id/view — record that the signed-in user has opened this notice
router.post("/notices/:id/view", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ message: "Invalid ID" }); return; }
  // Confirm the notice exists & is currently active+visible to this user
  const [n] = await db.select().from(noticesTable).where(eq(noticesTable.id, id));
  if (!n) { res.status(404).json({ message: "Notice not found" }); return; }
  try {
    await db.insert(noticeViewsTable).values({ noticeId: id, userId: user.id }).onConflictDoNothing();
  } catch (err) {
    req.log.error({ err }, "Failed to record notice view");
  }
  res.json({ success: true });
});

// GET /api/offers/active — public, returns active offers for user dashboard
router.get("/offers/active", async (_req, res) => {
  const offers = await db.select().from(offersTable).orderBy(offersTable.createdAt);
  const active = offers.filter(o => o.active);
  res.json(active.map(o => ({
    id: o.id,
    title: o.title,
    subtitle: o.subtitle,
    emoji: o.emoji,
    reward: o.reward,
    endDate: o.endDate ? o.endDate.toISOString() : null,
    criteria: o.criteria,
  })));
});

// POST /api/wallet/internal-transfer
router.post("/wallet/internal-transfer", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const { direction, amount } = req.body;

  if (!direction || !["usdt_to_hypercoin", "hypercoin_to_usdt"].includes(direction)) {
    res.status(400).json({ message: "Invalid direction" });
    return;
  }
  const transferAmount = parseFloat(amount);
  if (!transferAmount || transferAmount <= 0) {
    res.status(400).json({ message: "Amount must be greater than 0" });
    return;
  }

  const [freshUser] = await db.select().from(usersTable).where(eq(usersTable.id, user.id)).limit(1);
  if (!freshUser) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const settings = await getSettings();
  const hcPrice = parseFloat(settings?.hyperCoinPrice ?? "1.0000");

  const currentUsdt = parseFloat(freshUser.walletBalance ?? "0");
  const currentHyper = parseFloat(freshUser.hyperCoinBalance ?? "0");

  if (direction === "usdt_to_hypercoin") {
    if (transferAmount > currentUsdt) {
      res.status(400).json({ message: `Insufficient USDT balance. Available: $${currentUsdt.toFixed(2)}` });
      return;
    }
    const hcReceived = transferAmount / hcPrice;
    await db.update(usersTable)
      .set({
        walletBalance: (currentUsdt - transferAmount).toString(),
        hyperCoinBalance: (currentHyper + hcReceived).toString(),
      })
      .where(eq(usersTable.id, user.id));
  } else {
    if (transferAmount > currentHyper) {
      res.status(400).json({ message: `Insufficient HYPERCOIN balance. Available: HC ${currentHyper.toFixed(4)}` });
      return;
    }
    const usdtReceived = transferAmount * hcPrice;
    await db.update(usersTable)
      .set({
        walletBalance: (currentUsdt + usdtReceived).toString(),
        hyperCoinBalance: (currentHyper - transferAmount).toString(),
      })
      .where(eq(usersTable.id, user.id));
  }

  const [updated] = await db.select().from(usersTable).where(eq(usersTable.id, user.id)).limit(1);
  res.json({
    walletBalance: parseFloat(updated.walletBalance ?? "0"),
    hyperCoinBalance: parseFloat(updated.hyperCoinBalance ?? "0"),
  });
});

// GET /api/wallet/p2p/lookup?userId=X — verify recipient exists
router.get("/wallet/p2p/lookup", requireAuth, async (req, res) => {
  const sender = (req as any).user;
  const userId = parseInt(req.query.userId as string, 10);

  if (!userId || isNaN(userId)) {
    res.status(400).json({ message: "Invalid user ID" });
    return;
  }
  if (userId === sender.id) {
    res.status(400).json({ message: "You cannot transfer to yourself" });
    return;
  }

  const [recipient] = await db.select({
    id: usersTable.id,
    fullName: usersTable.fullName,
    email: usersTable.email,
  }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  if (!recipient) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  res.json({ id: recipient.id, name: recipient.fullName, email: recipient.email });
});

// POST /api/wallet/p2p/transfer — send USDT or HYPERCOIN to another user
router.post("/wallet/p2p/transfer", requireAuth, async (req, res) => {
  const sender = (req as any).user;
  const { recipientId, amount, currency } = req.body;

  const transferAmount = parseFloat(amount);
  const coin: "usdt" | "hypercoin" = currency === "hypercoin" ? "hypercoin" : "usdt";

  if (!recipientId || !transferAmount || transferAmount <= 0) {
    res.status(400).json({ message: "Invalid request" });
    return;
  }
  if (recipientId === sender.id) {
    res.status(400).json({ message: "You cannot transfer to yourself" });
    return;
  }

  const [freshSender] = await db.select().from(usersTable).where(eq(usersTable.id, sender.id)).limit(1);
  const [recipient] = await db.select().from(usersTable).where(eq(usersTable.id, recipientId)).limit(1);

  if (!freshSender || !recipient) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  if (coin === "usdt") {
    const senderBalance = parseFloat(freshSender.walletBalance ?? "0");
    if (transferAmount > senderBalance) {
      res.status(400).json({ message: `Insufficient USDT balance. Available: $${senderBalance.toFixed(2)}` });
      return;
    }
    const recipientBalance = parseFloat(recipient.walletBalance ?? "0");
    await db.update(usersTable).set({ walletBalance: (senderBalance - transferAmount).toString() }).where(eq(usersTable.id, sender.id));
    await db.update(usersTable).set({ walletBalance: (recipientBalance + transferAmount).toString() }).where(eq(usersTable.id, recipientId));
  } else {
    const senderHyper = parseFloat(freshSender.hyperCoinBalance ?? "0");
    if (transferAmount > senderHyper) {
      res.status(400).json({ message: `Insufficient HYPERCOIN balance. Available: $${senderHyper.toFixed(2)}` });
      return;
    }
    const recipientHyper = parseFloat(recipient.hyperCoinBalance ?? "0");
    await db.update(usersTable).set({ hyperCoinBalance: (senderHyper - transferAmount).toString() }).where(eq(usersTable.id, sender.id));
    await db.update(usersTable).set({ hyperCoinBalance: (recipientHyper + transferAmount).toString() }).where(eq(usersTable.id, recipientId));
  }

  const [updatedSender] = await db.select().from(usersTable).where(eq(usersTable.id, sender.id)).limit(1);
  res.json({
    message: `$${transferAmount.toFixed(2)} ${coin.toUpperCase()} sent to ${recipient.fullName}`,
    walletBalance: parseFloat(updatedSender.walletBalance ?? "0"),
    hyperCoinBalance: parseFloat(updatedSender.hyperCoinBalance ?? "0"),
  });
});

export default router;
