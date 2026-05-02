import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { createHash, randomBytes } from "crypto";
import { signToken, requireAuth } from "../middlewares/auth";
import { RegisterBody, LoginBody, SetupProfileBody } from "@workspace/api-zod";

const router = Router();

function hashPassword(password: string): string {
  return createHash("sha256").update(password + "uranaz-salt").digest("hex");
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
    createdAt: user.createdAt.toISOString(),
  };
}

// POST /api/auth/register
router.post("/auth/register", async (req, res) => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid input", errors: parsed.error.issues });
    return;
  }
  const { name, email, phone, password, referralCode } = parsed.data;

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

  const [newUser] = await db.insert(usersTable).values({
    name,
    email,
    phone,
    passwordHash: hashPassword(password),
    referralCode: "0",
    sponsorId: sponsorId ?? null,
  }).returning();

  // Set referral code = user's own ID
  const [user] = await db.update(usersTable)
    .set({ referralCode: String(newUser.id) })
    .where(eq(usersTable.id, newUser.id))
    .returning();

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
