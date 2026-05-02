import { Router } from "express";
import { db, usersTable, investmentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

async function getTeamMembers(userId: number, maxLevel: number): Promise<Map<number, { user: typeof usersTable.$inferSelect; level: number }[]>> {
  const result = new Map<number, { user: typeof usersTable.$inferSelect; level: number }[]>();
  let currentLevelIds = [userId];

  for (let level = 1; level <= maxLevel; level++) {
    const members = await db.select().from(usersTable)
      .where(eq(usersTable.sponsorId, currentLevelIds[0]));

    // For simplicity, get all direct referrals for the whole previous level
    const allMembers: typeof usersTable.$inferSelect[] = [];
    for (const parentId of currentLevelIds) {
      const children = await db.select().from(usersTable).where(eq(usersTable.sponsorId, parentId));
      allMembers.push(...children);
    }

    if (allMembers.length === 0) break;
    result.set(level, allMembers.map(u => ({ user: u, level })));
    currentLevelIds = allMembers.map(u => u.id);
  }

  return result;
}

// GET /api/team
router.get("/team", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const teamMap = await getTeamMembers(user.id, 8);

  const levels = [];
  for (const [level, members] of teamMap.entries()) {
    let totalBusiness = 0;
    const memberData = [];
    for (const { user: m } of members) {
      const investments = await db.select().from(investmentsTable).where(eq(investmentsTable.userId, m.id));
      const invested = investments.reduce((s, i) => s + parseFloat(i.amount), 0);
      totalBusiness += invested;

      const directReferrals = await db.select().from(usersTable).where(eq(usersTable.sponsorId, m.id));

      memberData.push({
        id: m.id,
        name: m.name,
        email: m.email,
        level,
        totalInvested: parseFloat(m.totalInvested),
        joinedAt: m.createdAt.toISOString(),
        isActive: m.isActive,
        directReferrals: directReferrals.length,
      });
    }
    levels.push({ level, members: memberData, totalBusiness });
  }

  res.json({ levels });
});

// GET /api/team/stats
router.get("/team/stats", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const teamMap = await getTeamMembers(user.id, 8);

  let totalMembers = 0;
  let activeMembers = 0;
  let totalTeamBusiness = 0;

  // Get 3-leg stats
  const directRefs = await db.select().from(usersTable).where(eq(usersTable.sponsorId, user.id));
  const directReferrals = directRefs.length;

  const lugsStats = [];
  for (let i = 0; i < Math.min(directRefs.length, 3); i++) {
    const legUser = directRefs[i];
    const legInvestments = await db.select().from(investmentsTable).where(eq(investmentsTable.userId, legUser.id));
    const legBusiness = legInvestments.reduce((s, inv) => s + parseFloat(inv.amount), 0);
    lugsStats.push({ lugIndex: i + 1, business: legBusiness });
  }

  for (const [, members] of teamMap.entries()) {
    totalMembers += members.length;
    activeMembers += members.filter(m => m.user.isActive).length;
    for (const { user: m } of members) {
      totalTeamBusiness += parseFloat(m.totalInvested);
    }
  }

  // Level unlock requirements
  const levelRequirements: Record<number, number> = {
    1: 0, 2: 1000, 3: 3000, 4: 10000,
    5: 10000, 6: 10000, 7: 10000, 8: 10000,
  };

  const currentLevel = user.currentLevel;
  const nextLevel = currentLevel + 1;
  const nextLevelRequirement = levelRequirements[nextLevel] || 0;
  const currentEarnings = parseFloat(user.totalEarnings);
  const nextLevelProgress = nextLevelRequirement > 0
    ? Math.min(100, (currentEarnings / nextLevelRequirement) * 100)
    : 100;

  res.json({
    totalMembers,
    directReferrals,
    totalTeamBusiness,
    activeMembers,
    currentLevel,
    nextLevelRequirement,
    nextLevelProgress,
    levelsUnlocked: currentLevel,
    lugsStats: lugsStats.length > 0 ? lugsStats : [{ lugIndex: 1, business: 0 }],
  });
});

// GET /api/team/referral-link
router.get("/team/referral-link", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const directRefs = await db.select().from(usersTable).where(eq(usersTable.sponsorId, user.id));
  
  const domain = process.env.REPLIT_DOMAINS?.split(",")[0] || "localhost";
  const referralLink = `https://${domain}/register?ref=${user.referralCode}`;

  // Calculate spot commission earned
  const { incomeTable } = await import("@workspace/db");
  const { eq: eqIncome, and: andIncome } = await import("drizzle-orm");
  const spotIncome = await db.select().from(incomeTable)
    .where(andIncome(eq(incomeTable.userId, user.id), eq(incomeTable.type, "spot_referral")));
  const spotCommissionEarned = spotIncome.reduce((s, r) => s + parseFloat(r.amount), 0);

  res.json({
    referralCode: user.referralCode,
    referralLink,
    totalReferrals: directRefs.length,
    spotCommissionEarned,
  });
});

export default router;
