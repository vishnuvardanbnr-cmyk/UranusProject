import { Router } from "express";
import { db, withdrawalsTable, usersTable, incomeTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { CreateWithdrawalBody } from "@workspace/api-zod";

const router = Router();

function withdrawalToResponse(w: typeof withdrawalsTable.$inferSelect) {
  return {
    id: w.id,
    userId: w.userId,
    userName: w.userName,
    amount: parseFloat(w.amount),
    walletAddress: w.walletAddress,
    status: w.status,
    note: w.note,
    createdAt: w.createdAt.toISOString(),
    processedAt: w.processedAt?.toISOString() ?? null,
  };
}

// GET /api/withdrawals
router.get("/withdrawals", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const withdrawals = await db.select().from(withdrawalsTable)
    .where(eq(withdrawalsTable.userId, user.id))
    .orderBy(desc(withdrawalsTable.createdAt));
  res.json(withdrawals.map(withdrawalToResponse));
});

// POST /api/withdrawals
router.post("/withdrawals", requireAuth, async (req, res) => {
  const parsed = CreateWithdrawalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid input" });
    return;
  }
  const user = (req as any).user;
  const { amount, walletAddress } = parsed.data;

  if (amount <= 0) {
    res.status(400).json({ message: "Amount must be positive" });
    return;
  }

  // Calculate available balance
  const allIncome = await db.select().from(incomeTable).where(eq(incomeTable.userId, user.id));
  const totalEarnings = allIncome.reduce((s, r) => s + parseFloat(r.amount), 0);
  const allWithdrawals = await db.select().from(withdrawalsTable).where(eq(withdrawalsTable.userId, user.id));
  const usedBalance = allWithdrawals
    .filter(w => w.status !== "rejected")
    .reduce((s, w) => s + parseFloat(w.amount), 0);
  const available = totalEarnings - usedBalance;

  if (amount > available) {
    res.status(400).json({ message: "Insufficient balance" });
    return;
  }

  const [withdrawal] = await db.insert(withdrawalsTable).values({
    userId: user.id,
    userName: user.name,
    amount: amount.toString(),
    walletAddress,
    status: "pending",
  }).returning();

  res.status(201).json(withdrawalToResponse(withdrawal));
});

export { withdrawalToResponse };
export default router;
