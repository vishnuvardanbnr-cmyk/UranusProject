import { Router } from "express";
import { db, usersTable, platformSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

async function getSettings() {
  const [s] = await db.select().from(platformSettingsTable).limit(1);
  return s ?? null;
}

// GET /api/settings/public — no auth required
router.get("/settings/public", async (_req, res) => {
  const settings = await getSettings();
  res.json({
    hyperCoinMinPercent: parseFloat(settings?.hyperCoinMinPercent ?? "50"),
  });
});

// POST /api/wallet/internal-transfer
router.post("/wallet/internal-transfer", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const { direction, amount } = req.body;

  if (!direction || !["usdt_to_hypercoin", "hypercoin_to_usdt"].includes(direction)) {
    res.status(400).json({ message: "Invalid direction" });
    return;
  }
  const transferAmount = parseFloat(amount);
  if (!transferAmount || transferAmount <= 0) {
    res.status(400).json({ message: "Amount must be greater than 0" });
    return;
  }

  const [freshUser] = await db.select().from(usersTable).where(eq(usersTable.id, user.id)).limit(1);
  if (!freshUser) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const currentUsdt = parseFloat(freshUser.walletBalance ?? "0");
  const currentHyper = parseFloat(freshUser.hyperCoinBalance ?? "0");

  if (direction === "usdt_to_hypercoin") {
    if (transferAmount > currentUsdt) {
      res.status(400).json({ message: `Insufficient USDT balance. Available: $${currentUsdt.toFixed(2)}` });
      return;
    }
    await db.update(usersTable)
      .set({
        walletBalance: (currentUsdt - transferAmount).toString(),
        hyperCoinBalance: (currentHyper + transferAmount).toString(),
      })
      .where(eq(usersTable.id, user.id));
  } else {
    if (transferAmount > currentHyper) {
      res.status(400).json({ message: `Insufficient HYPERCOIN balance. Available: $${currentHyper.toFixed(2)}` });
      return;
    }
    await db.update(usersTable)
      .set({
        walletBalance: (currentUsdt + transferAmount).toString(),
        hyperCoinBalance: (currentHyper - transferAmount).toString(),
      })
      .where(eq(usersTable.id, user.id));
  }

  const [updated] = await db.select().from(usersTable).where(eq(usersTable.id, user.id)).limit(1);
  res.json({
    walletBalance: parseFloat(updated.walletBalance ?? "0"),
    hyperCoinBalance: parseFloat(updated.hyperCoinBalance ?? "0"),
  });
});

export default router;
