import { pgTable, serial, boolean, numeric, integer, text } from "drizzle-orm/pg-core";
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
  // SMTP
  smtpEnabled: boolean("smtp_enabled").notNull().default(false),
  smtpHost: text("smtp_host").notNull().default(""),
  smtpPort: integer("smtp_port").notNull().default(587),
  smtpUser: text("smtp_user").notNull().default(""),
  smtpPassword: text("smtp_password").notNull().default(""),
  smtpFrom: text("smtp_from").notNull().default(""),
  smtpFromName: text("smtp_from_name").notNull().default("URANAZ TRADES"),
  // Email feature toggles
  otpRegistrationEnabled: boolean("otp_registration_enabled").notNull().default(false),
  otpWithdrawalEnabled: boolean("otp_withdrawal_enabled").notNull().default(false),
  depositConfirmationEnabled: boolean("deposit_confirmation_enabled").notNull().default(false),
  // Blockchain / wallet
  adminMasterWallet: text("admin_master_wallet").notNull().default(""),
  gasWalletPrivateKey: text("gas_wallet_private_key").notNull().default(""),
  bscRpcUrl: text("bsc_rpc_url").notNull().default("https://bsc-dataseed.binance.org/"),
  minDepositUsdt: numeric("min_deposit_usdt", { precision: 10, scale: 2 }).notNull().default("1"),
  // Withdrawal wallet
  withdrawalMode: text("withdrawal_mode").notNull().default("manual"),
  withdrawWalletPrivateKey: text("withdraw_wallet_private_key").notNull().default(""),
  // Investment tier daily rates (decimal, e.g. 0.006 = 0.6%)
  tier1DailyRate: numeric("tier1_daily_rate", { precision: 8, scale: 5 }).notNull().default("0.00600"),
  tier2DailyRate: numeric("tier2_daily_rate", { precision: 8, scale: 5 }).notNull().default("0.00700"),
  tier3DailyRate: numeric("tier3_daily_rate", { precision: 8, scale: 5 }).notNull().default("0.00800"),
  // Investment tier durations (days)
  tier1Days: integer("tier1_days").notNull().default(300),
  tier2Days: integer("tier2_days").notNull().default(260),
  tier3Days: integer("tier3_days").notNull().default(225),
  // Level commission rates (decimal, e.g. 0.20 = 20%)
  levelCommL1: numeric("level_comm_l1", { precision: 6, scale: 4 }).notNull().default("0.2000"),
  levelCommL2: numeric("level_comm_l2", { precision: 6, scale: 4 }).notNull().default("0.1000"),
  levelCommL3: numeric("level_comm_l3", { precision: 6, scale: 4 }).notNull().default("0.1000"),
  levelCommL4: numeric("level_comm_l4", { precision: 6, scale: 4 }).notNull().default("0.0400"),
  levelCommL5: numeric("level_comm_l5", { precision: 6, scale: 4 }).notNull().default("0.0400"),
  levelCommL6: numeric("level_comm_l6", { precision: 6, scale: 4 }).notNull().default("0.0400"),
  levelCommL7: numeric("level_comm_l7", { precision: 6, scale: 4 }).notNull().default("0.0400"),
  levelCommL8: numeric("level_comm_l8", { precision: 6, scale: 4 }).notNull().default("0.0400"),
  // Level unlock thresholds (total earnings needed, in USD)
  levelUnlockL2: numeric("level_unlock_l2", { precision: 10, scale: 2 }).notNull().default("1000"),
  levelUnlockL3: numeric("level_unlock_l3", { precision: 10, scale: 2 }).notNull().default("3000"),
  levelUnlockL4: numeric("level_unlock_l4", { precision: 10, scale: 2 }).notNull().default("10000"),
  levelUnlockL5: numeric("level_unlock_l5", { precision: 10, scale: 2 }).notNull().default("10000"),
  levelUnlockL6: numeric("level_unlock_l6", { precision: 10, scale: 2 }).notNull().default("10000"),
  levelUnlockL7: numeric("level_unlock_l7", { precision: 10, scale: 2 }).notNull().default("10000"),
  levelUnlockL8: numeric("level_unlock_l8", { precision: 10, scale: 2 }).notNull().default("10000"),
});

export const insertPlatformSettingsSchema = createInsertSchema(platformSettingsTable).omit({ id: true });
export type InsertPlatformSettings = z.infer<typeof insertPlatformSettingsSchema>;
export type PlatformSettings = typeof platformSettingsTable.$inferSelect;
