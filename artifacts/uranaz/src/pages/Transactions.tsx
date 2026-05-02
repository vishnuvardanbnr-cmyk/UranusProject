import { useState } from "react";
import {
  useListIncome,
  useGetIncomeSummary,
  getListIncomeQueryKey,
} from "@workspace/api-client-react";
import {
  DollarSign,
  TrendingUp,
  Users,
  Award,
  X,
  Hash,
  Calendar,
  ArrowDownLeft,
  Tag,
  Receipt,
} from "lucide-react";

const TEAL = "#3DD6F5";
const GLASS = {
  background: "rgba(5,18,32,0.65)",
  backdropFilter: "blur(14px)",
  border: "1px solid rgba(61,214,245,0.10)",
} as const;

const typeFilters = [
  { value: "",                 label: "All"        },
  { value: "daily_return",     label: "Daily"      },
  { value: "spot_referral",    label: "Referral"   },
  { value: "level_commission", label: "Commission" },
  { value: "rank_bonus",       label: "Rank Bonus" },
];

const typeConfig: Record<string, { icon: any; color: string; label: string }> = {
  daily_return:     { icon: TrendingUp, color: "#34d399", label: "Daily Return"      },
  spot_referral:    { icon: Users,      color: "#60a5fa", label: "Spot Referral"     },
  level_commission: { icon: DollarSign, color: "#c084fc", label: "Level Commission"  },
  rank_bonus:       { icon: Award,      color: TEAL,      label: "Rank Bonus"        },
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

/* ─────────────────────────────────────────
   DETAIL MODAL
───────────────────────────────────────── */
function TxDetailModal({ record, onClose }: { record: any; onClose: () => void }) {
  const cfg = typeConfig[record.type] || { icon: DollarSign, color: TEAL, label: record.type };

  const rows = [
    { icon: Hash,          label: "Transaction ID", value: `#${shortId(record.id)}`,         mono: true  },
    { icon: Tag,           label: "Type",           value: cfg.label,                        mono: false },
    { icon: Calendar,      label: "Date & Time",    value: formatDate(record.createdAt, true), mono: false },
    { icon: DollarSign,    label: "Amount",         value: `+$${record.amount.toFixed(2)}`,  mono: false },
    ...(record.description
      ? [{ icon: Receipt, label: "Description", value: record.description, mono: false }]
      : []),
    ...(record.fromUserName
      ? [{ icon: Users, label: "From", value: record.fromUserName, mono: false }]
      : []),
  ];

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
          style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}, transparent)` }}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${cfg.color}20, ${cfg.color}08)`,
                border: `1px solid ${cfg.color}30`,
                boxShadow: `0 0 16px ${cfg.color}15`,
              }}
            >
              <cfg.icon size={17} style={{ color: cfg.color }} />
            </div>
            <div>
              <div
                className="font-bold tracking-wide"
                style={{ color: "rgba(200,240,255,0.92)", fontFamily: "'Orbitron', sans-serif", fontSize: "0.78rem" }}
              >
                Transaction Details
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
            background: `linear-gradient(135deg, ${cfg.color}10, ${cfg.color}04)`,
            border: `1px solid ${cfg.color}20`,
          }}
        >
          <div className="text-xs mb-2 uppercase tracking-widest" style={{ color: "rgba(168,237,255,0.35)" }}>
            Amount Received
          </div>
          <div
            className="font-black"
            style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: "1.75rem",
              color: cfg.color,
              letterSpacing: "-0.01em",
              textShadow: `0 0 24px ${cfg.color}50`,
            }}
          >
            +${record.amount.toFixed(2)}
          </div>
        </div>

        {/* Divider */}
        <div className="mx-5 mb-4 h-px" style={{ background: "rgba(61,214,245,0.07)" }} />

        {/* Detail rows */}
        <div className="px-5 pb-6 space-y-0">
          {rows.map((row, i) => (
            <div
              key={row.label}
              className="flex items-center justify-between py-3"
              style={{ borderBottom: i < rows.length - 1 ? "1px solid rgba(61,214,245,0.05)" : "none" }}
            >
              <div className="flex items-center gap-2.5">
                <row.icon size={12} style={{ color: "rgba(168,237,255,0.28)" }} />
                <span className="text-xs" style={{ color: "rgba(168,237,255,0.42)" }}>{row.label}</span>
              </div>
              <span
                className="text-xs font-semibold text-right max-w-[55%] break-all leading-relaxed"
                style={{
                  color: row.label === "Amount"         ? cfg.color
                       : row.label === "Transaction ID" ? "rgba(168,237,255,0.55)"
                       : "rgba(200,240,255,0.85)",
                  fontFamily: row.mono ? "monospace" : "inherit",
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

/* ─────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────── */
export default function Transactions() {
  const [typeFilter, setTypeFilter] = useState("");
  const [selected, setSelected]     = useState<any>(null);

  const { data: summary, isLoading: sumLoading } = useGetIncomeSummary();
  const { data: incomeData, isLoading } = useListIncome(
    typeFilter
      ? { type: typeFilter as any, page: 1, limit: 100 }
      : { page: 1, limit: 100 },
    { query: { queryKey: getListIncomeQueryKey(typeFilter ? { type: typeFilter as any, page: 1, limit: 100 } : { page: 1, limit: 100 }) } }
  );

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
        Transactions
      </h1>

      {/* Hero total */}
      <div
        className="rounded-2xl p-5 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(61,214,245,0.12), rgba(42,179,215,0.06), rgba(100,60,200,0.05))",
          border: "1px solid rgba(61,214,245,0.28)",
          boxShadow: "0 0 40px rgba(61,214,245,0.08)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at top right, rgba(61,214,245,0.16) 0%, transparent 60%)" }}
        />
        <div className="relative">
          <div className="text-xs tracking-widest uppercase mb-1" style={{ color: "rgba(168,237,255,0.45)" }}>
            Total Earnings
          </div>
          <div
            className="text-4xl font-black"
            style={{
              fontFamily: "'Orbitron', sans-serif",
              background: "linear-gradient(135deg, #a8edff, #3DD6F5)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            ${sumLoading ? "—" : (summary?.totalEarnings ?? 0).toFixed(2)}
          </div>
          <div className="flex gap-4 mt-2 text-xs" style={{ color: "rgba(168,237,255,0.4)" }}>
            <span>Available: <strong style={{ color: "rgba(168,237,255,0.8)" }}>${summary?.availableBalance?.toFixed(2) ?? "—"}</strong></span>
            <span>Withdrawn: <strong style={{ color: "rgba(168,237,255,0.8)" }}>${summary?.withdrawnTotal?.toFixed(2) ?? "—"}</strong></span>
          </div>
        </div>
      </div>

      {/* Breakdown mini-cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Daily Returns",    value: summary?.dailyReturnTotal,     icon: TrendingUp, color: "#34d399" },
          { label: "Spot Referral",    value: summary?.spotReferralTotal,    icon: Users,      color: "#60a5fa" },
          { label: "Level Commission", value: summary?.levelCommissionTotal, icon: DollarSign, color: "#c084fc" },
          { label: "Rank Bonus",       value: summary?.rankBonusTotal,       icon: Award,      color: TEAL     },
        ].map(item => (
          <div key={item.label} className="rounded-xl p-3.5" style={GLASS}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <item.icon size={12} style={{ color: item.color }} />
              <span className="text-xs" style={{ color: "rgba(168,237,255,0.38)" }}>{item.label}</span>
            </div>
            <div className="font-bold text-sm" style={{ color: "rgba(168,237,255,0.85)" }}>
              ${item.value?.toFixed(2) ?? "0.00"}
            </div>
          </div>
        ))}
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {typeFilters.map(f => {
          const active = typeFilter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value)}
              className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                background: active ? "linear-gradient(135deg, #3DD6F5, #2AB3CF)" : "rgba(5,18,32,0.65)",
                color:      active ? "#010810" : "rgba(168,237,255,0.45)",
                border:     active ? "none" : "1px solid rgba(61,214,245,0.12)",
                boxShadow:  active ? "0 0 10px rgba(61,214,245,0.25)" : "none",
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2.5">
          {[1,2,3,4,5].map(i => (
            <div
              key={i}
              className="rounded-xl h-[68px] animate-pulse"
              style={{ background: "rgba(61,214,245,0.04)", border: "1px solid rgba(61,214,245,0.07)" }}
            />
          ))}
        </div>
      ) : !incomeData?.records?.length ? (
        <div className="rounded-xl p-12 text-center" style={GLASS}>
          <ArrowDownLeft size={36} className="mx-auto mb-3" style={{ color: "rgba(168,237,255,0.15)" }} />
          <p className="text-sm" style={{ color: "rgba(168,237,255,0.3)" }}>No transactions yet</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {incomeData.records.map(record => {
            const cfg = typeConfig[record.type] || { icon: DollarSign, color: TEAL, label: record.type };
            return (
              <button
                key={record.id}
                onClick={() => setSelected(record)}
                className="w-full rounded-xl px-4 py-3.5 flex items-center justify-between text-left transition-all hover:brightness-125 active:scale-[0.99]"
                style={{ ...GLASS, cursor: "pointer" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${cfg.color}12`, border: `1px solid ${cfg.color}28` }}
                  >
                    <cfg.icon size={15} style={{ color: cfg.color }} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: "rgba(168,237,255,0.85)" }}>
                      {record.description}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs mt-0.5">
                      <div
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: cfg.color }}
                      />
                      <span style={{ color: cfg.color }}>{cfg.label}</span>
                      <span style={{ color: "rgba(168,237,255,0.22)" }}>·</span>
                      <span style={{ color: "rgba(168,237,255,0.32)" }}>{formatDate(record.createdAt)}</span>
                    </div>
                    {record.fromUserName && (
                      <div className="text-xs mt-0.5" style={{ color: "rgba(168,237,255,0.28)" }}>
                        From: {record.fromUserName}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <div className="font-bold text-sm" style={{ color: cfg.color }}>
                    +${record.amount.toFixed(2)}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "rgba(168,237,255,0.25)" }}>Tap for details</div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <TxDetailModal record={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
