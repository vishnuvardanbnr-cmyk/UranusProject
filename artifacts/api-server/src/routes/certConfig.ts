import { Router } from "express";
import { db, platformSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const CERT_EDIT_KEY = process.env.CERT_EDIT_KEY ?? "uranaz@cert2024";

async function getOrCreateSettings() {
  const [row] = await db.select().from(platformSettingsTable).limit(1);
  if (row) return row;
  const [created] = await db.insert(platformSettingsTable).values({}).returning();
  return created;
}

// GET /api/cert-config — public
router.get("/cert-config", async (_req, res) => {
  const s = await getOrCreateSettings();
  res.json({
    companyName: s.certCompanyName,
    companyNumber: s.certCompanyNumber,
    incorporatedDate: s.certIncorporatedDate,
  });
});

// POST /api/cert-config — protected by X-Cert-Key header
router.post("/cert-config", async (req, res) => {
  const key = req.headers["x-cert-key"];
  if (key !== CERT_EDIT_KEY) {
    res.status(401).json({ message: "Invalid key" });
    return;
  }

  const parsed = z.object({
    companyName: z.string().min(1).max(200),
    companyNumber: z.string().min(1).max(50),
    incorporatedDate: z.string().min(1).max(100),
  }).safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ message: "Invalid data" });
    return;
  }

  const { companyName, companyNumber, incorporatedDate } = parsed.data;
  const existing = await getOrCreateSettings();

  const [updated] = await db
    .update(platformSettingsTable)
    .set({
      certCompanyName: companyName,
      certCompanyNumber: companyNumber,
      certIncorporatedDate: incorporatedDate,
    })
    .where(eq(platformSettingsTable.id, existing.id))
    .returning();

  res.json({
    companyName: updated.certCompanyName,
    companyNumber: updated.certCompanyNumber,
    incorporatedDate: updated.certIncorporatedDate,
  });
});

export default router;
