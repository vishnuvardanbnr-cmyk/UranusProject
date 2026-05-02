import { useState } from "react";
import {
  useGetIncomeSummary,
  useListInvestments,
  useListWithdrawals,
} from "@workspace/api-client-react";
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  X,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  Calendar,
  Hash,
  DollarSign,
  Percent,
  Timer,
  MapPin,
  AlertCircle,
} from "lucide-react";

const TEAL = "#3DD6F5";
const GLASS = {
  background: "rgba(5,18,32,0.65)",
  backdropFilter: "blur(14px)",
  border: "1px solid rgba(61,214,245,0.10)",
} as const;

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  pending:   { icon: Clock,        color: "#fbbf24", label: "Pending"  },
  approved:  { icon: CheckCircle,  color: "#34d399", label: "Approved" },
  rejected:  { icon: XCircle,      color: "#f87171", label: "Rejected" },
  active:    { icon: TrendingUp,   color: TEAL,      label: "Active"   },
  completed: { icon: CheckCircle,  color: "#34d399", label: "Completed"},
};

const planLabels: Record<string, string> = {
  tier1: "Starter — 0.6%/day · 300 days",
  tier2: "Growth  — 0.7%/day · 260 days",
  tier3: "Premium — 0.8%/day · 225 days",
};

function formatDate(iso: string, full = false) {
  const d = new Date(iso);
  return full
    ? d.toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function shortId(id: string | number) {
  return String(id).slice(0, 8).toUpperCase();
}

/* ────────────────────────────────────────────────
   DETAIL MODAL
   ──────────────────────────────────────────────── */
function DetailModal({ item, type, onClose }: { item: any; type: "deposit" | "withdraw"; onClose: () => void }) {
  const cfg = statusConfig[item.status] || statusConfig.pending;
  const isDeposit = type === "deposit";
  const accentColor = isDeposit ? TEAL : "#f87171";

  const allRows =
    isDeposit
      ? [
          { icon: Hash,       label: "Transaction ID",  value: `#${shortId(item.id)}`,                                        raw: item.id },
          { icon: Calendar,   label: "Date",            value: formatDate(item.createdAt, true),                               raw: item.createdAt },
          { icon: DollarSign, label: "Total Amount",    value: `$${item.amount?.toFixed(2)}`,                                  raw: item.amount },
          { icon: DollarSign, label: "USDT",            value: item.usdtAmount != null ? `$${item.usdtAmount.toFixed(2)}` : null, raw: item.usdtAmount },
          { icon: DollarSign, label: "HYPERCOIN",       value: item.hyperCoinAmount != null ? `$${item.hyperCoinAmount.toFixed(2)}` : null, raw: item.hyperCoinAmount },
          { icon: Percent,    label: "Plan",            value: item.plan ? (planLabels[item.plan] ?? item.plan) : null,        raw: item.plan },
          { icon: TrendingUp, label: "Expected Return", value: item.expectedReturn != null ? `$${item.expectedReturn.toFixed(2)}` : null, raw: item.expectedReturn },
          { icon: Timer,      label: "Duration",        value: item.durationDays != null ? `${item.durationDays} days` : null, raw: item.durationDays },
          { icon: Calendar,   label: "Maturity Date",   value: item.maturityDate ? formatDate(item.maturityDate) : null,       raw: item.maturityDate },
        ]
      : [
          { icon: Hash,         label: "Transaction ID", value: `#${shortId(item.id)}`,                                             raw: item.id },
          { icon: Calendar,     label: "Requested",      value: formatDate(item.createdAt, true),                                   raw: item.createdAt },
          { icon: DollarSign,   label: "Amount",         value: `$${item.amount?.toFixed(2)}`,                                      raw: item.amount },
          { icon: MapPin,       label: "Wallet Address", value: item.walletAddress ?? null,                                          raw: item.walletAddress },
          { icon: Calendar,     label: "Processed",      value: item.processedAt ? formatDate(item.processedAt, true) : "Awaiting", raw: true },
          { icon: AlertCircle,  label: "Reason",         value: item.rejectionReason ?? null,                                        raw: item.rejectionReason },
        ];

  const rows = allRows.filter(r => r.value !== null);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3"
      style={{ background: "rgba(1,8,16,0.88)", backdropFilter: "blur(10px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(170deg, rgba(4,16,32,0.99) 0%, rgba(2,10,22,0.99) 100%)",
          border: "1px solid rgba(61,214,245,0.16)",
          boxShadow: "0 8px 60px rgba(1,8,16,0.9), 0 0 0 1px rgba(61,214,245,0.06)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top accent bar */}
        <div
          className="h-0.5 w-full"
          style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${accentColor}20, ${accentColor}08)`,
                border: `1px solid ${accentColor}30`,
                boxShadow: `0 0 16px ${accentColor}15`,
              }}
            >
              {isDeposit
                ? <ArrowDownLeft size={17} style={{ color: accentColor }} />
                : <ArrowUpRight  size={17} style={{ color: accentColor }} />}
            </div>
            <div>
              <div
                className="font-bold text-sm tracking-wide"
                style={{ color: "rgba(200,240,255,0.92)", fontFamily: "'Orbitron', sans-serif", fontSize: "0.78rem" }}
              >
                {isDeposit ? "Deposit Details" : "Withdrawal Details"}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: cfg.color, boxShadow: `0 0 6px ${cfg.color}` }}
                />
                <span className="text-xs font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:brightness-125"
            style={{ background: "rgba(168,237,255,0.06)", border: "1px solid rgba(168,237,255,0.09)" }}
          >
            <X size={14} style={{ color: "rgba(168,237,255,0.45)" }} />
          </button>
        </div>

        {/* Amount hero */}
        <div
          className="mx-5 mb-5 rounded-2xl py-5 text-center"
          style={{
            background: isDeposit
              ? "linear-gradient(135deg, rgba(61,214,245,0.07), rgba(42,179,215,0.03))"
              : "linear-gradient(135deg, rgba(248,113,113,0.07), rgba(220,80,80,0.03))",
            border: `1px solid ${accentColor}20`,
          }}
        >
          <div className="text-xs mb-2 uppercase tracking-widest" style={{ color: "rgba(168,237,255,0.35)" }}>
            {isDeposit ? "Amount Deposited" : "Amount Withdrawn"}
          </div>
          <div
            className="font-black"
            style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: "1.75rem",
              color: accentColor,
              letterSpacing: "-0.01em",
              textShadow: `0 0 24px ${accentColor}50`,
            }}
          >
            {isDeposit ? "+" : "−"}${item.amount?.toFixed(2)}
          </div>
        </div>

        {/* Divider */}
        <div className="mx-5 mb-4 h-px" style={{ background: "rgba(61,214,245,0.07)" }} />

        {/* Detail rows — two-column label/value layout */}
        <div className="px-5 pb-6 space-y-0">
          {rows.map((row, i) => (
            <div
              key={row.label}
              className="flex items-center justify-between py-3"
              style={{
                borderBottom: i < rows.length - 1 ? "1px solid rgba(61,214,245,0.05)" : "none",
              }}
            >
              <div className="flex items-center gap-2.5">
                <row.icon size={12} style={{ color: "rgba(168,237,255,0.28)" }} />
                <span className="text-xs" style={{ color: "rgba(168,237,255,0.42)" }}>{row.label}</span>
              </div>
              <span
                className="text-xs font-semibold text-right max-w-[55%] break-all leading-relaxed"
                style={{
                  color: row.label === "Transaction ID"
                    ? "rgba(168,237,255,0.55)"
                    : row.label === "Reason"
                      ? "#f87171"
                      : row.label === "Processed" && row.value === "Awaiting"
                        ? "#fbbf24"
                        : "rgba(200,240,255,0.85)",
                  fontFamily: row.label === "Transaction ID" || row.label === "Wallet Address"
                    ? "monospace"
                    : "inherit",
                }}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────
   EMPTY STATE
   ──────────────────────────────────────────────── */
function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-xl p-12 text-center" style={GLASS}>
      <Wallet size={36} className="mx-auto mb-3" style={{ color: "rgba(168,237,255,0.15)" }} />
      <p className="text-sm" style={{ color: "rgba(168,237,255,0.3)" }}>No {label} yet</p>
    </div>
  );
}

/* ────────────────────────────────────────────────
   MAIN PAGE
   ──────────────────────────────────────────────── */
type Tab = "deposit" | "withdraw";

export default function WalletPage({ user }: { user: any }) {
  const [tab, setTab]         = useState<Tab>("deposit");
  const [selected, setSelected] = useState<{ item: any; type: Tab } | null>(null);

  const { data: summary }     = useGetIncomeSummary();
  const { data: investments }  = useListInvestments();
  const { data: withdrawals }  = useListWithdrawals();

  const deposits = [...(investments ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const withdrawList = [...(withdrawals ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const tabs = [
    { id: "deposit"  as Tab, label: "Deposit History",  icon: ArrowDownLeft },
    { id: "withdraw" as Tab, label: "Withdraw History", icon: ArrowUpRight  },
  ];

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-5 pb-28 md:pb-8">
      {/* Header */}
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
        Wallet
      </h1>

      {/* Balance Cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Available Balance",  value: summary?.availableBalance,  highlight: true  },
          { label: "Total Earnings",     value: summary?.totalEarnings,     highlight: false },
          { label: "Pending Withdrawal", value: summary?.pendingWithdrawal, highlight: false },
          { label: "Total Withdrawn",    value: summary?.withdrawnTotal,    highlight: false },
        ].map(item => (
          <div
            key={item.label}
            className="rounded-xl p-4"
            style={item.highlight ? {
              background: "linear-gradient(135deg, rgba(61,214,245,0.12), rgba(42,179,215,0.06))",
              border: "1px solid rgba(61,214,245,0.28)",
              boxShadow: "0 0 20px rgba(61,214,245,0.07)",
            } : GLASS}
          >
            <div className="text-xs mb-1" style={{ color: "rgba(168,237,255,0.4)" }}>{item.label}</div>
            <div
              className="font-black"
              style={{
                fontFamily: "'Orbitron', sans-serif",
                color: item.highlight ? TEAL : "rgba(168,237,255,0.88)",
                fontSize: "1.05rem",
              }}
            >
              ${item.value?.toFixed(2) ?? "0.00"}
            </div>
          </div>
        ))}
      </div>

      {/* Tab switcher */}
      <div
        className="flex rounded-xl p-1 gap-1"
        style={{ background: "rgba(0,10,24,0.6)", border: "1px solid rgba(61,214,245,0.10)" }}
      >
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all"
            style={tab === t.id ? {
              background: "linear-gradient(135deg, #3DD6F5, #2AB3CF)",
              color: "#010810",
              boxShadow: "0 0 12px rgba(61,214,245,0.35)",
            } : {
              color: "rgba(168,237,255,0.45)",
            }}
          >
            <t.icon size={13} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── DEPOSIT HISTORY ── */}
      {tab === "deposit" && (
        <div className="space-y-2.5">
          {deposits.length === 0 ? (
            <EmptyState label="deposits" />
          ) : (
            deposits.map(inv => {
              const cfg = statusConfig[inv.status] || statusConfig.pending;
              return (
                <button
                  key={inv.id}
                  onClick={() => setSelected({ item: inv, type: "deposit" })}
                  className="w-full rounded-xl px-4 py-3.5 flex items-center justify-between text-left transition-all hover:brightness-125 active:scale-[0.99]"
                  style={{
                    ...GLASS,
                    cursor: "pointer",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${TEAL}12`, border: `1px solid ${TEAL}28` }}
                    >
                      <ArrowDownLeft size={16} style={{ color: TEAL }} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold" style={{ color: "rgba(168,237,255,0.85)" }}>
                        Deposit <span className="font-mono text-xs" style={{ color: "rgba(168,237,255,0.35)" }}>#{shortId(inv.id)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs mt-0.5">
                        <cfg.icon size={10} style={{ color: cfg.color }} />
                        <span style={{ color: cfg.color }}>{cfg.label}</span>
                        <span style={{ color: "rgba(168,237,255,0.25)" }}>·</span>
                        <span style={{ color: "rgba(168,237,255,0.35)" }}>{formatDate(inv.createdAt)}</span>
                      </div>
                      {inv.plan && (
                        <div className="text-xs mt-0.5" style={{ color: "rgba(168,237,255,0.25)" }}>
                          {planLabels[inv.plan] ?? inv.plan}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <div className="font-bold text-sm" style={{ color: TEAL }}>+${inv.amount?.toFixed(2)}</div>
                    <div className="text-xs mt-0.5" style={{ color: "rgba(168,237,255,0.28)" }}>Tap for details</div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}

      {/* ── WITHDRAWAL HISTORY ── */}
      {tab === "withdraw" && (
        <div className="space-y-2.5">
          {withdrawList.length === 0 ? (
            <EmptyState label="withdrawals" />
          ) : (
            withdrawList.map(w => {
              const cfg = statusConfig[w.status] || statusConfig.pending;
              return (
                <button
                  key={w.id}
                  onClick={() => setSelected({ item: w, type: "withdraw" })}
                  className="w-full rounded-xl px-4 py-3.5 flex items-center justify-between text-left transition-all hover:brightness-125 active:scale-[0.99]"
                  style={{
                    ...GLASS,
                    cursor: "pointer",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${cfg.color}12`, border: `1px solid ${cfg.color}28` }}
                    >
                      <ArrowUpRight size={16} style={{ color: cfg.color }} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold" style={{ color: "rgba(168,237,255,0.85)" }}>
                        Withdrawal <span className="font-mono text-xs" style={{ color: "rgba(168,237,255,0.35)" }}>#{shortId(w.id)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs mt-0.5">
                        <cfg.icon size={10} style={{ color: cfg.color }} />
                        <span style={{ color: cfg.color }}>{cfg.label}</span>
                        <span style={{ color: "rgba(168,237,255,0.25)" }}>·</span>
                        <span style={{ color: "rgba(168,237,255,0.35)" }}>{formatDate(w.createdAt)}</span>
                      </div>
                      <div
                        className="text-xs mt-0.5 truncate max-w-[160px]"
                        style={{ color: "rgba(168,237,255,0.25)" }}
                      >
                        {w.walletAddress}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <div className="font-bold text-sm" style={{ color: "#f87171" }}>-${w.amount?.toFixed(2)}</div>
                    <div className="text-xs mt-0.5" style={{ color: "rgba(168,237,255,0.28)" }}>Tap for details</div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <DetailModal
          item={selected.item}
          type={selected.type}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
