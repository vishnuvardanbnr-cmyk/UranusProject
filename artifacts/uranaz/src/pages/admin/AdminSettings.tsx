import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useGetAdminSettings, useUpdateAdminSettings, getGetAdminSettingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save, Mail, Eye, EyeOff, Wallet, ShieldAlert } from "lucide-react";

const TEAL = "#3DD6F5";
const GLASS = { background: "rgba(5,18,32,0.65)", backdropFilter: "blur(14px)", border: "1px solid rgba(61,214,245,0.10)" } as const;
const INPUT_CLS = "w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none";
const INPUT_STYLE = {
  background: "rgba(0,20,40,0.7)",
  border: "1px solid rgba(61,214,245,0.18)",
  color: "rgba(168,237,255,0.9)",
};

type SettingsForm = {
  maintenanceMode: boolean;
  minDeposit: number;
  maxDeposit: number;
  hyperCoinMinPercent: number;
  spotReferralRate: number;
  launchOfferActive: boolean;
  withdrawalEnabled: boolean;
};

type SmtpForm = {
  smtpEnabled: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  smtpFrom: string;
  smtpFromName: string;
  otpRegistrationEnabled: boolean;
  otpWithdrawalEnabled: boolean;
  depositConfirmationEnabled: boolean;
};

function getToken() {
  return localStorage.getItem("uranaz_token") || "";
}

async function fetchSmtpSettings(): Promise<SmtpForm> {
  const res = await fetch("/api/admin/smtp-settings", {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error("Failed to load SMTP settings");
  return res.json();
}

async function saveSmtpSettings(data: SmtpForm): Promise<SmtpForm> {
  const res = await fetch("/api/admin/smtp-settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to save SMTP settings");
  }
  return res.json();
}

export default function AdminSettings() {
  const { data: settings, isLoading } = useGetAdminSettings();
  const updateSettings = useUpdateAdminSettings();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { register, handleSubmit, reset } = useForm<SettingsForm>();

  const smtpForm = useForm<SmtpForm>({
    defaultValues: {
      smtpEnabled: false,
      smtpHost: "",
      smtpPort: 587,
      smtpUser: "",
      smtpPassword: "",
      smtpFrom: "",
      smtpFromName: "URANAZ TRADES",
      otpRegistrationEnabled: false,
      otpWithdrawalEnabled: false,
      depositConfirmationEnabled: false,
    },
  });

  const [smtpLoading, setSmtpLoading] = useState(false);
  const [smtpSaving, setSmtpSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (settings) reset(settings as SettingsForm);
  }, [settings]);

  useEffect(() => {
    setSmtpLoading(true);
    fetchSmtpSettings()
      .then(data => smtpForm.reset(data))
      .catch(() => {})
      .finally(() => setSmtpLoading(false));
  }, []);

  const onSubmit = async (data: SettingsForm) => {
    try {
      await updateSettings.mutateAsync({ data });
      await queryClient.invalidateQueries({ queryKey: getGetAdminSettingsQueryKey() });
      toast({ title: "Settings updated!" });
    } catch (err: any) {
      toast({ title: "Failed", description: err?.message, variant: "destructive" });
    }
  };

  const onSmtpSubmit = async (data: SmtpForm) => {
    setSmtpSaving(true);
    try {
      const updated = await saveSmtpSettings(data);
      smtpForm.reset(updated);
      toast({ title: "SMTP settings saved!" });
    } catch (err: any) {
      toast({ title: "Failed", description: err?.message, variant: "destructive" });
    } finally {
      setSmtpSaving(false);
    }
  };

  // Wallet settings state
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletSaving, setWalletSaving] = useState(false);
  const [showGasKey, setShowGasKey] = useState(false);
  const walletForm = useForm<{
    adminMasterWallet: string;
    gasWalletPrivateKey: string;
    bscRpcUrl: string;
    minDepositUsdt: number;
  }>({
    defaultValues: {
      adminMasterWallet: "",
      gasWalletPrivateKey: "",
      bscRpcUrl: "https://bsc-dataseed.binance.org/",
      minDepositUsdt: 1,
    },
  });

  useEffect(() => {
    setWalletLoading(true);
    fetch("/api/admin/wallet-settings", { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json())
      .then(d => walletForm.reset(d))
      .catch(() => {})
      .finally(() => setWalletLoading(false));
  }, []);

  const onWalletSubmit = async (data: { adminMasterWallet: string; gasWalletPrivateKey: string; bscRpcUrl: string; minDepositUsdt: number }) => {
    setWalletSaving(true);
    try {
      const res = await fetch("/api/admin/wallet-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save");
      const updated = await res.json();
      walletForm.reset(updated);
      toast({ title: "Wallet settings saved!" });
    } catch (err: any) {
      toast({ title: "Failed", description: err?.message, variant: "destructive" });
    } finally {
      setWalletSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 py-6 max-w-2xl mx-auto space-y-4">
        {[1,2,3].map(i => <div key={i} className="rounded-xl h-20 animate-pulse" style={{ background: "rgba(61,214,245,0.04)", border: "1px solid rgba(61,214,245,0.08)" }} />)}
      </div>
    );
  }

  const smtpEnabled = smtpForm.watch("smtpEnabled");

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-5 pb-24 md:pb-8">
      <div className="flex items-center gap-3">
        <Settings size={20} style={{ color: TEAL }} />
        <h1
          className="text-xl font-bold"
          style={{
            fontFamily: "'Orbitron', sans-serif",
            background: "linear-gradient(135deg, #a8edff, #3DD6F5)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Platform Settings
        </h1>
      </div>

      {/* Platform Settings Form */}
      <div className="rounded-2xl p-5" style={GLASS}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="pb-3" style={{ borderBottom: "1px solid rgba(61,214,245,0.08)" }}>
            <h2 className="font-semibold text-sm" style={{ color: TEAL }}>Deposit Limits</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Min Deposit (USDT)",      testId: "input-min-deposit",    name: "minDeposit" as const,         type: "number", extra: {} },
              { label: "Max Deposit (USDT)",      testId: "input-max-deposit",    name: "maxDeposit" as const,         type: "number", extra: {} },
              { label: "Min HYPERCOIN % (0–100)", testId: "input-hypercoin-pct",  name: "hyperCoinMinPercent" as const, type: "number", extra: { step: "1", min: "0", max: "100" } },
              { label: "Spot Referral Rate (%)",  testId: "input-spot-commission",name: "spotReferralRate" as const,   type: "number", extra: { step: "0.01" } },
            ].map(f => (
              <div key={f.name}>
                <label className="text-xs font-medium block mb-1.5" style={{ color: "rgba(168,237,255,0.5)" }}>{f.label}</label>
                <input
                  data-testid={f.testId}
                  type={f.type}
                  {...f.extra}
                  {...register(f.name, { valueAsNumber: true })}
                  className={INPUT_CLS}
                  style={INPUT_STYLE}
                />
              </div>
            ))}
          </div>

          <div className="pb-3 pt-2" style={{ borderBottom: "1px solid rgba(61,214,245,0.08)" }}>
            <h2 className="font-semibold text-sm" style={{ color: TEAL }}>Platform Toggles</h2>
          </div>
          <div className="space-y-3">
            {[
              { key: "maintenanceMode" as const,   label: "Maintenance Mode",    desc: "Disable all user logins temporarily" },
              { key: "launchOfferActive" as const,  label: "Launch Offer Active", desc: "Show Singapore trip offer to users" },
              { key: "withdrawalEnabled" as const,  label: "Withdrawals Enabled", desc: "Allow users to submit withdrawal requests" },
            ].map(item => (
              <div
                key={item.key}
                className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: "rgba(0,15,30,0.5)", border: "1px solid rgba(61,214,245,0.08)" }}
              >
                <div>
                  <div className="text-sm font-medium" style={{ color: "rgba(168,237,255,0.8)" }}>{item.label}</div>
                  <div className="text-xs" style={{ color: "rgba(168,237,255,0.35)" }}>{item.desc}</div>
                </div>
                <input
                  type="checkbox"
                  data-testid={`toggle-${item.key}`}
                  {...register(item.key)}
                  className="w-4 h-4"
                  style={{ accentColor: TEAL }}
                />
              </div>
            ))}
          </div>

          <button
            data-testid="button-save-settings"
            type="submit"
            disabled={updateSettings.isPending}
            className="w-full py-3 rounded-xl font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            style={{
              background: "linear-gradient(135deg, #3DD6F5, #2AB3CF)",
              color: "#010810",
              letterSpacing: "0.04em",
              boxShadow: "0 0 20px rgba(61,214,245,0.3)",
            }}
          >
            <Save size={16} />
            {updateSettings.isPending ? "Saving..." : "Save Settings"}
          </button>
        </form>
      </div>

      {/* Blockchain / Wallet Settings */}
      <div className="flex items-center gap-3 pt-2">
        <Wallet size={20} style={{ color: TEAL }} />
        <h2
          className="text-lg font-bold"
          style={{
            fontFamily: "'Orbitron', sans-serif",
            background: "linear-gradient(135deg, #a8edff, #3DD6F5)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Blockchain & Wallets
        </h2>
      </div>

      <div className="rounded-2xl p-5" style={GLASS}>
        {walletLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-10 rounded-xl animate-pulse" style={{ background: "rgba(61,214,245,0.04)" }} />)}
          </div>
        ) : (
          <form onSubmit={walletForm.handleSubmit(onWalletSubmit)} className="space-y-5">

            {/* Security notice */}
            <div
              className="flex gap-3 p-3 rounded-xl"
              style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.18)" }}
            >
              <ShieldAlert size={15} className="shrink-0 mt-0.5" style={{ color: "rgba(251,191,36,0.8)" }} />
              <div className="text-xs" style={{ color: "rgba(251,191,36,0.75)" }}>
                <strong>Security Notice:</strong> Private keys are stored encrypted in the database. The gas wallet should hold only enough BNB to cover sweep fees. Do not use a wallet with large BNB holdings.
              </div>
            </div>

            <div className="pb-2" style={{ borderBottom: "1px solid rgba(61,214,245,0.08)" }}>
              <h3 className="font-semibold text-xs tracking-widest uppercase" style={{ color: "rgba(168,237,255,0.4)" }}>
                Master Wallet (receives all user USDT deposits)
              </h3>
            </div>

            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "rgba(168,237,255,0.5)" }}>Admin Master Wallet Address (BEP-20)</label>
              <input
                type="text"
                placeholder="0x..."
                {...walletForm.register("adminMasterWallet")}
                className={INPUT_CLS}
                style={INPUT_STYLE}
              />
              <p className="text-xs mt-1" style={{ color: "rgba(168,237,255,0.3)" }}>All swept USDT will be sent here.</p>
            </div>

            <div className="pb-2 pt-1" style={{ borderBottom: "1px solid rgba(61,214,245,0.08)" }}>
              <h3 className="font-semibold text-xs tracking-widest uppercase" style={{ color: "rgba(168,237,255,0.4)" }}>
                Gas Wallet (pays BNB fees for sweeping)
              </h3>
            </div>

            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "rgba(168,237,255,0.5)" }}>Gas Wallet Private Key</label>
              <div className="relative">
                <input
                  type={showGasKey ? "text" : "password"}
                  placeholder="0x... (private key with BNB for gas)"
                  {...walletForm.register("gasWalletPrivateKey")}
                  className={INPUT_CLS + " pr-10"}
                  style={INPUT_STYLE}
                />
                <button
                  type="button"
                  onClick={() => setShowGasKey(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "rgba(168,237,255,0.4)" }}
                >
                  {showGasKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <p className="text-xs mt-1" style={{ color: "rgba(168,237,255,0.3)" }}>This wallet's BNB is used to fund deposit addresses before sweeping USDT.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: "rgba(168,237,255,0.5)" }}>Min Deposit (USDT)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...walletForm.register("minDepositUsdt", { valueAsNumber: true })}
                  className={INPUT_CLS}
                  style={INPUT_STYLE}
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: "rgba(168,237,255,0.5)" }}>BSC RPC URL</label>
                <input
                  type="text"
                  placeholder="https://bsc-dataseed.binance.org/"
                  {...walletForm.register("bscRpcUrl")}
                  className={INPUT_CLS}
                  style={INPUT_STYLE}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={walletSaving}
              className="w-full py-3 rounded-xl font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              style={{
                background: "linear-gradient(135deg, #3DD6F5, #2AB3CF)",
                color: "#010810",
                letterSpacing: "0.04em",
                boxShadow: "0 0 20px rgba(61,214,245,0.3)",
              }}
            >
              <Save size={16} />
              {walletSaving ? "Saving..." : "Save Wallet Settings"}
            </button>
          </form>
        )}
      </div>

      {/* SMTP Settings */}
      <div className="flex items-center gap-3 pt-2">
        <Mail size={20} style={{ color: TEAL }} />
        <h2
          className="text-lg font-bold"
          style={{
            fontFamily: "'Orbitron', sans-serif",
            background: "linear-gradient(135deg, #a8edff, #3DD6F5)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Email & SMTP
        </h2>
      </div>

      <div className="rounded-2xl p-5" style={GLASS}>
        {smtpLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-10 rounded-xl animate-pulse" style={{ background: "rgba(61,214,245,0.04)" }} />)}
          </div>
        ) : (
          <form onSubmit={smtpForm.handleSubmit(onSmtpSubmit)} className="space-y-5">

            {/* Global SMTP Toggle */}
            <div
              className="flex items-center justify-between p-4 rounded-xl"
              style={{ background: "rgba(61,214,245,0.06)", border: "1px solid rgba(61,214,245,0.18)" }}
            >
              <div>
                <div className="text-sm font-bold" style={{ color: "rgba(168,237,255,0.9)" }}>SMTP Enabled</div>
                <div className="text-xs mt-0.5" style={{ color: "rgba(168,237,255,0.4)" }}>
                  Master switch — must be ON for any email to send
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only" {...smtpForm.register("smtpEnabled")} />
                <div
                  className="w-11 h-6 rounded-full transition-colors"
                  style={{
                    background: smtpEnabled ? TEAL : "rgba(61,214,245,0.15)",
                    border: `1px solid ${smtpEnabled ? TEAL : "rgba(61,214,245,0.25)"}`,
                    position: "relative",
                  }}
                >
                  <div
                    className="absolute top-0.5 w-5 h-5 rounded-full transition-transform"
                    style={{
                      left: smtpEnabled ? "calc(100% - 22px)" : "2px",
                      background: smtpEnabled ? "#010810" : "rgba(168,237,255,0.4)",
                    }}
                  />
                </div>
              </label>
            </div>

            {/* SMTP Credentials */}
            <div className="pb-2" style={{ borderBottom: "1px solid rgba(61,214,245,0.08)" }}>
              <h3 className="font-semibold text-xs tracking-widest uppercase" style={{ color: "rgba(168,237,255,0.4)" }}>
                SMTP Credentials
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="text-xs font-medium block mb-1.5" style={{ color: "rgba(168,237,255,0.5)" }}>SMTP Host</label>
                <input
                  type="text"
                  placeholder="smtp.gmail.com"
                  {...smtpForm.register("smtpHost")}
                  className={INPUT_CLS}
                  style={INPUT_STYLE}
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: "rgba(168,237,255,0.5)" }}>Port</label>
                <input
                  type="number"
                  placeholder="587"
                  {...smtpForm.register("smtpPort", { valueAsNumber: true })}
                  className={INPUT_CLS}
                  style={INPUT_STYLE}
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="text-xs font-medium block mb-1.5" style={{ color: "rgba(168,237,255,0.5)" }}>SMTP Username</label>
                <input
                  type="text"
                  placeholder="you@gmail.com"
                  {...smtpForm.register("smtpUser")}
                  className={INPUT_CLS}
                  style={INPUT_STYLE}
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: "rgba(168,237,255,0.5)" }}>Password / App Key</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...smtpForm.register("smtpPassword")}
                    className={INPUT_CLS + " pr-10"}
                    style={INPUT_STYLE}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "rgba(168,237,255,0.4)" }}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: "rgba(168,237,255,0.5)" }}>From Email</label>
                <input
                  type="email"
                  placeholder="noreply@uranaz.com"
                  {...smtpForm.register("smtpFrom")}
                  className={INPUT_CLS}
                  style={INPUT_STYLE}
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: "rgba(168,237,255,0.5)" }}>From Name</label>
                <input
                  type="text"
                  placeholder="URANAZ TRADES"
                  {...smtpForm.register("smtpFromName")}
                  className={INPUT_CLS}
                  style={INPUT_STYLE}
                />
              </div>
            </div>

            {/* Email Feature Toggles */}
            <div className="pb-2 pt-1" style={{ borderBottom: "1px solid rgba(61,214,245,0.08)" }}>
              <h3 className="font-semibold text-xs tracking-widest uppercase" style={{ color: "rgba(168,237,255,0.4)" }}>
                Email Features
              </h3>
            </div>

            <div className="space-y-3">
              {[
                {
                  key: "otpRegistrationEnabled" as const,
                  label: "OTP on Registration",
                  desc: "Send email OTP to verify new accounts before they're created",
                },
                {
                  key: "otpWithdrawalEnabled" as const,
                  label: "OTP on Withdrawal",
                  desc: "Require email OTP verification before processing withdrawal requests",
                },
                {
                  key: "depositConfirmationEnabled" as const,
                  label: "Deposit Confirmation Email",
                  desc: "Send a confirmation email when a new investment is activated",
                },
              ].map(item => {
                const val = smtpForm.watch(item.key);
                return (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-3 rounded-xl"
                    style={{ background: "rgba(0,15,30,0.5)", border: "1px solid rgba(61,214,245,0.08)" }}
                  >
                    <div className="flex-1 pr-3">
                      <div className="text-sm font-medium" style={{ color: "rgba(168,237,255,0.8)" }}>{item.label}</div>
                      <div className="text-xs mt-0.5" style={{ color: "rgba(168,237,255,0.35)" }}>{item.desc}</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input type="checkbox" className="sr-only" {...smtpForm.register(item.key)} />
                      <div
                        className="w-10 h-5 rounded-full transition-colors"
                        style={{
                          background: val ? TEAL : "rgba(61,214,245,0.12)",
                          border: `1px solid ${val ? TEAL : "rgba(61,214,245,0.20)"}`,
                          position: "relative",
                        }}
                      >
                        <div
                          className="absolute top-0.5 w-4 h-4 rounded-full transition-transform"
                          style={{
                            left: val ? "calc(100% - 18px)" : "2px",
                            background: val ? "#010810" : "rgba(168,237,255,0.35)",
                          }}
                        />
                      </div>
                    </label>
                  </div>
                );
              })}
            </div>

            <button
              type="submit"
              disabled={smtpSaving}
              className="w-full py-3 rounded-xl font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              style={{
                background: "linear-gradient(135deg, #3DD6F5, #2AB3CF)",
                color: "#010810",
                letterSpacing: "0.04em",
                boxShadow: "0 0 20px rgba(61,214,245,0.3)",
              }}
            >
              <Save size={16} />
              {smtpSaving ? "Saving..." : "Save SMTP Settings"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
