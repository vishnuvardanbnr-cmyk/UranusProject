import { Router } from "express";
import { db, hcDepositRequestsTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth";

const router = Router();

// POST /api/hc-deposits — user submits HC deposit request
router.post("/hc-deposits", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const { screenshotUrl } = req.body;

  if (!screenshotUrl) {
    res.status(400).json({ error: "Screenshot is required" });
    return;
  }

  const [record] = await db.insert(hcDepositRequestsTable).values({
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    referralCode: user.referralCode,
    screenshotUrl,
  }).returning();

  res.json(record);
});

// GET /api/hc-deposits — user's own requests
router.get("/hc-deposits", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const records = await db
    .select()
    .from(hcDepositRequestsTable)
    .where(eq(hcDepositRequestsTable.userId, user.id))
    .orderBy(desc(hcDepositRequestsTable.createdAt));
  res.json(records);
});

// GET /api/admin/hc-deposits — admin list all
router.get("/admin/hc-deposits", requireAdmin, async (_req, res) => {
  const records = await db
    .select()
    .from(hcDepositRequestsTable)
    .orderBy(desc(hcDepositRequestsTable.createdAt));
  res.json(records);
});

// PUT /api/admin/hc-deposits/:id/approve — admin approves with amount
router.put("/admin/hc-deposits/:id/approve", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const { amount } = req.body;

  if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
    res.status(400).json({ error: "Valid positive amount is required" });
    return;
  }

  const [record] = await db
    .select()
    .from(hcDepositRequestsTable)
    .where(eq(hcDepositRequestsTable.id, id))
    .limit(1);

  if (!record) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  if (record.status !== "pending") {
    res.status(400).json({ error: "Request already processed" });
    return;
  }

  const [targetUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, record.userId))
    .limit(1);

  if (!targetUser) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const newBalance = (parseFloat(targetUser.hyperCoinBalance ?? "0") + parseFloat(amount)).toFixed(6);

  await db.update(usersTable)
    .set({ hyperCoinBalance: newBalance })
    .where(eq(usersTable.id, targetUser.id));

  await db.update(hcDepositRequestsTable)
    .set({ status: "approved", amount: String(amount), processedAt: new Date() })
    .where(eq(hcDepositRequestsTable.id, id));

  res.json({ success: true });
});

// PUT /api/admin/hc-deposits/:id/reject — admin rejects
router.put("/admin/hc-deposits/:id/reject", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const { note } = req.body;

  const [record] = await db
    .select()
    .from(hcDepositRequestsTable)
    .where(eq(hcDepositRequestsTable.id, id))
    .limit(1);

  if (!record) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  if (record.status !== "pending") {
    res.status(400).json({ error: "Request already processed" });
    return;
  }

  await db.update(hcDepositRequestsTable)
    .set({ status: "rejected", note: note ?? null, processedAt: new Date() })
    .where(eq(hcDepositRequestsTable.id, id));

  res.json({ success: true });
});

export default router;
