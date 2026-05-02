import { Router } from "express";
import { db, usersTable, otpCodesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { createHash } from "crypto";
import { signToken, requireAuth } from "../middlewares/auth";
import { RegisterBody, LoginBody, SetupProfileBody } from "@workspace/api-zod";
import { sendOtpEmail, isOtpRegistrationEnabled } from "../lib/email";

const router = Router();

function hashPassword(password: string): string {
  return createHash("sha256").update(password + "uranaz-salt").digest("hex");
}

async function generateUniqueReferralCode(): Promise<string> {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  while (true) {
    let code = "URN";
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    const [existing] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.referralCode, code)).limit(1);
    if (!existing) return code;
  }
}

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
    walletBalance: parseFloat(user.walletBalance ?? "0"),
    hyperCoinBalance: parseFloat(user.hyperCoinBalance ?? "0"),
    createdAt: user.createdAt.toISOString(),
  };
}

// GET /api/auth/otp-required
router.get("/auth/otp-required", async (_req, res) => {
  const { isOtpWithdrawalEnabled } = await import("../lib/email");
  const registrationOtp = await isOtpRegistrationEnabled();
  const withdrawalOtp = await isOtpWithdrawalEnabled();
  res.json({ registrationOtp, withdrawalOtp });
});

// POST /api/auth/send-otp
router.post("/auth/send-otp", async (req, res) => {
  const { email, purpose } = req.body;
  if (!email || !["registration", "withdrawal"].includes(purpose)) {
    res.status(400).json({ message: "Invalid input" });
    return;
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await db.update(otpCodesTable)
    .set({ used: true })
    .where(and(eq(otpCodesTable.email, email), eq(otpCodesTable.purpose, purpose)));

  await db.insert(otpCodesTable).values({ email, code, purpose, expiresAt });

  try {
    await sendOtpEmail(email, code, purpose);
    res.json({ message: "OTP sent" });
  } catch (err: any) {
    req.log?.error?.(err);
    res.status(500).json({ message: "Failed to send OTP email. Check SMTP settings." });
  }
});

// POST /api/auth/register
router.post("/auth/register", async (req, res) => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid input", errors: parsed.error.issues });
    return;
  }
  const { name, email, phone, password, referralCode } = parsed.data;

  const otpRequired = await isOtpRegistrationEnabled();
  if (otpRequired) {
    const otp = req.body.otp as string | undefined;
    if (!otp) {
      res.status(400).json({ message: "OTP required for registration" });
      return;
    }
    const now = new Date();
    const [otpRecord] = await db.select().from(otpCodesTable)
      .where(and(
        eq(otpCodesTable.email, email),
        eq(otpCodesTable.purpose, "registration"),
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

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing) {
    res.status(409).json({ message: "Email already registered" });
    return;
  }

  let sponsorId: number | undefined;
  if (referralCode) {
    const [sponsor] = await db.select().from(usersTable).where(eq(usersTable.referralCode, referralCode)).limit(1);
    if (sponsor) sponsorId = sponsor.id;
  }

  const referralCodeGenerated = await generateUniqueReferralCode();

  const [user] = await db.insert(usersTable).values({
    name,
    email,
    phone,
    passwordHash: hashPassword(password),
    referralCode: referralCodeGenerated,
    sponsorId: sponsorId ?? null,
  }).returning();

  const token = signToken(user.id);
  res.status(201).json({ user: userToResponse(user), token });
});

// POST /api/auth/login
router.post("/auth/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid input" });
    return;
  }
  const { email, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user || user.passwordHash !== hashPassword(password)) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }
  if (!user.isActive) {
    res.status(403).json({ message: "Account is deactivated" });
    return;
  }
  const token = signToken(user.id);
  res.json({ user: userToResponse(user), token });
});

// POST /api/auth/logout
router.post("/auth/logout", async (_req, res) => {
  res.json({ message: "Logged out" });
});

// GET /api/auth/me
router.get("/auth/me", requireAuth, async (req, res) => {
  const user = (req as any).user;
  res.json(userToResponse(user));
});

// POST /api/auth/profile-setup
router.post("/auth/profile-setup", requireAuth, async (req, res) => {
  const parsed = SetupProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid input", errors: parsed.error.issues });
    return;
  }
  const user = (req as any).user;
  const [updated] = await db.update(usersTable)
    .set({
      walletAddress: parsed.data.walletAddress,
      country: parsed.data.country,
      idNumber: parsed.data.idNumber,
      profileImage: parsed.data.profileImage,
      profileComplete: true,
    })
    .where(eq(usersTable.id, user.id))
    .returning();
  res.json(userToResponse(updated));
});

export default router;
