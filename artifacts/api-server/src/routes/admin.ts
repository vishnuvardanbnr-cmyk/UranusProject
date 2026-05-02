import { Router } from "express";
import { db, usersTable, investmentsTable, withdrawalsTable, incomeTable, platformSettingsTable } from "@workspace/db";
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
  const [updated] = await db.update(withdrawalsTable)
    .set({ status: "approved", processedAt: new Date() })
    .where(eq(withdrawalsTable.id, id))
    .returning();
  if (!updated) {
    res.status(404).json({ message: "Withdrawal not found" });
    return;
  }
  res.json(withdrawalToResponse(updated));
});

// POST /api/admin/withdrawals/:id/reject
router.post("/admin/withdrawals/:id/reject", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const [updated] = await db.update(withdrawalsTable)
    .set({ status: "rejected", processedAt: new Date() })
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
  });
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

export default router;
