import { Router } from "express";
import { db, usersTable, investmentsTable, withdrawalsTable, incomeTable, platformSettingsTable, offersTable } from "@workspace/db";
import { eq, desc, ilike, or, and } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";
import { UpdateAdminUserBody, UpdateAdminInvestmentBody, UpdateAdminSettingsBody, ListAdminUsersQueryParams, ListAdminInvestmentsQueryParams, ListAdminWithdrawalsQueryParams } from "@workspace/api-zod";
import { withdrawalToResponse } from "./withdrawals";
import { investmentToResponse } from "./investments";
import { z } from "zod";

const SmtpSettingsBody = z.object({
  smtpEnabled: z.boolean(),
  smtpHost: z.string(),
  smtpPort: z.number().int(),
  smtpUser: z.string(),
  smtpPassword: z.string(),
  smtpFrom: z.string(),
  smtpFromName: z.string(),
  otpRegistrationEnabled: z.boolean(),
  otpWithdrawalEnabled: z.boolean(),
  depositConfirmationEnabled: z.boolean(),
});

const router = Router();

function userToResponse(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    referralCode: user.referralCode,
    sponsorId: user.sponsorId,
    walletAddress: user.walletAddress,
    country: user.country,
    profileImage: user.profileImage,
    currentLevel: user.currentLevel,
    currentRankId: user.currentRankId,
    isAdmin: user.isAdmin,
    isActive: user.isActive,
    profileComplete: user.profileComplete,
    totalEarnings: parseFloat(user.totalEarnings),
    totalInvested: parseFloat(user.totalInvested),
    createdAt: user.createdAt.toISOString(),
  };
}

// GET /api/admin/stats
router.get("/admin/stats", requireAdmin, async (req, res) => {
  const allUsers = await db.select().from(usersTable);
  const allInvestments = await db.select().from(investmentsTable);
  const allWithdrawals = await db.select().from(withdrawalsTable);
  const allIncome = await db.select().from(incomeTable);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalUsers = allUsers.length;
  const activeUsers = allUsers.filter(u => u.isActive).length;
  const totalInvested = allInvestments.reduce((s, i) => s + parseFloat(i.amount), 0);
  const totalWithdrawn = allWithdrawals.filter(w => w.status === "approved").reduce((s, w) => s + parseFloat(w.amount), 0);
  const pendingWithdrawals = allWithdrawals.filter(w => w.status === "pending").reduce((s, w) => s + parseFloat(w.amount), 0);
  const totalCommissionsPaid = allIncome.filter(i => i.type !== "daily_return").reduce((s, i) => s + parseFloat(i.amount), 0);
  const newUsersToday = allUsers.filter(u => u.createdAt >= today).length;
  const newInvestmentsToday = allInvestments.filter(i => i.createdAt >= today).reduce((s, i) => s + parseFloat(i.amount), 0);
  const activeInvestments = allInvestments.filter(i => i.status === "active").length;
  const completedInvestments = allInvestments.filter(i => i.status === "completed").length;

  res.json({
    totalUsers,
    activeUsers,
    totalInvested,
    totalWithdrawn,
    pendingWithdrawals,
    totalCommissionsPaid,
    newUsersToday,
    newInvestmentsToday,
    activeInvestments,
    completedInvestments,
  });
});

// GET /api/admin/users
router.get("/admin/users", requireAdmin, async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = req.query.search as string | undefined;
  const offset = (page - 1) * limit;

  let allUsers = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));

  if (search) {
    const s = search.toLowerCase();
    allUsers = allUsers.filter(u =>
      u.name.toLowerCase().includes(s) ||
      u.email.toLowerCase().includes(s) ||
      u.phone.includes(s)
    );
  }

  const paginated = allUsers.slice(offset, offset + limit);
  res.json({
    users: paginated.map(userToResponse),
    total: allUsers.length,
    page,
    limit,
  });
});

// GET /api/admin/users/:id
router.get("/admin/users/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  const investments = await db.select().from(investmentsTable).where(eq(investmentsTable.userId, id));
  const directReferrals = await db.select().from(usersTable).where(eq(usersTable.sponsorId, id));

  res.json({
    user: userToResponse(user),
    investments: investments.map(investmentToResponse),
    totalTeamSize: directReferrals.length,
    directReferrals: directReferrals.length,
  });
});

// PUT /api/admin/users/:id
router.put("/admin/users/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const parsed = UpdateAdminUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid input" });
    return;
  }
  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (parsed.data.isActive !== undefined) updates.isActive = parsed.data.isActive;
  if (parsed.data.isAdmin !== undefined) updates.isAdmin = parsed.data.isAdmin;
  if (parsed.data.currentLevel !== undefined) updates.currentLevel = parsed.data.currentLevel;

  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning();
  if (!updated) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  res.json(userToResponse(updated));
});

// GET /api/admin/investments
router.get("/admin/investments", requireAdmin, async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as string | undefined;
  const offset = (page - 1) * limit;

  let allInvestments = await db.select().from(investmentsTable).orderBy(desc(investmentsTable.createdAt));
  if (status) {
    allInvestments = allInvestments.filter(i => i.status === status);
  }

  const paginated = allInvestments.slice(offset, offset + limit);
  res.json({
    investments: paginated.map(investmentToResponse),
    total: allInvestments.length,
    page,
    limit,
  });
});

// PUT /api/admin/investments/:id
router.put("/admin/investments/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const parsed = UpdateAdminInvestmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid input" });
    return;
  }
  const [updated] = await db.update(investmentsTable)
    .set({ status: parsed.data.status })
    .where(eq(investmentsTable.id, id))
    .returning();
  if (!updated) {
    res.status(404).json({ message: "Investment not found" });
    return;
  }
  res.json(investmentToResponse(updated));
});

// GET /api/admin/withdrawals
router.get("/admin/withdrawals", requireAdmin, async (req, res) => {
  const status = req.query.status as string | undefined;
  let withdrawals = await db.select().from(withdrawalsTable).orderBy(desc(withdrawalsTable.createdAt));
  if (status) {
    withdrawals = withdrawals.filter(w => w.status === status);
  }
  res.json(withdrawals.map(withdrawalToResponse));
});

// POST /api/admin/withdrawals/:id/approve
router.post("/admin/withdrawals/:id/approve", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const [withdrawal] = await db.select().from(withdrawalsTable).where(eq(withdrawalsTable.id, id)).limit(1);
  if (!withdrawal) {
    res.status(404).json({ message: "Withdrawal not found" });
    return;
  }

  // Try to send on-chain if withdraw wallet is configured
  const settings = await db.select().from(platformSettingsTable).limit(1).then(r => r[0] ?? null);
  if (settings && settings.withdrawWalletPrivateKey && settings.gasWalletPrivateKey) {
    // Mark processing immediately
    await db.update(withdrawalsTable)
      .set({ status: "processing" })
      .where(eq(withdrawalsTable.id, id));
    res.json(withdrawalToResponse({ ...withdrawal, status: "processing" }));

    // Send on-chain async
    (async () => {
      try {
        const { sendUsdtToAddress } = await import("../lib/blockchain.js");
        const result = await sendUsdtToAddress(
          withdrawal.walletAddress,
          parseFloat(withdrawal.amount),
          settings.withdrawWalletPrivateKey,
          settings.gasWalletPrivateKey,
          settings.bscRpcUrl || "https://bsc-dataseed.binance.org/",
        );
        if (result.success) {
          await db.update(withdrawalsTable)
            .set({ status: "approved", txHash: result.txHash, processedAt: new Date(), processingError: null })
            .where(eq(withdrawalsTable.id, id));
        } else {
          await db.update(withdrawalsTable)
            .set({ status: "pending", processingError: result.error })
            .where(eq(withdrawalsTable.id, id));
        }
      } catch (err: any) {
        await db.update(withdrawalsTable)
          .set({ status: "pending", processingError: err?.message })
          .where(eq(withdrawalsTable.id, id));
      }
    })();
    return;
  }

  // No withdraw wallet configured — approve without on-chain tx
  const [updated] = await db.update(withdrawalsTable)
    .set({ status: "approved", processedAt: new Date() })
    .where(eq(withdrawalsTable.id, id))
    .returning();
  res.json(withdrawalToResponse(updated));
});

// POST /api/admin/withdrawals/:id/reject
router.post("/admin/withdrawals/:id/reject", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const note = typeof req.body?.note === "string" ? req.body.note.trim() : null;
  const [updated] = await db.update(withdrawalsTable)
    .set({ status: "rejected", processedAt: new Date(), note: note || null })
    .where(eq(withdrawalsTable.id, id))
    .returning();
  if (!updated) {
    res.status(404).json({ message: "Withdrawal not found" });
    return;
  }
  res.json(withdrawalToResponse(updated));
});

// GET /api/admin/settings
router.get("/admin/settings", requireAdmin, async (req, res) => {
  const [settings] = await db.select().from(platformSettingsTable).limit(1);
  if (!settings) {
    // Create default settings
    const [created] = await db.insert(platformSettingsTable).values({}).returning();
    res.json({
      maintenanceMode: created.maintenanceMode,
      minDeposit: parseFloat(created.minDeposit),
      maxDeposit: parseFloat(created.maxDeposit),
      hyperCoinMinPercent: parseFloat(created.hyperCoinMinPercent),
      spotReferralRate: parseFloat(created.spotReferralRate),
      launchOfferActive: created.launchOfferActive,
      withdrawalEnabled: created.withdrawalEnabled,
      launchOfferEndDate: created.launchOfferEndDate ? created.launchOfferEndDate.toISOString().slice(0, 16) : "",
    });
    return;
  }
  res.json({
    maintenanceMode: settings.maintenanceMode,
    minDeposit: parseFloat(settings.minDeposit),
    maxDeposit: parseFloat(settings.maxDeposit),
    hyperCoinMinPercent: parseFloat(settings.hyperCoinMinPercent),
    spotReferralRate: parseFloat(settings.spotReferralRate),
    launchOfferActive: settings.launchOfferActive,
    withdrawalEnabled: settings.withdrawalEnabled,
    launchOfferEndDate: settings.launchOfferEndDate ? settings.launchOfferEndDate.toISOString().slice(0, 16) : "",
  });
});

// PUT /api/admin/settings
router.put("/admin/settings", requireAdmin, async (req, res) => {
  const parsed = UpdateAdminSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid input" });
    return;
  }
  const [existing] = await db.select().from(platformSettingsTable).limit(1);
  let updated;
  if (existing) {
    const updates: Partial<typeof platformSettingsTable.$inferInsert> = {};
    if (parsed.data.maintenanceMode !== undefined) updates.maintenanceMode = parsed.data.maintenanceMode;
    if (parsed.data.launchOfferActive !== undefined) updates.launchOfferActive = parsed.data.launchOfferActive;
    if (parsed.data.withdrawalEnabled !== undefined) updates.withdrawalEnabled = parsed.data.withdrawalEnabled;
    if (parsed.data.minDeposit !== undefined) updates.minDeposit = parsed.data.minDeposit.toString();
    if (parsed.data.maxDeposit !== undefined) updates.maxDeposit = parsed.data.maxDeposit.toString();
    if (parsed.data.hyperCoinMinPercent !== undefined) updates.hyperCoinMinPercent = parsed.data.hyperCoinMinPercent.toString();
    if (parsed.data.spotReferralRate !== undefined) updates.spotReferralRate = parsed.data.spotReferralRate.toString();
    if (parsed.data.launchOfferEndDate !== undefined) {
      updates.launchOfferEndDate = parsed.data.launchOfferEndDate ? new Date(parsed.data.launchOfferEndDate) : null;
    }
    [updated] = await db.update(platformSettingsTable).set(updates).where(eq(platformSettingsTable.id, existing.id)).returning();
  } else {
    [updated] = await db.insert(platformSettingsTable).values({}).returning();
  }
  res.json({
    maintenanceMode: updated.maintenanceMode,
    minDeposit: parseFloat(updated.minDeposit),
    maxDeposit: parseFloat(updated.maxDeposit),
    hyperCoinMinPercent: parseFloat(updated.hyperCoinMinPercent),
    spotReferralRate: parseFloat(updated.spotReferralRate),
    launchOfferActive: updated.launchOfferActive,
    withdrawalEnabled: updated.withdrawalEnabled,
    launchOfferEndDate: updated.launchOfferEndDate ? updated.launchOfferEndDate.toISOString().slice(0, 16) : "",
  });
});

// GET /api/admin/withdrawal-settings
router.get("/admin/withdrawal-settings", requireAdmin, async (req, res) => {
  let [settings] = await db.select().from(platformSettingsTable).limit(1);
  if (!settings) {
    [settings] = await db.insert(platformSettingsTable).values({}).returning();
  }
  res.json({
    withdrawalMode: settings.withdrawalMode,
    withdrawWalletPrivateKey: settings.withdrawWalletPrivateKey,
  });
});

// PUT /api/admin/withdrawal-settings
router.put("/admin/withdrawal-settings", requireAdmin, async (req, res) => {
  const body = z.object({
    withdrawalMode: z.enum(["auto", "manual"]),
    withdrawWalletPrivateKey: z.string(),
  }).safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ message: "Invalid input" });
    return;
  }
  const [existing] = await db.select().from(platformSettingsTable).limit(1);
  let updated;
  if (existing) {
    [updated] = await db.update(platformSettingsTable)
      .set({ withdrawalMode: body.data.withdrawalMode, withdrawWalletPrivateKey: body.data.withdrawWalletPrivateKey })
      .where(eq(platformSettingsTable.id, existing.id))
      .returning();
  } else {
    [updated] = await db.insert(platformSettingsTable)
      .values({ withdrawalMode: body.data.withdrawalMode, withdrawWalletPrivateKey: body.data.withdrawWalletPrivateKey })
      .returning();
  }
  res.json({ withdrawalMode: updated.withdrawalMode, withdrawWalletPrivateKey: updated.withdrawWalletPrivateKey });
});

// GET /api/admin/smtp-settings
router.get("/admin/smtp-settings", requireAdmin, async (req, res) => {
  let [settings] = await db.select().from(platformSettingsTable).limit(1);
  if (!settings) {
    [settings] = await db.insert(platformSettingsTable).values({}).returning();
  }
  res.json({
    smtpEnabled: settings.smtpEnabled,
    smtpHost: settings.smtpHost,
    smtpPort: settings.smtpPort,
    smtpUser: settings.smtpUser,
    smtpPassword: settings.smtpPassword,
    smtpFrom: settings.smtpFrom,
    smtpFromName: settings.smtpFromName,
    otpRegistrationEnabled: settings.otpRegistrationEnabled,
    otpWithdrawalEnabled: settings.otpWithdrawalEnabled,
    depositConfirmationEnabled: settings.depositConfirmationEnabled,
  });
});

// PUT /api/admin/smtp-settings
router.put("/admin/smtp-settings", requireAdmin, async (req, res) => {
  const parsed = SmtpSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid input" });
    return;
  }
  const [existing] = await db.select().from(platformSettingsTable).limit(1);
  let updated;
  if (existing) {
    [updated] = await db.update(platformSettingsTable)
      .set({
        smtpEnabled: parsed.data.smtpEnabled,
        smtpHost: parsed.data.smtpHost,
        smtpPort: parsed.data.smtpPort,
        smtpUser: parsed.data.smtpUser,
        smtpPassword: parsed.data.smtpPassword,
        smtpFrom: parsed.data.smtpFrom,
        smtpFromName: parsed.data.smtpFromName,
        otpRegistrationEnabled: parsed.data.otpRegistrationEnabled,
        otpWithdrawalEnabled: parsed.data.otpWithdrawalEnabled,
        depositConfirmationEnabled: parsed.data.depositConfirmationEnabled,
      })
      .where(eq(platformSettingsTable.id, existing.id))
      .returning();
  } else {
    [updated] = await db.insert(platformSettingsTable).values({
      smtpEnabled: parsed.data.smtpEnabled,
      smtpHost: parsed.data.smtpHost,
      smtpPort: parsed.data.smtpPort,
      smtpUser: parsed.data.smtpUser,
      smtpPassword: parsed.data.smtpPassword,
      smtpFrom: parsed.data.smtpFrom,
      smtpFromName: parsed.data.smtpFromName,
      otpRegistrationEnabled: parsed.data.otpRegistrationEnabled,
      otpWithdrawalEnabled: parsed.data.otpWithdrawalEnabled,
      depositConfirmationEnabled: parsed.data.depositConfirmationEnabled,
    }).returning();
  }
  res.json({
    smtpEnabled: updated.smtpEnabled,
    smtpHost: updated.smtpHost,
    smtpPort: updated.smtpPort,
    smtpUser: updated.smtpUser,
    smtpPassword: updated.smtpPassword,
    smtpFrom: updated.smtpFrom,
    smtpFromName: updated.smtpFromName,
    otpRegistrationEnabled: updated.otpRegistrationEnabled,
    otpWithdrawalEnabled: updated.otpWithdrawalEnabled,
    depositConfirmationEnabled: updated.depositConfirmationEnabled,
  });
});

// GET /api/admin/income-settings
router.get("/admin/income-settings", requireAdmin, async (req, res) => {
  let [s] = await db.select().from(platformSettingsTable).limit(1);
  if (!s) {
    [s] = await db.insert(platformSettingsTable).values({}).returning();
  }
  res.json({
    spotReferralRate: parseFloat(s.spotReferralRate) * 100,
    tier1DailyRate:   parseFloat(s.tier1DailyRate) * 100,
    tier2DailyRate:   parseFloat(s.tier2DailyRate) * 100,
    tier3DailyRate:   parseFloat(s.tier3DailyRate) * 100,
    tier1Days: s.tier1Days,
    tier2Days: s.tier2Days,
    tier3Days: s.tier3Days,
    levelCommL1: parseFloat(s.levelCommL1) * 100,
    levelCommL2: parseFloat(s.levelCommL2) * 100,
    levelCommL3: parseFloat(s.levelCommL3) * 100,
    levelCommL4: parseFloat(s.levelCommL4) * 100,
    levelCommL5: parseFloat(s.levelCommL5) * 100,
    levelCommL6: parseFloat(s.levelCommL6) * 100,
    levelCommL7: parseFloat(s.levelCommL7) * 100,
    levelCommL8: parseFloat(s.levelCommL8) * 100,
    levelUnlockL2: parseFloat(s.levelUnlockL2),
    levelUnlockL3: parseFloat(s.levelUnlockL3),
    levelUnlockL4: parseFloat(s.levelUnlockL4),
    levelUnlockL5: parseFloat(s.levelUnlockL5),
    levelUnlockL6: parseFloat(s.levelUnlockL6),
    levelUnlockL7: parseFloat(s.levelUnlockL7),
    levelUnlockL8: parseFloat(s.levelUnlockL8),
  });
});

const IncomeSettingsBody = z.object({
  spotReferralRate: z.number().min(0).max(100),
  tier1DailyRate:  z.number().min(0).max(100),
  tier2DailyRate:  z.number().min(0).max(100),
  tier3DailyRate:  z.number().min(0).max(100),
  tier1Days: z.number().int().min(1),
  tier2Days: z.number().int().min(1),
  tier3Days: z.number().int().min(1),
  levelCommL1: z.number().min(0).max(100),
  levelCommL2: z.number().min(0).max(100),
  levelCommL3: z.number().min(0).max(100),
  levelCommL4: z.number().min(0).max(100),
  levelCommL5: z.number().min(0).max(100),
  levelCommL6: z.number().min(0).max(100),
  levelCommL7: z.number().min(0).max(100),
  levelCommL8: z.number().min(0).max(100),
  levelUnlockL2: z.number().min(0),
  levelUnlockL3: z.number().min(0),
  levelUnlockL4: z.number().min(0),
  levelUnlockL5: z.number().min(0),
  levelUnlockL6: z.number().min(0),
  levelUnlockL7: z.number().min(0),
  levelUnlockL8: z.number().min(0),
});

// PUT /api/admin/income-settings
router.put("/admin/income-settings", requireAdmin, async (req, res) => {
  const parsed = IncomeSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid input" });
    return;
  }
  const d = parsed.data;
  const updates = {
    spotReferralRate: (d.spotReferralRate / 100).toString(),
    tier1DailyRate:  (d.tier1DailyRate  / 100).toString(),
    tier2DailyRate:  (d.tier2DailyRate  / 100).toString(),
    tier3DailyRate:  (d.tier3DailyRate  / 100).toString(),
    tier1Days: d.tier1Days,
    tier2Days: d.tier2Days,
    tier3Days: d.tier3Days,
    levelCommL1: (d.levelCommL1 / 100).toString(),
    levelCommL2: (d.levelCommL2 / 100).toString(),
    levelCommL3: (d.levelCommL3 / 100).toString(),
    levelCommL4: (d.levelCommL4 / 100).toString(),
    levelCommL5: (d.levelCommL5 / 100).toString(),
    levelCommL6: (d.levelCommL6 / 100).toString(),
    levelCommL7: (d.levelCommL7 / 100).toString(),
    levelCommL8: (d.levelCommL8 / 100).toString(),
    levelUnlockL2: d.levelUnlockL2.toString(),
    levelUnlockL3: d.levelUnlockL3.toString(),
    levelUnlockL4: d.levelUnlockL4.toString(),
    levelUnlockL5: d.levelUnlockL5.toString(),
    levelUnlockL6: d.levelUnlockL6.toString(),
    levelUnlockL7: d.levelUnlockL7.toString(),
    levelUnlockL8: d.levelUnlockL8.toString(),
  };
  const [existing] = await db.select().from(platformSettingsTable).limit(1);
  let s;
  if (existing) {
    [s] = await db.update(platformSettingsTable).set(updates).where(eq(platformSettingsTable.id, existing.id)).returning();
  } else {
    [s] = await db.insert(platformSettingsTable).values(updates).returning();
  }
  res.json({
    spotReferralRate: parseFloat(s.spotReferralRate) * 100,
    tier1DailyRate:   parseFloat(s.tier1DailyRate) * 100,
    tier2DailyRate:   parseFloat(s.tier2DailyRate) * 100,
    tier3DailyRate:   parseFloat(s.tier3DailyRate) * 100,
    tier1Days: s.tier1Days,
    tier2Days: s.tier2Days,
    tier3Days: s.tier3Days,
    levelCommL1: parseFloat(s.levelCommL1) * 100,
    levelCommL2: parseFloat(s.levelCommL2) * 100,
    levelCommL3: parseFloat(s.levelCommL3) * 100,
    levelCommL4: parseFloat(s.levelCommL4) * 100,
    levelCommL5: parseFloat(s.levelCommL5) * 100,
    levelCommL6: parseFloat(s.levelCommL6) * 100,
    levelCommL7: parseFloat(s.levelCommL7) * 100,
    levelCommL8: parseFloat(s.levelCommL8) * 100,
    levelUnlockL2: parseFloat(s.levelUnlockL2),
    levelUnlockL3: parseFloat(s.levelUnlockL3),
    levelUnlockL4: parseFloat(s.levelUnlockL4),
    levelUnlockL5: parseFloat(s.levelUnlockL5),
    levelUnlockL6: parseFloat(s.levelUnlockL6),
    levelUnlockL7: parseFloat(s.levelUnlockL7),
    levelUnlockL8: parseFloat(s.levelUnlockL8),
  });
});

// ── Offers CRUD ──────────────────────────────────────────────────────────────

const OfferBody = z.object({
  title: z.string().min(1),
  subtitle: z.string().default(""),
  emoji: z.string().default("🎁"),
  reward: z.string().default(""),
  endDate: z.string().nullable().optional(),
  active: z.boolean().default(true),
  criteria: z.array(z.union([
    z.object({ type: z.literal("self_invest"),    label: z.string(), target: z.number() }),
    z.object({ type: z.literal("team_business"),  label: z.string(), target: z.number() }),
    z.object({ type: z.literal("leg"), legIndex: z.number().int(), label: z.string(), target: z.number() }),
  ])).default([]),
});

function offerToResponse(o: typeof offersTable.$inferSelect) {
  return {
    id: o.id,
    title: o.title,
    subtitle: o.subtitle,
    emoji: o.emoji,
    reward: o.reward,
    endDate: o.endDate ? o.endDate.toISOString().slice(0, 16) : null,
    active: o.active,
    criteria: o.criteria,
    createdAt: o.createdAt,
  };
}

// GET /api/admin/offers
router.get("/admin/offers", requireAdmin, async (_req, res) => {
  const offers = await db.select().from(offersTable).orderBy(offersTable.createdAt);
  res.json(offers.map(offerToResponse));
});

// POST /api/admin/offers
router.post("/admin/offers", requireAdmin, async (req, res) => {
  const parsed = OfferBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ message: "Invalid input" }); return; }
  const { endDate, ...rest } = parsed.data;
  const [created] = await db.insert(offersTable).values({
    ...rest,
    endDate: endDate ? new Date(endDate) : null,
  }).returning();
  res.json(offerToResponse(created));
});

// PUT /api/admin/offers/:id
router.put("/admin/offers/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ message: "Invalid ID" }); return; }
  const parsed = OfferBody.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ message: "Invalid input" }); return; }
  const { endDate, ...rest } = parsed.data;
  const updates: any = { ...rest };
  if (endDate !== undefined) updates.endDate = endDate ? new Date(endDate) : null;
  const [updated] = await db.update(offersTable).set(updates).where(eq(offersTable.id, id)).returning();
  if (!updated) { res.status(404).json({ message: "Offer not found" }); return; }
  res.json(offerToResponse(updated));
});

// DELETE /api/admin/offers/:id
router.delete("/admin/offers/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ message: "Invalid ID" }); return; }
  await db.delete(offersTable).where(eq(offersTable.id, id));
  res.json({ success: true });
});

// POST /api/admin/run-daily-payout — manual trigger for testing
router.post("/admin/run-daily-payout", requireAdmin, async (req, res) => {
  try {
    const { processDailyPayout } = await import("../lib/dailyPayout");
    const stats = await processDailyPayout();
    res.json({ success: true, ...stats });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || "Payout failed" });
  }
});

export default router;
