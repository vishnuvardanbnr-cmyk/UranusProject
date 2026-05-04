import { useEffect, useState, ReactNode, ComponentType } from "react";
import { useForm } from "react-hook-form";
import { useGetAdminSettings, useUpdateAdminSettings, getGetAdminSettingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Settings, Save, Mail, Eye, EyeOff, Wallet, ShieldAlert, RefreshCw, Database,
  AlertTriangle, CheckCircle2, ArrowUpRight, TrendingUp, SlidersHorizontal, Coins,
  Layers, BadgeDollarSign, Search, ChevronLeft, ChevronRight, X,
} from "lucide-react";

const TEAL = "#3DD6F5";
const GLASS = { background: "rgba(5,18,32,0.65)", backdropFilter: "blur(14px)", border: "1px solid rgba(61,214,245,0.10)" } as const;
const INPUT_CLS = "w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-colors";
const INPUT_STYLE = {
  background: "rgba(0,20,40,0.7)",
  border: "1px solid rgba(61,214,245,0.18)",
  color: "rgba(168,237,255,0.9)",
};
const SAVE_BTN_STYLE = {
  background: "linear-gradient(135deg, #3DD6F5, #2AB3CF)",
  color: "#010810",
  letterSpacing: "0.04em",
  boxShadow: "0 0 20px rgba(61,214,245,0.3)",
};
const ORBITRON_GRADIENT_STYLE = {
  fontFamily: "'Orbitron', sans-serif",
  background: "linear-gradient(135deg, #a8edff, #3DD6F5)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent" as const,
  backgroundClip: "text",
};

type TabKey = "general" | "blockchain" | "withdrawals" | "income" | "email" | "maintenance";

const TABS: { key: TabKey; label: string; icon: ComponentType<{ size?: number; style?: any }>; desc: string }[] = [
  { key: "general",     label: "General",       icon: SlidersHorizontal, desc: "Deposit limits, platform toggles, launch offer countdown" },
  { key: "blockchain",  label: "Blockchain",    icon: Wallet,            desc: "Master wallet, gas wallet, BSC RPC and minimum deposit" },
  { key: "withdrawals", label: "Withdrawals",   icon: ArrowUpRight,      desc: "Processing mode and the withdrawal wallet that pays users" },
  { key: "income",      label: "Income",        icon: TrendingUp,        desc: "Spot referral, daily tier rates, level commissions and unlocks" },
  { key: "email",       label: "Email & SMTP",  icon: Mail,              desc: "SMTP credentials and which user actions trigger email OTPs" },
  { key: "maintenance", label: "Maintenance",   icon: RefreshCw,         desc: "Regenerate user deposit addresses and review backed-up keys" },
];

type SettingsForm = {
  maintenanceMode: boolean;
  minDeposit: number;
  maxDeposit: number;
  maxTotalInvestment: number;
  hyperCoinMinPercent: number;
  hyperCoinPrice: number;
  spotReferralRate: number;
  launchOfferActive: boolean;
  withdrawalEnabled: boolean;
  launchOfferEndDate: string;
  hcDepositUsername: string;
};

type IncomeForm = {
  spotReferralRate: number;
  tier1DailyRate: number;
  tier2DailyRate: number;
  tier3DailyRate: number;
  tier1Days: number;
  tier2Days: number;
  tier3Days: number;
  levelCommL1: number;
  levelCommL2: number;
  levelCommL3: number;
  levelCommL4: number;
  levelCommL5: number;
  levelCommL6: number;
  levelCommL7: number;
  levelCommL8: number;
  levelUnlockL2: number;
  levelUnlockL3: number;
  levelUnlockL4: number;
  levelUnlockL5: number;
  levelUnlockL6: number;
  levelUnlockL7: number;
  levelUnlockL8: number;
  levelDaysL1: number;
  levelDaysL2: number;
  levelDaysL3: number;
  levelDaysL4: number;
  levelDaysL5: number;
  levelDaysL6: number;
  levelDaysL7: number;
  levelDaysL8: number;
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
  otpWalletUpdateEnabled: boolean;
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

/** A standardized section card with icon header + description + body. */
function SectionCard({
  icon: Icon,
  title,
  description,
  children,
  accent = TEAL,
}: {
  icon: ComponentType<{ size?: number; style?: any }>;
  title: string;
  description: string;
  children: ReactNode;
  accent?: string;
}) {
  return (
    <section className="rounded-2xl overflow-hidden" style={GLASS}>
      <header
        className="px-5 md:px-6 py-4 flex items-start gap-3"
        style={{ borderBottom: `1px solid ${accent}1A` }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: `linear-gradient(135deg, ${accent}25, ${accent}10)`,
            border: `1px solid ${accent}40`,
          }}
        >
          <Icon size={17} style={{ color: accent }} />
        </div>
        <div className="min-w-0">
          <h2
            className="text-base md:text-lg font-bold leading-tight"
            style={{
              ...ORBITRON_GRADIENT_STYLE,
              letterSpacing: "0.03em",
            }}
          >
            {title}
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "rgba(168,237,255,0.5)" }}>
            {description}
          </p>
        </div>
      </header>
      <div className="p-5 md:p-6">{children}</div>
    </section>
  );
}

/** A subsection rule: small uppercase label with a teal divider. */
function SubHeader({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="pb-2" style={{ borderBottom: "1px solid rgba(61,214,245,0.10)" }}>
      <h3
        className="font-semibold text-[11px] tracking-[0.18em] uppercase"
        style={{ color: "rgba(168,237,255,0.55)" }}
      >
        {children}
      </h3>
      {hint && (
        <p className="text-xs mt-1" style={{ color: "rgba(168,237,255,0.35)" }}>
          {hint}
        </p>
      )}
    </div>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="text-xs font-medium block mb-1.5" style={{ color: "rgba(168,237,255,0.6)" }}>
      {children}
    </label>
  );
}

function FieldHint({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs mt-1" style={{ color: "rgba(168,237,255,0.35)" }}>
      {children}
    </p>
  );
}

function SaveButton({
  pending,
  pendingLabel = "Saving…",
  label = "Save Settings",
}: { pending: boolean; pendingLabel?: string; label?: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full md:w-auto md:px-8 py-3 rounded-xl font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-2"
      style={SAVE_BTN_STYLE}
    >
      <Save size={16} />
      {pending ? pendingLabel : label}
    </button>
  );
}

export default function AdminSettings() {
  const { data: settings, isLoading } = useGetAdminSettings();
  const updateSettings = useUpdateAdminSettings();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<TabKey>("general");

  const { register, handleSubmit, reset } = useForm<SettingsForm>();

  const smtpForm = useForm<SmtpForm>({
    defaultValues: {
      smtpEnabled: false,
      smtpHost: "",
      smtpPort: 587,
      smtpUser: "",
      smtpPassword: "",
      smtpFrom: "",
      smtpFromName: "URANUS TRADES",
      otpRegistrationEnabled: false,
      otpWithdrawalEnabled: false,
      otpWalletUpdateEnabled: false,
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

  // Wallet settings + regenerate state
  const [walletStats, setWalletStats] = useState<{ totalWithAddress: number; backupCount: number } | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [confirmRegen, setConfirmRegen] = useState(false);
  const [regenResult, setRegenResult] = useState<{ regenerated: number; backed_up: number; message: string } | null>(null);
  const [showBackups, setShowBackups] = useState(false);
  const [backups, setBackups] = useState<any[]>([]);
  const [backupsLoading, setBackupsLoading] = useState(false);
  const [backupSearch, setBackupSearch] = useState("");
  const [backupPage, setBackupPage] = useState(1);
  const BACKUP_PAGE_SIZE = 5;

  const loadWalletStats = () => {
    fetch("/api/admin/wallet-stats", { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json())
      .then(d => setWalletStats(d))
      .catch(() => {});
  };

  const doRegenerate = async () => {
    setRegenerating(true);
    setConfirmRegen(false);
    setRegenResult(null);
    try {
      const res = await fetch("/api/admin/wallet-settings/regenerate-all", {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      setRegenResult(data);
      loadWalletStats();
      toast({ title: "Wallets regenerated!", description: data.message });
    } catch (err: any) {
      toast({ title: "Failed", description: err?.message, variant: "destructive" });
    } finally {
      setRegenerating(false);
    }
  };

  const loadBackups = () => {
    setBackupsLoading(true);
    fetch("/api/admin/wallet-backups", { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json())
      .then(d => setBackups(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setBackupsLoading(false));
  };

  // Income settings
  const [incomeLoading, setIncomeLoading] = useState(false);
  const [incomeSaving, setIncomeSaving] = useState(false);
  const incomeForm = useForm<IncomeForm>({
    defaultValues: {
      spotReferralRate: 5,
      tier1DailyRate: 0.6, tier2DailyRate: 0.7, tier3DailyRate: 0.8,
      tier1Days: 300, tier2Days: 260, tier3Days: 225,
      levelCommL1: 20, levelCommL2: 10, levelCommL3: 10,
      levelCommL4: 4, levelCommL5: 4, levelCommL6: 4, levelCommL7: 4, levelCommL8: 4,
      levelUnlockL2: 1000, levelUnlockL3: 3000,
      levelUnlockL4: 10000, levelUnlockL5: 10000, levelUnlockL6: 10000, levelUnlockL7: 10000, levelUnlockL8: 10000,
      levelDaysL1: 0, levelDaysL2: 0, levelDaysL3: 0, levelDaysL4: 0,
      levelDaysL5: 0, levelDaysL6: 0, levelDaysL7: 0, levelDaysL8: 0,
    },
  });

  useEffect(() => {
    setIncomeLoading(true);
    fetch("/api/admin/income-settings", { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json())
      .then(d => incomeForm.reset(d))
      .catch(() => {})
      .finally(() => setIncomeLoading(false));
  }, []);

  const onIncomeSubmit = async (data: IncomeForm) => {
    setIncomeSaving(true);
    try {
      const res = await fetch("/api/admin/income-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save");
      const updated = await res.json();
      incomeForm.reset(updated);
      toast({ title: "Income settings saved!" });
    } catch (err: any) {
      toast({ title: "Failed", description: err?.message, variant: "destructive" });
    } finally {
      setIncomeSaving(false);
    }
  };

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
    loadWalletStats();
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

  // Withdrawal settings
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  const [withdrawalSaving, setWithdrawalSaving] = useState(false);
  const [showWithdrawKey, setShowWithdrawKey] = useState(false);
  const withdrawalForm = useForm<{ withdrawalMode: "auto" | "manual"; withdrawWalletPrivateKey: string }>({
    defaultValues: { withdrawalMode: "manual", withdrawWalletPrivateKey: "" },
  });

  useEffect(() => {
    setWithdrawalLoading(true);
    fetch("/api/admin/withdrawal-settings", { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json())
      .then(d => withdrawalForm.reset(d))
      .catch(() => {})
      .finally(() => setWithdrawalLoading(false));
  }, []);

  const onWithdrawalSubmit = async (data: { withdrawalMode: "auto" | "manual"; withdrawWalletPrivateKey: string }) => {
    setWithdrawalSaving(true);
    try {
      const res = await fetch("/api/admin/withdrawal-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save");
      const updated = await res.json();
      withdrawalForm.reset(updated);
      toast({ title: "Withdrawal settings saved!" });
    } catch (err: any) {
      toast({ title: "Failed", description: err?.message, variant: "destructive" });
    } finally {
      setWithdrawalSaving(false);
    }
  };

  const withdrawalMode = withdrawalForm.watch("withdrawalMode");
  const smtpEnabled = smtpForm.watch("smtpEnabled");
  const activeTabMeta = TABS.find(t => t.key === activeTab) ?? TABS[0];

  // Manual ROI payout
  const [payoutRunning, setPayoutRunning] = useState(false);
  const [payoutResult, setPayoutResult] = useState<{ processed: number; skipped: number; errors: number } | null>(null);
  const [payoutError, setPayoutError] = useState("");

  async function runManualPayout() {
    setPayoutRunning(true);
    setPayoutResult(null);
    setPayoutError("");
    try {
      const res = await fetch("/api/admin/run-daily-payout", {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Payout failed");
      setPayoutResult({ processed: data.processed, skipped: data.skipped, errors: data.errors });
      toast({ title: "ROI payout completed!", description: `${data.processed} investments processed` });
    } catch (err: any) {
      setPayoutError(err?.message || "Unknown error");
      toast({ title: "Payout failed", description: err?.message, variant: "destructive" });
    } finally {
      setPayoutRunning(false);
    }
  }

  if (isLoading) {
    return (
      <div className="px-4 md:px-6 py-6 max-w-5xl mx-auto space-y-4">
        {[1,2,3].map(i => (
          <div key={i} className="rounded-2xl h-24 animate-pulse" style={{ background: "rgba(61,214,245,0.04)", border: "1px solid rgba(61,214,245,0.08)" }} />
        ))}
      </div>
    );
  }

  // Backup viewer derived state (computed here to avoid IIFE crashes in JSX)
  const _bq = backupSearch.toLowerCase().trim();
  const _bFiltered = _bq
    ? backups.filter(b =>
        (b.userName ?? "").toLowerCase().includes(_bq) ||
        (b.userEmail ?? "").toLowerCase().includes(_bq) ||
        (b.oldAddress ?? "").toLowerCase().includes(_bq) ||
        String(b.userId) === _bq,
      )
    : backups;
  const _bTotalPages = Math.max(1, Math.ceil(_bFiltered.length / BACKUP_PAGE_SIZE));
  const _bSafePage = Math.min(backupPage, _bTotalPages);
  const _bPageRows = _bFiltered.slice((_bSafePage - 1) * BACKUP_PAGE_SIZE, _bSafePage * BACKUP_PAGE_SIZE);

  return (
    <div className="px-4 md:px-6 py-6 max-w-5xl mx-auto pb-24 md:pb-10">
      {/* Page Header */}
      <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, rgba(61,214,245,0.2), rgba(42,179,215,0.08))",
              border: "1px solid rgba(61,214,245,0.35)",
              boxShadow: "0 0 20px rgba(61,214,245,0.18)",
            }}
          >
            <Settings size={20} style={{ color: TEAL }} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold leading-tight" style={ORBITRON_GRADIENT_STYLE}>
              Platform Settings
            </h1>
            <p className="text-xs md:text-sm" style={{ color: "rgba(168,237,255,0.5)" }}>
              Configure how the platform behaves, from deposit limits to email delivery.
            </p>
          </div>
        </div>
      </header>

      {/* Tab Strip — sticky just under the global TopNav (h-14) */}
      <div
        className="sticky top-14 z-10 -mx-4 md:mx-0 px-4 md:px-0 pt-2 pb-2 mb-5"
        style={{ background: "rgba(1,8,16,0.92)", backdropFilter: "blur(10px)" }}
      >
        <div
          className="flex gap-1 overflow-x-auto rounded-2xl p-1.5 scrollbar-none"
          style={{
            background: "rgba(5,18,32,0.85)",
            border: "1px solid rgba(61,214,245,0.14)",
            backdropFilter: "blur(14px)",
          }}
        >
          {TABS.map(t => {
            const isActive = activeTab === t.key;
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all"
                style={
                  isActive
                    ? {
                        background: "linear-gradient(135deg, rgba(61,214,245,0.22), rgba(42,179,215,0.10))",
                        color: TEAL,
                        border: `1px solid ${TEAL}60`,
                        boxShadow: `0 0 12px ${TEAL}30`,
                      }
                    : {
                        color: "rgba(168,237,255,0.55)",
                        border: "1px solid transparent",
                      }
                }
              >
                <Icon size={15} style={{ color: isActive ? TEAL : "rgba(168,237,255,0.55)" }} />
                {t.label}
              </button>
            );
          })}
        </div>
        <p className="text-xs mt-2 px-1" style={{ color: "rgba(168,237,255,0.4)" }}>
          {activeTabMeta.desc}
        </p>
      </div>

      {/* ============ GENERAL ============ */}
      {activeTab === "general" && (
        <>
        <SectionCard
          icon={SlidersHorizontal}
          title="General Platform"
          description="Deposit boundaries, hyper coin pricing, master toggles and the launch offer countdown."
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <SubHeader>Deposit & Pricing</SubHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: "Min Deposit (USDT)",           testId: "input-min-deposit",        name: "minDeposit" as const,          type: "number", extra: {} },
                { label: "Max Deposit (USDT)",           testId: "input-max-deposit",        name: "maxDeposit" as const,          type: "number", extra: {} },
                { label: "Max Total Investment (USDT)",  testId: "input-max-total-invest",   name: "maxTotalInvestment" as const,  type: "number", extra: { step: "100", min: "100" } },
                { label: "Min HYPERCOIN % (0–100)",      testId: "input-hypercoin-pct",      name: "hyperCoinMinPercent" as const,  type: "number", extra: { step: "1", min: "0", max: "100" } },
                { label: "HYPERCOIN Price (USDT)",       testId: "input-hypercoin-price",    name: "hyperCoinPrice" as const,       type: "number", extra: { step: "0.0001", min: "0.0001" } },
                { label: "Spot Referral Rate (%)",       testId: "input-spot-commission",    name: "spotReferralRate" as const,     type: "number", extra: { step: "0.01" } },
              ].map(f => (
                <div key={f.name}>
                  <FieldLabel>{f.label}</FieldLabel>
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
            <SubHeader>HyperCoin Deposit Account</SubHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel>HC Deposit Username</FieldLabel>
                <input
                  type="text"
                  placeholder="e.g. uranaz_official"
                  {...register("hcDepositUsername")}
                  className={INPUT_CLS}
                  style={INPUT_STYLE}
                />
                <FieldHint>Users will be shown this username to send HyperCoin to during HC deposits.</FieldHint>
              </div>
            </div>

            <SubHeader>Platform Toggles</SubHeader>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { key: "maintenanceMode" as const,   label: "Maintenance Mode",    desc: "Disable all user logins temporarily" },
                { key: "launchOfferActive" as const, label: "Launch Offer Active", desc: "Show Singapore trip offer to users" },
                { key: "withdrawalEnabled" as const, label: "Withdrawals Enabled", desc: "Allow users to submit withdrawal requests" },
              ].map(item => (
                <label
                  key={item.key}
                  htmlFor={`toggle-${item.key}`}
                  className="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors"
                  style={{ background: "rgba(0,15,30,0.5)", border: "1px solid rgba(61,214,245,0.10)" }}
                >
                  <input
                    id={`toggle-${item.key}`}
                    type="checkbox"
                    data-testid={`toggle-${item.key}`}
                    {...register(item.key)}
                    className="w-4 h-4 mt-0.5"
                    style={{ accentColor: TEAL }}
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-medium" style={{ color: "rgba(168,237,255,0.85)" }}>{item.label}</div>
                    <div className="text-xs mt-0.5" style={{ color: "rgba(168,237,255,0.4)" }}>{item.desc}</div>
                  </div>
                </label>
              ))}
            </div>

            <SubHeader>Launch Offer Countdown</SubHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div>
                <FieldLabel>End Date &amp; Time</FieldLabel>
                <input
                  type="datetime-local"
                  {...register("launchOfferEndDate")}
                  className={INPUT_CLS}
                  style={INPUT_STYLE}
                />
                <FieldHint>Shown as a countdown on users&apos; dashboards. Leave blank for no deadline.</FieldHint>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <SaveButton pending={updateSettings.isPending} label="Save General Settings" />
            </div>
          </form>
        </SectionCard>

        <SectionCard
          icon={TrendingUp}
          title="ROI Distribution"
          description="Manually trigger the daily ROI payout for all active investments. The system also runs this automatically Mon–Fri at 03:00 AM IST."
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "rgba(61,214,245,0.05)", border: "1px solid rgba(61,214,245,0.14)" }}>
              <RefreshCw size={14} className="shrink-0 mt-0.5" style={{ color: TEAL }} />
              <div>
                <div className="text-xs font-semibold mb-0.5" style={{ color: TEAL }}>Auto-schedule active</div>
                <div className="text-xs leading-relaxed" style={{ color: "rgba(168,237,255,0.5)" }}>
                  Daily return + level commissions run automatically <strong style={{ color: "rgba(168,237,255,0.75)" }}>Mon–Fri at 03:00 AM IST</strong> via the API process. Use the button below to run it manually at any time.
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <button
                type="button"
                onClick={runManualPayout}
                disabled={payoutRunning}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-60"
                style={{
                  background: payoutRunning ? "rgba(52,211,153,0.08)" : "linear-gradient(135deg, rgba(52,211,153,0.18), rgba(16,185,129,0.1))",
                  border: "1px solid rgba(52,211,153,0.35)",
                  color: "rgba(52,211,153,0.95)",
                }}
              >
                {payoutRunning
                  ? <><RefreshCw size={14} className="animate-spin" /> Running…</>
                  : <><TrendingUp size={14} /> Run ROI Payout Now</>}
              </button>
            </div>

            {payoutResult && (
              <div className="p-4 rounded-xl space-y-2" style={{ background: "rgba(52,211,153,0.07)", border: "1px solid rgba(52,211,153,0.25)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 size={14} style={{ color: "rgba(52,211,153,0.9)" }} />
                  <span className="text-xs font-semibold" style={{ color: "rgba(52,211,153,0.9)" }}>Payout completed</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Processed", value: payoutResult.processed, color: "rgba(52,211,153,0.9)" },
                    { label: "Skipped",   value: payoutResult.skipped,   color: "rgba(168,237,255,0.6)" },
                    { label: "Errors",    value: payoutResult.errors,     color: payoutResult.errors > 0 ? "rgba(248,113,113,0.9)" : "rgba(168,237,255,0.4)" },
                  ].map(s => (
                    <div key={s.label} className="text-center p-2 rounded-lg" style={{ background: "rgba(0,10,20,0.4)" }}>
                      <div className="text-lg font-bold" style={{ color: s.color, fontFamily: "'Orbitron',sans-serif" }}>{s.value}</div>
                      <div className="text-xs mt-0.5" style={{ color: "rgba(168,237,255,0.4)" }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {payoutError && (
              <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.3)" }}>
                <AlertTriangle size={14} className="shrink-0" style={{ color: "rgba(248,113,113,0.9)" }} />
                <span className="text-xs" style={{ color: "rgba(248,113,113,0.9)" }}>{payoutError}</span>
              </div>
            )}
          </div>
        </SectionCard>
        </>
      )}

      {/* ============ BLOCKCHAIN ============ */}
      {activeTab === "blockchain" && (
        <SectionCard
          icon={Wallet}
          title="Blockchain & Wallets"
          description="Master wallet for sweeping USDT, gas wallet for paying BSC fees, RPC endpoint and the on-chain minimum deposit."
        >
          {walletLoading ? (
            <div className="space-y-3">
              {[1,2,3,4].map(i => <div key={i} className="h-11 rounded-xl animate-pulse" style={{ background: "rgba(61,214,245,0.04)" }} />)}
            </div>
          ) : (
            <form onSubmit={walletForm.handleSubmit(onWalletSubmit)} className="space-y-6">
              {/* Security notice */}
              <div className="flex gap-3 p-3.5 rounded-xl" style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.20)" }}>
                <ShieldAlert size={16} className="shrink-0 mt-0.5" style={{ color: "rgba(251,191,36,0.85)" }} />
                <div className="text-xs leading-relaxed" style={{ color: "rgba(251,191,36,0.8)" }}>
                  <strong>Security Notice:</strong> Private keys are stored encrypted in the database. The gas wallet should hold only enough BNB to cover sweep fees. Do not use a wallet with large BNB holdings.
                </div>
              </div>

              <SubHeader hint="All swept USDT will be sent here.">Master Wallet — receives all user USDT deposits</SubHeader>
              <div>
                <FieldLabel>Admin Master Wallet Address (BEP-20)</FieldLabel>
                <input
                  type="text"
                  placeholder="0x..."
                  {...walletForm.register("adminMasterWallet")}
                  className={INPUT_CLS + " font-mono"}
                  style={INPUT_STYLE}
                />
              </div>

              <SubHeader hint="This wallet's BNB is used to fund deposit addresses before sweeping USDT.">Gas Wallet — pays BNB fees for sweeping</SubHeader>
              <div>
                <FieldLabel>Gas Wallet Private Key</FieldLabel>
                <div className="relative">
                  <input
                    type={showGasKey ? "text" : "password"}
                    placeholder="0x... (private key with BNB for gas)"
                    {...walletForm.register("gasWalletPrivateKey")}
                    className={INPUT_CLS + " pr-10 font-mono"}
                    style={INPUT_STYLE}
                  />
                  <button
                    type="button"
                    onClick={() => setShowGasKey(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "rgba(168,237,255,0.5)" }}
                    aria-label={showGasKey ? "Hide key" : "Show key"}
                  >
                    {showGasKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <SubHeader>Network</SubHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Min Deposit (USDT)</FieldLabel>
                  <input
                    type="number" step="0.01" min="0"
                    {...walletForm.register("minDepositUsdt", { valueAsNumber: true })}
                    className={INPUT_CLS}
                    style={INPUT_STYLE}
                  />
                </div>
                <div>
                  <FieldLabel>BSC RPC URL</FieldLabel>
                  <input
                    type="text"
                    placeholder="https://bsc-dataseed.binance.org/"
                    {...walletForm.register("bscRpcUrl")}
                    className={INPUT_CLS + " font-mono"}
                    style={INPUT_STYLE}
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <SaveButton pending={walletSaving} label="Save Wallet Settings" />
              </div>
            </form>
          )}
        </SectionCard>
      )}

      {/* ============ WITHDRAWALS ============ */}
      {activeTab === "withdrawals" && (
        <SectionCard
          icon={ArrowUpRight}
          title="Withdrawal Settings"
          description="Choose how user payouts are processed and which wallet sends USDT to users."
        >
          {withdrawalLoading ? (
            <div className="space-y-3">
              {[1,2].map(i => <div key={i} className="h-11 rounded-xl animate-pulse" style={{ background: "rgba(61,214,245,0.04)" }} />)}
            </div>
          ) : (
            <form onSubmit={withdrawalForm.handleSubmit(onWithdrawalSubmit)} className="space-y-6">
              <div className="flex gap-3 p-3.5 rounded-xl" style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.20)" }}>
                <ShieldAlert size={16} className="shrink-0 mt-0.5" style={{ color: "rgba(251,191,36,0.85)" }} />
                <div className="text-xs leading-relaxed" style={{ color: "rgba(251,191,36,0.8)" }}>
                  <strong>Security Notice:</strong> The withdrawal wallet private key is stored in the database. This wallet should hold USDT for payouts. BNB top-ups come from the gas wallet above when balance is low.
                </div>
              </div>

              <SubHeader>Processing Mode</SubHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(["manual", "auto"] as const).map(mode => (
                  <label
                    key={mode}
                    className="flex flex-col items-center justify-center gap-2 p-5 rounded-xl cursor-pointer transition-all"
                    style={{
                      background: withdrawalMode === mode ? "rgba(61,214,245,0.14)" : "rgba(0,15,30,0.5)",
                      border: `1px solid ${withdrawalMode === mode ? "rgba(61,214,245,0.5)" : "rgba(61,214,245,0.10)"}`,
                      boxShadow: withdrawalMode === mode ? "0 0 16px rgba(61,214,245,0.18)" : "none",
                    }}
                  >
                    <input
                      type="radio"
                      value={mode}
                      {...withdrawalForm.register("withdrawalMode")}
                      className="sr-only"
                    />
                    <div className="text-base font-bold capitalize" style={{ color: withdrawalMode === mode ? TEAL : "rgba(168,237,255,0.6)" }}>
                      {mode}
                    </div>
                    <div className="text-xs text-center" style={{ color: "rgba(168,237,255,0.4)" }}>
                      {mode === "manual" ? "Admin approves each request" : "On-chain send on submit"}
                    </div>
                  </label>
                ))}
              </div>

              {withdrawalMode === "auto" && (
                <div className="flex gap-2 p-3 rounded-xl" style={{ background: "rgba(61,214,245,0.06)", border: "1px solid rgba(61,214,245,0.18)" }}>
                  <div className="text-xs leading-relaxed" style={{ color: "rgba(168,237,255,0.6)" }}>
                    In <strong style={{ color: TEAL }}>Auto</strong> mode, USDT is sent on-chain immediately when a user submits a withdrawal request. Make sure the withdrawal wallet has sufficient USDT balance.
                  </div>
                </div>
              )}

              <SubHeader hint="If its BNB runs low, the gas wallet tops it up automatically.">Withdrawal Wallet — sends USDT to users</SubHeader>
              <div>
                <FieldLabel>Withdrawal Wallet Private Key</FieldLabel>
                <div className="relative">
                  <input
                    type={showWithdrawKey ? "text" : "password"}
                    placeholder="0x... (private key of wallet holding USDT for payouts)"
                    {...withdrawalForm.register("withdrawWalletPrivateKey")}
                    className={INPUT_CLS + " pr-10 font-mono"}
                    style={INPUT_STYLE}
                  />
                  <button
                    type="button"
                    onClick={() => setShowWithdrawKey(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "rgba(168,237,255,0.5)" }}
                    aria-label={showWithdrawKey ? "Hide key" : "Show key"}
                  >
                    {showWithdrawKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <SaveButton pending={withdrawalSaving} label="Save Withdrawal Settings" />
              </div>
            </form>
          )}
        </SectionCard>
      )}

      {/* ============ INCOME ============ */}
      {activeTab === "income" && (
        <SectionCard
          icon={TrendingUp}
          title="Income Settings"
          description="Spot referral, daily tier rates, level commission percentages and the unlock thresholds for each level."
        >
          {incomeLoading ? (
            <div className="space-y-3">
              {[1,2,3,4].map(i => <div key={i} className="h-11 rounded-xl animate-pulse" style={{ background: "rgba(61,214,245,0.04)" }} />)}
            </div>
          ) : (
            <form onSubmit={incomeForm.handleSubmit(onIncomeSubmit)} className="space-y-7">
              {/* Spot Referral */}
              <div>
                <SubHeader hint="Paid to the sponsor when their referral makes an investment.">
                  <span className="inline-flex items-center gap-1.5"><BadgeDollarSign size={12} />Spot Referral Commission</span>
                </SubHeader>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <FieldLabel>Rate (%)</FieldLabel>
                    <input
                      type="number" step="0.1" min="0" max="100"
                      {...incomeForm.register("spotReferralRate", { valueAsNumber: true })}
                      className={INPUT_CLS} style={INPUT_STYLE}
                    />
                  </div>
                </div>
              </div>

              {/* Tier Daily Rates */}
              <div>
                <SubHeader>
                  <span className="inline-flex items-center gap-1.5"><Coins size={12} />Daily Return Rates per Tier</span>
                </SubHeader>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 mb-4">
                  {([
                    { label: "Tier 1 Rate (%)", name: "tier1DailyRate" as const, hint: "$100–$400" },
                    { label: "Tier 2 Rate (%)", name: "tier2DailyRate" as const, hint: "$500–$900" },
                    { label: "Tier 3 Rate (%)", name: "tier3DailyRate" as const, hint: "$1000–$1500" },
                  ]).map(f => (
                    <div key={f.name}>
                      <FieldLabel>{f.label}</FieldLabel>
                      <input type="number" step="0.01" min="0" max="100"
                        {...incomeForm.register(f.name, { valueAsNumber: true })}
                        className={INPUT_CLS} style={INPUT_STYLE}
                      />
                      <FieldHint>{f.hint}</FieldHint>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {([
                    { label: "Tier 1 Days", name: "tier1Days" as const },
                    { label: "Tier 2 Days", name: "tier2Days" as const },
                    { label: "Tier 3 Days", name: "tier3Days" as const },
                  ]).map(f => (
                    <div key={f.name}>
                      <FieldLabel>{f.label}</FieldLabel>
                      <input type="number" min="1"
                        {...incomeForm.register(f.name, { valueAsNumber: true })}
                        className={INPUT_CLS} style={INPUT_STYLE}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Level Commission Rates */}
              <div>
                <SubHeader hint="% of the investor's daily return credited to each upline level">
                  <span className="inline-flex items-center gap-1.5"><Layers size={12} />Level Commission Rates (%)</span>
                </SubHeader>
                <div className="grid grid-cols-4 lg:grid-cols-8 gap-3 mt-3">
                  {([1,2,3,4,5,6,7,8] as const).map(lvl => (
                    <div key={lvl}>
                      <FieldLabel>L{lvl}</FieldLabel>
                      <input type="number" step="0.1" min="0" max="100"
                        {...incomeForm.register(`levelCommL${lvl}` as keyof IncomeForm, { valueAsNumber: true })}
                        className={INPUT_CLS + " text-center"} style={INPUT_STYLE}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Level Unlock Thresholds */}
              <div>
                <SubHeader hint="Total earnings required to unlock each level (L1 is always unlocked)">
                  <span className="inline-flex items-center gap-1.5"><Layers size={12} />Level Unlock Thresholds ($)</span>
                </SubHeader>
                <div className="grid grid-cols-4 lg:grid-cols-8 gap-3 mt-3">
                  <div className="p-2.5 rounded-xl flex flex-col items-center justify-center" style={{ background: "rgba(61,214,245,0.06)", border: "1px solid rgba(61,214,245,0.15)" }}>
                    <span className="text-xs font-bold" style={{ color: TEAL }}>L1</span>
                    <span className="text-[11px] mt-0.5" style={{ color: "rgba(168,237,255,0.4)" }}>Always</span>
                  </div>
                  {([2,3,4,5,6,7,8] as const).map(lvl => (
                    <div key={lvl}>
                      <FieldLabel>L{lvl} ($)</FieldLabel>
                      <input type="number" min="0"
                        {...incomeForm.register(`levelUnlockL${lvl}` as keyof IncomeForm, { valueAsNumber: true })}
                        className={INPUT_CLS + " text-center"} style={INPUT_STYLE}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Level Commission Active Days */}
              <div>
                <SubHeader hint="Number of days from investment start that each level earns commission. Set 0 for unlimited (no expiry).">
                  <span className="inline-flex items-center gap-1.5"><Layers size={12} />Level Commission Days (0 = unlimited)</span>
                </SubHeader>
                <div className="grid grid-cols-4 lg:grid-cols-8 gap-3 mt-3">
                  {([1,2,3,4,5,6,7,8] as const).map(lvl => (
                    <div key={lvl}>
                      <FieldLabel>L{lvl}</FieldLabel>
                      <input type="number" min="0" step="1"
                        {...incomeForm.register(`levelDaysL${lvl}` as keyof IncomeForm, { valueAsNumber: true })}
                        className={INPUT_CLS + " text-center"} style={INPUT_STYLE}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-[11px] mt-2" style={{ color: "rgba(168,237,255,0.35)" }}>
                  Example: L1 = 180 means the direct upline receives Level 1 commission only for the first 180 days of each investment. After that, L1 commission stops for that investment.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <SaveButton pending={incomeSaving} label="Save Income Settings" />
              </div>
            </form>
          )}
        </SectionCard>
      )}

      {/* ============ EMAIL & SMTP ============ */}
      {activeTab === "email" && (
        <SectionCard
          icon={Mail}
          title="Email & SMTP"
          description="Connect your SMTP provider and choose which user actions trigger email OTPs and confirmations."
        >
          {smtpLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-11 rounded-xl animate-pulse" style={{ background: "rgba(61,214,245,0.04)" }} />)}
            </div>
          ) : (
            <form onSubmit={smtpForm.handleSubmit(onSmtpSubmit)} className="space-y-6">
              {/* Global SMTP Toggle */}
              <div
                className="flex items-center justify-between gap-4 p-4 rounded-xl"
                style={{ background: "rgba(61,214,245,0.06)", border: "1px solid rgba(61,214,245,0.20)" }}
              >
                <div>
                  <div className="text-sm font-bold" style={{ color: "rgba(168,237,255,0.95)" }}>SMTP Enabled</div>
                  <div className="text-xs mt-0.5" style={{ color: "rgba(168,237,255,0.5)" }}>
                    Master switch — must be ON for any email to send
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
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

              <SubHeader>SMTP Credentials</SubHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <FieldLabel>SMTP Host</FieldLabel>
                  <input
                    type="text"
                    placeholder="smtp.gmail.com"
                    {...smtpForm.register("smtpHost")}
                    className={INPUT_CLS}
                    style={INPUT_STYLE}
                  />
                </div>
                <div>
                  <FieldLabel>Port</FieldLabel>
                  <input
                    type="number"
                    placeholder="587"
                    {...smtpForm.register("smtpPort", { valueAsNumber: true })}
                    className={INPUT_CLS}
                    style={INPUT_STYLE}
                  />
                </div>
                <div>
                  <FieldLabel>SMTP Username</FieldLabel>
                  <input
                    type="text"
                    placeholder="you@gmail.com"
                    {...smtpForm.register("smtpUser")}
                    className={INPUT_CLS}
                    style={INPUT_STYLE}
                  />
                </div>
                <div>
                  <FieldLabel>Password / App Key</FieldLabel>
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
                      style={{ color: "rgba(168,237,255,0.5)" }}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div>
                  <FieldLabel>From Email</FieldLabel>
                  <input
                    type="email"
                    placeholder="noreply@uranus.com"
                    {...smtpForm.register("smtpFrom")}
                    className={INPUT_CLS}
                    style={INPUT_STYLE}
                  />
                </div>
                <div>
                  <FieldLabel>From Name</FieldLabel>
                  <input
                    type="text"
                    placeholder="URANUS TRADES"
                    {...smtpForm.register("smtpFromName")}
                    className={INPUT_CLS}
                    style={INPUT_STYLE}
                  />
                </div>
              </div>

              <SubHeader>Email Features</SubHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { key: "otpRegistrationEnabled" as const,   label: "OTP on Registration",         desc: "Send email OTP to verify new accounts before they're created" },
                  { key: "otpWithdrawalEnabled" as const,     label: "OTP on Withdrawal",           desc: "Require email OTP verification before processing withdrawal requests" },
                  { key: "otpWalletUpdateEnabled" as const,   label: "OTP on Wallet Address Change", desc: "Require email OTP when a user updates their withdrawal wallet address" },
                  { key: "depositConfirmationEnabled" as const, label: "Deposit Confirmation Email", desc: "Send a confirmation email when a new investment is activated" },
                ].map(item => {
                  const val = smtpForm.watch(item.key);
                  return (
                    <div
                      key={item.key}
                      className="flex items-center justify-between gap-4 p-3.5 rounded-xl"
                      style={{ background: "rgba(0,15,30,0.5)", border: "1px solid rgba(61,214,245,0.10)" }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium" style={{ color: "rgba(168,237,255,0.85)" }}>{item.label}</div>
                        <div className="text-xs mt-0.5" style={{ color: "rgba(168,237,255,0.4)" }}>{item.desc}</div>
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

              <div className="pt-2 flex justify-end">
                <SaveButton pending={smtpSaving} label="Save SMTP Settings" />
              </div>
            </form>
          )}
        </SectionCard>
      )}

      {/* ============ MAINTENANCE ============ */}
      {activeTab === "maintenance" && (
        <>
        <SectionCard
          icon={RefreshCw}
          title="Wallet Maintenance"
          description="Regenerate every user deposit address and review the archived backup keys. Use with caution — this is a destructive operation."
          accent="#f87171"
        >
          <div className="space-y-5">
            {/* Stats row */}
            {walletStats && (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl text-center" style={{ background: "rgba(61,214,245,0.06)", border: "1px solid rgba(61,214,245,0.14)" }}>
                  <div className="text-2xl font-bold" style={{ color: TEAL, fontFamily: "'Orbitron',sans-serif" }}>{walletStats.totalWithAddress}</div>
                  <div className="text-xs mt-1" style={{ color: "rgba(168,237,255,0.5)" }}>Users with wallets</div>
                </div>
                <div className="p-4 rounded-xl text-center" style={{ background: "rgba(61,214,245,0.06)", border: "1px solid rgba(61,214,245,0.14)" }}>
                  <div className="text-2xl font-bold" style={{ color: TEAL, fontFamily: "'Orbitron',sans-serif" }}>{walletStats.backupCount}</div>
                  <div className="text-xs mt-1" style={{ color: "rgba(168,237,255,0.5)" }}>Backed-up old keys</div>
                </div>
              </div>
            )}

            <p className="text-xs leading-relaxed" style={{ color: "rgba(168,237,255,0.55)" }}>
              Generates a new independent BEP-20 wallet for every existing user. Each wallet is freshly created (not HD/seed-derived). All old private keys are archived to the backup table before being replaced.
            </p>

            {/* Confirm prompt */}
            {!confirmRegen ? (
              <button
                type="button"
                onClick={() => setConfirmRegen(true)}
                disabled={regenerating}
                className="w-full md:w-auto md:px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                style={{
                  background: "rgba(248,113,113,0.10)",
                  border: "1px solid rgba(248,113,113,0.40)",
                  color: "rgba(248,113,113,0.95)",
                  letterSpacing: "0.03em",
                }}
              >
                <RefreshCw size={15} />
                Regenerate All Deposit Addresses
              </button>
            ) : (
              <div className="p-4 rounded-xl space-y-3" style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.35)" }}>
                <div className="flex gap-2 items-start">
                  <AlertTriangle size={15} className="shrink-0 mt-0.5" style={{ color: "rgba(248,113,113,0.9)" }} />
                  <p className="text-xs font-medium leading-relaxed" style={{ color: "rgba(248,113,113,0.9)" }}>
                    This will assign a brand-new wallet address to every user. Old addresses are backed up. Users must use their new address for future deposits. Continue?
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={doRegenerate}
                    disabled={regenerating}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                    style={{ background: "rgba(248,113,113,0.85)", color: "#fff" }}
                  >
                    {regenerating ? <><RefreshCw size={13} className="animate-spin" /> Regenerating…</> : "Yes, Regenerate"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmRegen(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                    style={{ background: "rgba(61,214,245,0.08)", border: "1px solid rgba(61,214,245,0.2)", color: "rgba(168,237,255,0.7)" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Result */}
            {regenResult && (
              <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "rgba(52,211,153,0.07)", border: "1px solid rgba(52,211,153,0.25)" }}>
                <CheckCircle2 size={14} style={{ color: "rgba(52,211,153,0.9)" }} />
                <span className="text-xs" style={{ color: "rgba(52,211,153,0.9)" }}>{regenResult.message}</span>
              </div>
            )}

            {/* Old Key Backups Viewer */}
            <div style={{ borderTop: "1px solid rgba(61,214,245,0.10)", paddingTop: "16px" }}>
              <button
                type="button"
                onClick={() => { setShowBackups(v => !v); if (!showBackups) loadBackups(); }}
                className="flex items-center gap-2 text-xs font-medium"
                style={{ color: "rgba(168,237,255,0.6)" }}
              >
                <Database size={13} />
                {showBackups ? "Hide" : "View"} Old Key Backups
                {walletStats && walletStats.backupCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-xs" style={{ background: "rgba(61,214,245,0.15)", color: TEAL }}>
                    {walletStats.backupCount}
                  </span>
                )}
              </button>

              {showBackups && (
                  <div className="mt-4 space-y-3">
                    {/* Search */}
                    <div className="relative">
                      <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(168,237,255,0.35)" }} />
                      <input
                        value={backupSearch}
                        onChange={e => { setBackupSearch(e.target.value); setBackupPage(1); }}
                        placeholder="Search by name, email or address…"
                        className="w-full text-xs pl-8 pr-8 py-2 rounded-lg outline-none"
                        style={{ background: "rgba(0,15,30,0.7)", border: "1px solid rgba(61,214,245,0.18)", color: "rgba(168,237,255,0.9)" }}
                      />
                      {backupSearch && (
                        <button onClick={() => { setBackupSearch(""); setBackupPage(1); }} className="absolute right-2 top-1/2 -translate-y-1/2" style={{ color: "rgba(168,237,255,0.4)" }}>
                          <X size={12} />
                        </button>
                      )}
                    </div>

                    {/* List */}
                    {backupsLoading ? (
                      <div className="h-16 rounded-xl animate-pulse" style={{ background: "rgba(61,214,245,0.04)" }} />
                    ) : _bPageRows.length === 0 ? (
                      <p className="text-xs text-center py-4" style={{ color: "rgba(168,237,255,0.4)" }}>
                        {backupSearch ? "No backups match your search" : "No backups yet"}
                      </p>
                    ) : (
                      _bPageRows.map(b => (
                        <div
                          key={b.id}
                          className="p-3 rounded-xl space-y-1.5"
                          style={{ background: "rgba(0,15,30,0.6)", border: "1px solid rgba(61,214,245,0.10)" }}
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-medium" style={{ color: "rgba(168,237,255,0.7)" }}>{b.userName ?? `User #${b.userId}`}</span>
                            <span className="text-xs" style={{ color: "rgba(168,237,255,0.4)" }}>{new Date(b.replacedAt).toLocaleDateString()}</span>
                          </div>
                          <div className="text-xs font-mono break-all" style={{ color: "rgba(168,237,255,0.55)" }}>
                            <span style={{ color: "rgba(168,237,255,0.4)" }}>Addr: </span>{b.oldAddress}
                          </div>
                          <div className="text-xs font-mono break-all" style={{ color: "rgba(248,113,113,0.55)" }}>
                            <span style={{ color: "rgba(168,237,255,0.4)" }}>Key: </span>{b.oldPrivateKey}
                          </div>
                        </div>
                      ))
                    )}

                    {/* Pagination */}
                    {_bTotalPages > 1 && (
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px]" style={{ color: "rgba(168,237,255,0.4)" }}>
                          {_bFiltered.length} result{_bFiltered.length !== 1 ? "s" : ""} — page {_bSafePage} / {_bTotalPages}
                        </span>
                        <div className="flex gap-1.5">
                          <button
                            disabled={_bSafePage <= 1}
                            onClick={() => setBackupPage(p => Math.max(1, p - 1))}
                            className="p-1.5 rounded-md disabled:opacity-30 transition-all"
                            style={{ background: "rgba(61,214,245,0.08)", border: "1px solid rgba(61,214,245,0.18)", color: "#3DD6F5" }}
                          >
                            <ChevronLeft size={13} />
                          </button>
                          <button
                            disabled={_bSafePage >= _bTotalPages}
                            onClick={() => setBackupPage(p => Math.min(_bTotalPages, p + 1))}
                            className="p-1.5 rounded-md disabled:opacity-30 transition-all"
                            style={{ background: "rgba(61,214,245,0.08)", border: "1px solid rgba(61,214,245,0.18)", color: "#3DD6F5" }}
                          >
                            <ChevronRight size={13} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
              )}
            </div>
          </div>
        </SectionCard>
        </>
      )}
    </div>
  );
}
