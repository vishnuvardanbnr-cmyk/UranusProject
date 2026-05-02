import { Router } from "express";
import { db, investmentsTable, usersTable, incomeTable, platformSettingsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { CreateInvestmentBody } from "@workspace/api-zod";
import { sendDepositConfirmationEmail } from "../lib/email";

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

  // Fetch configurable HYPERCOIN minimum from admin settings
  const [settings] = await db.select().from(platformSettingsTable).limit(1);
  const hyperCoinMinPercent = parseFloat(settings?.hyperCoinMinPercent ?? "50");

  const hyperCoinPercent = (hyperCoinAmount / amount) * 100;
  if (hyperCoinPercent < hyperCoinMinPercent) {
    res.status(400).json({ message: `Minimum ${hyperCoinMinPercent}% of deposit must be in HYPERCOIN` });
    return;
  }

  // Fetch fresh user to check balances
  const [freshUser] = await db.select().from(usersTable).where(eq(usersTable.id, user.id)).limit(1);
  if (!freshUser) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const currentUsdt = parseFloat(freshUser.walletBalance ?? "0");
  const currentHyper = parseFloat(freshUser.hyperCoinBalance ?? "0");

  if (usdtAmount > currentUsdt) {
    res.status(400).json({ message: `Insufficient USDT balance. Available: $${currentUsdt.toFixed(2)}` });
    return;
  }
  if (hyperCoinAmount > currentHyper) {
    res.status(400).json({ message: `Insufficient HYPERCOIN balance. Available: $${currentHyper.toFixed(2)}` });
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

  // Deduct USDT and HYPERCOIN from user balances
  await db.update(usersTable)
    .set({
      totalInvested: (parseFloat(freshUser.totalInvested) + amount).toString(),
      walletBalance: (currentUsdt - usdtAmount).toString(),
      hyperCoinBalance: (currentHyper - hyperCoinAmount).toString(),
    })
    .where(eq(usersTable.id, user.id));

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

  // Send deposit confirmation email (fire-and-forget)
  const planLabel = `${plan.tier.toUpperCase()} — ${(plan.dailyRate * 100).toFixed(1)}%/day, ${plan.durationDays} days`;
  sendDepositConfirmationEmail(user.email, user.name, amount, planLabel).catch(() => {});

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
