import { Router } from "express";
import { db, investmentsTable, usersTable, incomeTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { CreateInvestmentBody } from "@workspace/api-zod";

const router = Router();

function getPlanTier(amount: number) {
  if (amount >= 100 && amount <= 400) return { tier: "tier1", dailyRate: 0.006, durationDays: 300 };
  if (amount >= 500 && amount <= 900) return { tier: "tier2", dailyRate: 0.007, durationDays: 260 };
  if (amount >= 1000 && amount <= 1500) return { tier: "tier3", dailyRate: 0.008, durationDays: 225 };
  return null;
}

function investmentToResponse(inv: typeof investmentsTable.$inferSelect) {
  return {
    id: inv.id,
    userId: inv.userId,
    amount: parseFloat(inv.amount),
    planTier: inv.planTier,
    dailyRate: parseFloat(inv.dailyRate),
    durationDays: inv.durationDays,
    earnedSoFar: parseFloat(inv.earnedSoFar),
    remainingDays: inv.remainingDays,
    startDate: inv.startDate.toISOString(),
    endDate: inv.endDate.toISOString(),
    status: inv.status,
    hyperCoinAmount: parseFloat(inv.hyperCoinAmount),
    usdtAmount: parseFloat(inv.usdtAmount),
    createdAt: inv.createdAt.toISOString(),
  };
}

// GET /api/investments
router.get("/investments", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const investments = await db.select().from(investmentsTable)
    .where(eq(investmentsTable.userId, user.id))
    .orderBy(desc(investmentsTable.createdAt));
  res.json(investments.map(investmentToResponse));
});

// POST /api/investments
router.post("/investments", requireAuth, async (req, res) => {
  const parsed = CreateInvestmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid input" });
    return;
  }
  const user = (req as any).user;
  const { amount, hyperCoinAmount, usdtAmount } = parsed.data;

  if (amount % 100 !== 0) {
    res.status(400).json({ message: "Investment must be a multiple of 100" });
    return;
  }

  const plan = getPlanTier(amount);
  if (!plan) {
    res.status(400).json({ message: "Investment amount must be between 100 and 1500 USDT" });
    return;
  }

  const hyperCoinPercent = (hyperCoinAmount / amount) * 100;
  if (hyperCoinPercent < 50) {
    res.status(400).json({ message: "Minimum 50% of deposit must be in HYPERCOIN" });
    return;
  }

  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

  const [investment] = await db.insert(investmentsTable).values({
    userId: user.id,
    amount: amount.toString(),
    planTier: plan.tier,
    dailyRate: plan.dailyRate.toString(),
    durationDays: plan.durationDays,
    remainingDays: plan.durationDays,
    startDate,
    endDate,
    hyperCoinAmount: hyperCoinAmount.toString(),
    usdtAmount: usdtAmount.toString(),
    status: "active",
    earnedSoFar: "0",
  }).returning();

  // Update user's total invested
  await db.update(usersTable)
    .set({ totalInvested: (parseFloat(user.totalInvested) + amount).toString() })
    .where(eq(usersTable.id, user.id));

  // Give sponsor spot referral commission (5%)
  if (user.sponsorId) {
    const spotCommission = amount * 0.05;
    await db.insert(incomeTable).values({
      userId: user.sponsorId,
      type: "spot_referral",
      amount: spotCommission.toString(),
      description: `Spot referral commission from ${user.name}`,
      fromUserId: user.id,
      fromUserName: user.name,
    });
    const [sponsor] = await db.select().from(usersTable).where(eq(usersTable.id, user.sponsorId)).limit(1);
    if (sponsor) {
      await db.update(usersTable)
        .set({ totalEarnings: (parseFloat(sponsor.totalEarnings) + spotCommission).toString() })
        .where(eq(usersTable.id, user.sponsorId));
    }
  }

  res.status(201).json(investmentToResponse(investment));
});

// GET /api/investments/:id
router.get("/investments/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const user = (req as any).user;
  const [investment] = await db.select().from(investmentsTable)
    .where(and(eq(investmentsTable.id, id), eq(investmentsTable.userId, user.id)))
    .limit(1);
  if (!investment) {
    res.status(404).json({ message: "Investment not found" });
    return;
  }
  res.json(investmentToResponse(investment));
});

export { investmentToResponse };
export default router;
