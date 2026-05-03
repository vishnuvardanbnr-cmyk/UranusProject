import nodemailer from "nodemailer";
import { db, platformSettingsTable } from "@workspace/db";
import crypto from "crypto";

async function getSettings() {
  const [s] = await db.select().from(platformSettingsTable).limit(1);
  return s ?? null;
}

function createTransport(s: NonNullable<Awaited<ReturnType<typeof getSettings>>>) {
  const isLocal = s.smtpHost === "localhost" || s.smtpHost === "127.0.0.1";
  return nodemailer.createTransport({
    host: s.smtpHost,
    port: s.smtpPort,
    secure: s.smtpPort === 465,
    auth: isLocal ? undefined : { user: s.smtpUser, pass: s.smtpPassword },
    tls: { rejectUnauthorized: false },
  });
}

function makeMessageId(domain: string) {
  return `<${Date.now()}.${crypto.randomBytes(8).toString("hex")}@${domain}>`;
}

function fromDomain(s: NonNullable<Awaited<ReturnType<typeof getSettings>>>) {
  return (s.smtpFrom ?? "noreply@uranustrades.net").split("@")[1] ?? "uranustrades.net";
}

function baseHeaders(domain: string) {
  return {
    "Precedence": "transactional",
    "X-Auto-Response-Suppress": "OOF, AutoReply",
  };
}

function header(s: NonNullable<Awaited<ReturnType<typeof getSettings>>>) {
  return `
    <tr>
      <td style="background:linear-gradient(90deg,#0a2a3a,#0d3d52);padding:24px 32px;border-bottom:2px solid #1a4a5e;">
        <h1 style="margin:0;color:#3DD6F5;font-size:20px;letter-spacing:2px;font-weight:900;">URANUS TRADES</h1>
        <p style="margin:4px 0 0;color:rgba(168,237,255,0.5);font-size:12px;letter-spacing:1px;">Secure Investment Platform</p>
      </td>
    </tr>`;
}

function footer() {
  return `
    <tr>
      <td style="padding:16px 32px 24px;border-top:1px solid rgba(61,214,245,0.1);">
        <p style="color:rgba(168,237,255,0.3);font-size:11px;margin:0;text-align:center;">© ${new Date().getFullYear()} URANUS TRADES. All rights reserved.<br>If you did not request this email, please ignore it.</p>
      </td>
    </tr>`;
}

function wrap(body: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:32px 0;">
    <tr><td align="center">
      <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background:#010810;border-radius:12px;overflow:hidden;max-width:520px;width:100%;">
        ${body}
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── OTP ──────────────────────────────────────────────────────────────────────
export async function sendOtpEmail(to: string, code: string, purpose: "registration" | "withdrawal" | "wallet_update") {
  const s = await getSettings();
  if (!s?.smtpEnabled) return;

  const label = purpose === "registration" ? "Registration"
              : purpose === "withdrawal"   ? "Withdrawal"
              : "Wallet Address Update";

  const domain = fromDomain(s);
  const transport = createTransport(s);

  await transport.sendMail({
    from: `"${s.smtpFromName || "URANUS TRADES"}" <${s.smtpFrom}>`,
    to,
    subject: `URANUS TRADES — Your ${label} Verification Code`,
    messageId: makeMessageId(domain),
    headers: baseHeaders(domain),
    text: `URANUS TRADES — ${label} Verification\n\nYour verification code is: ${code}\n\nThis code expires in 10 minutes. Do not share it with anyone.\n\n© URANUS TRADES`,
    html: wrap(`
      ${header(s)}
      <tr><td style="padding:32px;">
        <p style="color:rgba(168,237,255,0.8);font-size:15px;margin:0 0 8px;">Hello,</p>
        <p style="color:rgba(168,237,255,0.6);font-size:14px;margin:0 0 24px;">Your <strong style="color:#3DD6F5;">${label}</strong> verification code is:</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td align="center" style="background:rgba(61,214,245,0.08);border:1px solid rgba(61,214,245,0.3);border-radius:10px;padding:24px;">
            <span style="font-size:40px;font-weight:900;color:#3DD6F5;letter-spacing:0.25em;">${code}</span>
          </td></tr>
        </table>
        <p style="color:rgba(168,237,255,0.45);font-size:12px;margin:20px 0 0;text-align:center;">This code expires in <strong>10 minutes</strong>. Never share it with anyone.</p>
      </td></tr>
      ${footer()}
    `),
  });
}

// ── Welcome ───────────────────────────────────────────────────────────────────
export async function sendWelcomeEmail(to: string, name: string) {
  const s = await getSettings();
  if (!s?.smtpEnabled) return;

  const domain = fromDomain(s);
  const transport = createTransport(s);

  await transport.sendMail({
    from: `"${s.smtpFromName || "URANUS TRADES"}" <${s.smtpFrom}>`,
    to,
    subject: "Welcome to URANUS TRADES!",
    messageId: makeMessageId(domain),
    headers: baseHeaders(domain),
    text: `Welcome to URANUS TRADES!\n\nHi ${name},\n\nYour account has been created successfully. You can now log in, make a deposit, and start growing your investment.\n\nHave questions? Contact our support team.\n\n© URANUS TRADES`,
    html: wrap(`
      ${header(s)}
      <tr><td style="padding:32px;">
        <p style="color:rgba(168,237,255,0.8);font-size:15px;margin:0 0 8px;">Hi ${name},</p>
        <p style="color:rgba(168,237,255,0.6);font-size:14px;margin:0 0 24px;">Welcome to <strong style="color:#3DD6F5;">URANUS TRADES</strong>! Your account has been created successfully.</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="background:rgba(61,214,245,0.08);border:1px solid rgba(61,214,245,0.3);border-radius:10px;padding:24px;">
            <p style="color:rgba(168,237,255,0.7);font-size:13px;margin:0 0 12px;">Here is what you can do next:</p>
            <p style="color:rgba(168,237,255,0.6);font-size:13px;margin:0 0 8px;">💰 &nbsp;Deposit USDT to your personal wallet address</p>
            <p style="color:rgba(168,237,255,0.6);font-size:13px;margin:0 0 8px;">📈 &nbsp;Choose an investment plan and start earning daily returns</p>
            <p style="color:rgba(168,237,255,0.6);font-size:13px;margin:0;">👥 &nbsp;Refer friends using your unique referral link</p>
          </td></tr>
        </table>
        <p style="color:rgba(168,237,255,0.45);font-size:12px;margin:20px 0 0;text-align:center;">Log in to your dashboard to get started.</p>
      </td></tr>
      ${footer()}
    `),
  });
}

// ── Deposit credited (blockchain → wallet) ────────────────────────────────────
export async function sendDepositCreditedEmail(to: string, name: string, amount: number) {
  const s = await getSettings();
  if (!s?.smtpEnabled || !s?.depositConfirmationEnabled) return;

  const domain = fromDomain(s);
  const transport = createTransport(s);

  await transport.sendMail({
    from: `"${s.smtpFromName || "URANUS TRADES"}" <${s.smtpFrom}>`,
    to,
    subject: "URANUS TRADES — Deposit Credited to Your Wallet",
    messageId: makeMessageId(domain),
    headers: baseHeaders(domain),
    text: `URANUS TRADES — Deposit Credited\n\nHi ${name},\n\nYour deposit of $${amount.toFixed(2)} USDT has been confirmed and credited to your wallet balance. You can now invest it into a plan.\n\n© URANUS TRADES`,
    html: wrap(`
      ${header(s)}
      <tr><td style="padding:32px;">
        <p style="color:rgba(168,237,255,0.8);font-size:15px;margin:0 0 8px;">Hi ${name},</p>
        <p style="color:rgba(168,237,255,0.6);font-size:14px;margin:0 0 24px;">Your deposit has been confirmed and credited to your wallet!</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td align="center" style="background:rgba(61,214,245,0.08);border:1px solid rgba(61,214,245,0.3);border-radius:10px;padding:24px;">
            <div style="font-size:13px;color:rgba(168,237,255,0.5);margin-bottom:6px;">Amount Credited</div>
            <div style="font-size:36px;font-weight:900;color:#3DD6F5;">+$${amount.toFixed(2)}</div>
            <div style="font-size:12px;color:rgba(168,237,255,0.4);margin-top:4px;">USDT</div>
          </td></tr>
        </table>
        <p style="color:rgba(168,237,255,0.45);font-size:12px;margin:20px 0 0;text-align:center;">Your balance is now available. Log in to invest in a plan and start earning.</p>
      </td></tr>
      ${footer()}
    `),
  });
}

// ── Investment / Plan deposit confirmed ───────────────────────────────────────
export async function sendDepositConfirmationEmail(to: string, name: string, amount: number, plan: string) {
  const s = await getSettings();
  if (!s?.smtpEnabled || !s?.depositConfirmationEnabled) return;

  const domain = fromDomain(s);
  const transport = createTransport(s);

  await transport.sendMail({
    from: `"${s.smtpFromName || "URANUS TRADES"}" <${s.smtpFrom}>`,
    to,
    subject: "URANUS TRADES — Investment Activated",
    messageId: makeMessageId(domain),
    headers: baseHeaders(domain),
    text: `URANUS TRADES — Investment Activated\n\nHi ${name},\n\nYour investment has been activated!\n\nAmount: +$${amount.toFixed(2)}\nPlan: ${plan}\n\nYour investment is now earning daily returns.\n\n© URANUS TRADES`,
    html: wrap(`
      ${header(s)}
      <tr><td style="padding:32px;">
        <p style="color:rgba(168,237,255,0.8);font-size:15px;margin:0 0 8px;">Hi ${name},</p>
        <p style="color:rgba(168,237,255,0.6);font-size:14px;margin:0 0 24px;">Your investment is now active and earning daily returns!</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="background:rgba(61,214,245,0.08);border:1px solid rgba(61,214,245,0.3);border-radius:10px;padding:24px;">
            <div style="font-size:32px;font-weight:900;color:#3DD6F5;">+$${amount.toFixed(2)}</div>
            <div style="color:rgba(168,237,255,0.5);font-size:13px;margin-top:6px;">${plan}</div>
          </td></tr>
        </table>
        <p style="color:rgba(168,237,255,0.45);font-size:12px;margin:20px 0 0;text-align:center;">Visit your dashboard to track your daily earnings.</p>
      </td></tr>
      ${footer()}
    `),
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

export async function isOtpWalletUpdateEnabled(): Promise<boolean> {
  const s = await getSettings();
  return !!(s?.smtpEnabled && s?.otpWalletUpdateEnabled);
}
