import nodemailer from "nodemailer";
import { db, platformSettingsTable } from "@workspace/db";

async function getSettings() {
  const [s] = await db.select().from(platformSettingsTable).limit(1);
  return s ?? null;
}

function createTransport(s: NonNullable<Awaited<ReturnType<typeof getSettings>>>) {
  return nodemailer.createTransport({
    host: s.smtpHost,
    port: s.smtpPort,
    secure: s.smtpPort === 465,
    auth: { user: s.smtpUser, pass: s.smtpPassword },
  });
}

export async function sendOtpEmail(to: string, code: string, purpose: "registration" | "withdrawal") {
  const s = await getSettings();
  if (!s?.smtpEnabled) return;
  const label = purpose === "registration" ? "Registration" : "Withdrawal";
  const transport = createTransport(s);
  await transport.sendMail({
    from: `"${s.smtpFromName}" <${s.smtpFrom}>`,
    to,
    subject: `URANAZ TRADES — Your ${label} OTP`,
    html: `
      <div style="background:#010810;color:#a8edff;font-family:sans-serif;padding:32px;border-radius:12px;max-width:480px;margin:auto;">
        <h2 style="color:#3DD6F5;margin-bottom:8px;">URANAZ TRADES</h2>
        <p style="margin-bottom:24px;color:rgba(168,237,255,0.7);">Your ${label} verification code:</p>
        <div style="background:rgba(61,214,245,0.08);border:1px solid rgba(61,214,245,0.3);border-radius:10px;padding:20px;text-align:center;margin-bottom:24px;">
          <span style="font-size:36px;font-weight:900;color:#3DD6F5;letter-spacing:0.2em;">${code}</span>
        </div>
        <p style="color:rgba(168,237,255,0.5);font-size:13px;">This code expires in 10 minutes. Do not share it with anyone.</p>
      </div>`,
  });
}

export async function sendDepositConfirmationEmail(
  to: string,
  name: string,
  amount: number,
  plan: string,
) {
  const s = await getSettings();
  if (!s?.smtpEnabled || !s?.depositConfirmationEnabled) return;
  const transport = createTransport(s);
  await transport.sendMail({
    from: `"${s.smtpFromName}" <${s.smtpFrom}>`,
    to,
    subject: "URANAZ TRADES — Deposit Confirmed",
    html: `
      <div style="background:#010810;color:#a8edff;font-family:sans-serif;padding:32px;border-radius:12px;max-width:480px;margin:auto;">
        <h2 style="color:#3DD6F5;margin-bottom:8px;">URANAZ TRADES</h2>
        <p>Hi ${name},</p>
        <p style="color:rgba(168,237,255,0.7);">Your deposit has been confirmed!</p>
        <div style="background:rgba(61,214,245,0.08);border:1px solid rgba(61,214,245,0.3);border-radius:10px;padding:20px;margin:20px 0;">
          <div style="font-size:28px;font-weight:900;color:#3DD6F5;">+$${amount.toFixed(2)}</div>
          <div style="color:rgba(168,237,255,0.5);font-size:13px;margin-top:4px;">${plan}</div>
        </div>
        <p style="color:rgba(168,237,255,0.5);font-size:13px;">Your investment is now active and earning daily returns.</p>
      </div>`,
  });
}

export async function isOtpRegistrationEnabled(): Promise<boolean> {
  const s = await getSettings();
  return !!(s?.smtpEnabled && s?.otpRegistrationEnabled);
}

export async function isOtpWithdrawalEnabled(): Promise<boolean> {
  const s = await getSettings();
  return !!(s?.smtpEnabled && s?.otpWithdrawalEnabled);
}
