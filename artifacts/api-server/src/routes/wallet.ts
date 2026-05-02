import { Router } from "express";
import { db, usersTable, platformSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
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
    launchOfferActive: settings?.launchOfferActive ?? true,
    launchOfferEndDate: settings?.launchOfferEndDate ? settings.launchOfferEndDate.toISOString() : null,
  });
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

  const currentUsdt = parseFloat(freshUser.walletBalance ?? "0");
  const currentHyper = parseFloat(freshUser.hyperCoinBalance ?? "0");

  if (direction === "usdt_to_hypercoin") {
    if (transferAmount > currentUsdt) {
      res.status(400).json({ message: `Insufficient USDT balance. Available: $${currentUsdt.toFixed(2)}` });
      return;
    }
    await db.update(usersTable)
      .set({
        walletBalance: (currentUsdt - transferAmount).toString(),
        hyperCoinBalance: (currentHyper + transferAmount).toString(),
      })
      .where(eq(usersTable.id, user.id));
  } else {
    if (transferAmount > currentHyper) {
      res.status(400).json({ message: `Insufficient HYPERCOIN balance. Available: $${currentHyper.toFixed(2)}` });
      return;
    }
    await db.update(usersTable)
      .set({
        walletBalance: (currentUsdt + transferAmount).toString(),
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
