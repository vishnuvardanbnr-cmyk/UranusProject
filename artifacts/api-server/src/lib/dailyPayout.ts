import { db, investmentsTable, usersTable, incomeTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

// Level commission rates (% of daily return credited to each upline level)
// Level 1 = direct sponsor, Level 2 = sponsor's sponsor, etc.
const LEVEL_COMMISSION_RATES: Record<number, number> = {
  1: 0.05,  // 5%
  2: 0.03,  // 3%
  3: 0.02,  // 2%
  4: 0.01,  // 1%
  5: 0.01,
  6: 0.01,
  7: 0.01,
  8: 0.01,
};

export async function processDailyPayout(): Promise<{ processed: number; skipped: number; errors: number }> {
  const stats = { processed: 0, skipped: 0, errors: 0 };

  logger.info("Daily payout started");

  const activeInvestments = await db
    .select()
    .from(investmentsTable)
    .where(eq(investmentsTable.status, "active"));

  logger.info({ count: activeInvestments.length }, "Active investments found");

  for (const inv of activeInvestments) {
    try {
      const dailyReturn = parseFloat(inv.amount) * parseFloat(inv.dailyRate);
      const newEarned = parseFloat(inv.earnedSoFar) + dailyReturn;
      const newRemaining = Math.max(0, inv.remainingDays - 1);
      const isCompleted = newRemaining === 0;

      // Update investment
      await db.update(investmentsTable)
        .set({
          earnedSoFar: newEarned.toString(),
          remainingDays: newRemaining,
          status: isCompleted ? "completed" : "active",
        })
        .where(eq(investmentsTable.id, inv.id));

      // Credit daily return income to user
      await db.insert(incomeTable).values({
        userId: inv.userId,
        type: "daily_return",
        amount: dailyReturn.toString(),
        description: `Daily return on $${parseFloat(inv.amount).toFixed(2)} investment`,
      });

      // Update user totalEarnings
      const [investor] = await db.select().from(usersTable).where(eq(usersTable.id, inv.userId)).limit(1);
      if (investor) {
        await db.update(usersTable)
          .set({ totalEarnings: (parseFloat(investor.totalEarnings) + dailyReturn).toString() })
          .where(eq(usersTable.id, inv.userId));
      }

      // Level commissions — walk up the sponsor chain
      if (investor) {
        let currentUserId = investor.sponsorId;
        let level = 1;

        while (currentUserId && level <= 8) {
          const [upline] = await db.select().from(usersTable).where(eq(usersTable.id, currentUserId)).limit(1);
          if (!upline) break;

          // Only credit if upline has unlocked this level
          if (upline.currentLevel >= level) {
            const rate = LEVEL_COMMISSION_RATES[level] ?? 0;
            const commission = dailyReturn * rate;

            if (commission > 0) {
              await db.insert(incomeTable).values({
                userId: upline.id,
                type: "level_commission",
                amount: commission.toString(),
                description: `Level ${level} commission from ${investor.name || investor.email}`,
                fromUserId: inv.userId,
                fromUserName: investor.name || investor.email,
                level,
              });

              await db.update(usersTable)
                .set({ totalEarnings: (parseFloat(upline.totalEarnings) + commission).toString() })
                .where(eq(usersTable.id, upline.id));
            }
          }

          currentUserId = upline.sponsorId;
          level++;
        }
      }

      stats.processed++;
    } catch (err) {
      logger.error({ err, investmentId: inv.id }, "Error processing daily payout for investment");
      stats.errors++;
    }
  }

  logger.info(stats, "Daily payout completed");
  return stats;
}
