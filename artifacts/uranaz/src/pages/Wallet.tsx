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

  const rows =
    type === "deposit"
      ? [
          { icon: Hash,        label: "Transaction ID",   value: `#${shortId(item.id)}` },
          { icon: Calendar,    label: "Date",             value: formatDate(item.createdAt, true) },
          { icon: DollarSign,  label: "Total Amount",     value: `$${item.amount?.toFixed(2)}` },
          { icon: DollarSign,  label: "USDT",             value: `$${item.usdtAmount?.toFixed(2) ?? "—"}` },
          { icon: DollarSign,  label: "HYPERCOIN",        value: `$${item.hyperCoinAmount?.toFixed(2) ?? "—"}` },
          { icon: Percent,     label: "Plan",             value: planLabels[item.plan] ?? item.plan ?? "—" },
          { icon: TrendingUp,  label: "Expected Return",  value: item.expectedReturn ? `$${item.expectedReturn.toFixed(2)}` : "—" },
          { icon: Timer,       label: "Duration",         value: item.durationDays ? `${item.durationDays} days` : "—" },
          { icon: Calendar,    label: "Maturity Date",    value: item.maturityDate ? formatDate(item.maturityDate) : "—" },
        ]
      : [
          { icon: Hash,        label: "Transaction ID",   value: `#${shortId(item.id)}` },
          { icon: Calendar,    label: "Requested",        value: formatDate(item.createdAt, true) },
          { icon: DollarSign,  label: "Amount",           value: `$${item.amount?.toFixed(2)}` },
          { icon: MapPin,      label: "Wallet Address",   value: item.walletAddress ?? "—" },
          { icon: Calendar,    label: "Processed",        value: item.processedAt ? formatDate(item.processedAt, true) : "Awaiting" },
          ...(item.rejectionReason
            ? [{ icon: AlertCircle, label: "Reason", value: item.rejectionReason }]
            : []),
        ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(1,8,16,0.85)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-5 space-y-4"
        style={{
          background: "rgba(3,14,28,0.97)",
          border: "1px solid rgba(61,214,245,0.18)",
          boxShadow: "0 0 60px rgba(61,214,245,0.12)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: `${cfg.color}18`, border: `1px solid ${cfg.color}33` }}
            >
              {type === "deposit"
                ? <ArrowDownLeft size={16} style={{ color: cfg.color }} />
                : <ArrowUpRight  size={16} style={{ color: cfg.color }} />}
            </div>
            <div>
              <div className="font-bold text-sm" style={{ color: "rgba(168,237,255,0.9)" }}>
                {type === "deposit" ? "Deposit Details" : "Withdrawal Details"}
              </div>
              <div className="flex items-center gap-1 text-xs mt-0.5">
                <cfg.icon size={10} style={{ color: cfg.color }} />
                <span style={{ color: cfg.color }}>{cfg.label}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(168,237,255,0.05)", border: "1px solid rgba(168,237,255,0.1)" }}
          >
            <X size={14} style={{ color: "rgba(168,237,255,0.5)" }} />
          </button>
        </div>

        {/* Amount highlight */}
        <div
          className="rounded-xl py-4 text-center"
          style={{
            background: type === "deposit"
              ? "linear-gradient(135deg, rgba(61,214,245,0.08), rgba(42,179,215,0.04))"
              : "linear-gradient(135deg, rgba(248,113,113,0.08), rgba(220,80,80,0.04))",
            border: `1px solid ${type === "deposit" ? "rgba(61,214,245,0.15)" : "rgba(248,113,113,0.15)"}`,
          }}
        >
          <div className="text-xs mb-1" style={{ color: "rgba(168,237,255,0.4)" }}>
            {type === "deposit" ? "Deposited" : "Withdrawn"}
          </div>
          <div
            className="text-2xl font-black"
            style={{
              fontFamily: "'Orbitron', sans-serif",
              color: type === "deposit" ? TEAL : "#f87171",
            }}
          >
            {type === "deposit" ? "+" : "-"}${item.amount?.toFixed(2)}
          </div>
        </div>

        {/* Detail rows */}
        <div className="space-y-2">
          {rows.map(row => (
            <div
              key={row.label}
              className="flex items-start gap-3 rounded-xl px-3.5 py-2.5"
              style={{ background: "rgba(0,10,24,0.5)", border: "1px solid rgba(61,214,245,0.06)" }}
            >
              <row.icon size={13} className="mt-0.5 shrink-0" style={{ color: "rgba(168,237,255,0.3)" }} />
              <div className="flex-1 min-w-0">
                <div className="text-xs" style={{ color: "rgba(168,237,255,0.35)" }}>{row.label}</div>
                <div
                  className="text-sm font-medium break-all mt-0.5"
                  style={{ color: "rgba(168,237,255,0.8)" }}
                >
                  {row.value}
                </div>
              </div>
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
