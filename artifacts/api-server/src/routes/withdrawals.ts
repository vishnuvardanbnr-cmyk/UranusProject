import { Router } from "express";
import { db, withdrawalsTable, usersTable, incomeTable, otpCodesTable, platformSettingsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { CreateWithdrawalBody } from "@workspace/api-zod";
import { isOtpWithdrawalEnabled } from "../lib/email";
import { getSettings, sendUsdtToAddress } from "../lib/blockchain";
import { logger } from "../lib/logger";
import { resolveKey } from "../lib/keyEncryption.js";

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
    txHash: w.txHash ?? null,
    processingError: w.processingError ?? null,
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

  if (user.withdrawalBlocked) {
    res.status(403).json({
      message: user.blockReason
        ? `Withdrawals are blocked: ${user.blockReason}`
        : "Withdrawals have been blocked on your account. Please contact support.",
    });
    return;
  }

  // OTP verification
  const otpRequired = await isOtpWithdrawalEnabled();
  if (otpRequired) {
    const otp = req.body.otp as string | undefined;
    if (!otp) {
      res.status(400).json({ message: "OTP required for withdrawal" });
      return;
    }
    const now = new Date();
    const [otpRecord] = await db.select().from(otpCodesTable)
      .where(and(
        eq(otpCodesTable.email, user.email),
        eq(otpCodesTable.purpose, "withdrawal"),
        eq(otpCodesTable.used, false),
      ))
      .orderBy(desc(otpCodesTable.createdAt))
      .limit(1);
    if (!otpRecord || otpRecord.code !== otp || otpRecord.expiresAt < now) {
      res.status(400).json({ message: "Invalid or expired OTP" });
      return;
    }
    await db.update(otpCodesTable).set({ used: true }).where(eq(otpCodesTable.id, otpRecord.id));
  }

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

  // Insert with pending status first
  const [withdrawal] = await db.insert(withdrawalsTable).values({
    userId: user.id,
    userName: user.name,
    amount: amount.toString(),
    walletAddress,
    status: "pending",
  }).returning();

  // Check withdrawal mode — auto-process if configured
  const settings = await getSettings();
  const withdrawPlaintextKey = settings ? resolveKey(settings.withdrawWalletPrivateKey) : null;
  const gasPlaintextKey = settings ? resolveKey(settings.gasWalletPrivateKey) : null;
  if (settings && settings.withdrawalMode === "auto" && withdrawPlaintextKey && gasPlaintextKey) {
    // Mark as processing so the user sees immediate feedback
    await db.update(withdrawalsTable)
      .set({ status: "processing" })
      .where(eq(withdrawalsTable.id, withdrawal.id));

    // Fire-and-forget the on-chain send, update record when done
    (async () => {
      try {
        const result = await sendUsdtToAddress(
          walletAddress,
          amount,
          withdrawPlaintextKey,
          gasPlaintextKey,
          settings.bscRpcUrl || "https://bsc-dataseed.binance.org/",
        );
        if (result.success) {
          await db.update(withdrawalsTable)
            .set({ status: "approved", txHash: result.txHash, processedAt: new Date() })
            .where(eq(withdrawalsTable.id, withdrawal.id));
          logger.info({ withdrawalId: withdrawal.id, txHash: result.txHash }, "Auto withdrawal sent");
        } else {
          await db.update(withdrawalsTable)
            .set({ status: "pending", processingError: result.error })
            .where(eq(withdrawalsTable.id, withdrawal.id));
          logger.error({ withdrawalId: withdrawal.id, error: result.error }, "Auto withdrawal failed, reverted to pending");
        }
      } catch (err: any) {
        await db.update(withdrawalsTable)
          .set({ status: "pending", processingError: err?.message })
          .where(eq(withdrawalsTable.id, withdrawal.id));
        logger.error({ withdrawalId: withdrawal.id, err }, "Auto withdrawal exception, reverted to pending");
      }
    })();

    const [processing] = await db.select().from(withdrawalsTable).where(eq(withdrawalsTable.id, withdrawal.id)).limit(1);
    res.status(201).json(withdrawalToResponse(processing));
    return;
  }

  res.status(201).json(withdrawalToResponse(withdrawal));
});

export { withdrawalToResponse };
export default router;
