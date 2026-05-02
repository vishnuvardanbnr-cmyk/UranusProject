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
});

export const insertPlatformSettingsSchema = createInsertSchema(platformSettingsTable).omit({ id: true });
export type InsertPlatformSettings = z.infer<typeof insertPlatformSettingsSchema>;
export type PlatformSettings = typeof platformSettingsTable.$inferSelect;
