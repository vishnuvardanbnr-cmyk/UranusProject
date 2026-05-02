import { pgTable, serial, boolean, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const platformSettingsTable = pgTable("platform_settings", {
  id: serial("id").primaryKey(),
  maintenanceMode: boolean("maintenance_mode").notNull().default(false),
  minDeposit: numeric("min_deposit", { precision: 10, scale: 2 }).notNull().default("100"),
  maxDeposit: numeric("max_deposit", { precision: 10, scale: 2 }).notNull().default("1500"),
  hyperCoinMinPercent: numeric("hyper_coin_min_percent", { precision: 5, scale: 2 }).notNull().default("50"),
  spotReferralRate: numeric("spot_referral_rate", { precision: 5, scale: 4 }).notNull().default("0.05"),
  launchOfferActive: boolean("launch_offer_active").notNull().default(true),
  withdrawalEnabled: boolean("withdrawal_enabled").notNull().default(true),
});

export const insertPlatformSettingsSchema = createInsertSchema(platformSettingsTable).omit({ id: true });
export type InsertPlatformSettings = z.infer<typeof insertPlatformSettingsSchema>;
export type PlatformSettings = typeof platformSettingsTable.$inferSelect;
