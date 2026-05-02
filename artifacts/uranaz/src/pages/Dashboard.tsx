import { useGetIncomeSummary, useListInvestments, useGetTeamStats, useGetMyRankProgress } from "@workspace/api-client-react";
import { Link } from "wouter";
import { TrendingUp, Users, DollarSign, Award, ArrowRight, Wallet, Clock, CheckCircle } from "lucide-react";

const TEAL = "#3DD6F5";
const TEAL_DIM = "rgba(61,214,245,0.55)";

function StatCard({ label, value, sub, icon: Icon, accent }: any) {
  return (
    <div
      className="rounded-xl p-4 transition-all duration-200"
      style={{
        background: accent
          ? "linear-gradient(135deg, rgba(61,214,245,0.10), rgba(42,179,215,0.05))"
          : "rgba(5,18,32,0.65)",
        backdropFilter: "blur(12px)",
        border: accent
          ? "1px solid rgba(61,214,245,0.25)"
          : "1px solid rgba(61,214,245,0.10)",
        boxShadow: accent
          ? "0 0 20px rgba(61,214,245,0.08), inset 0 0 0 1px rgba(61,214,245,0.06)"
          : "0 4px 16px rgba(0,0,0,0.3)",
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{
            background: accent ? "rgba(61,214,245,0.12)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${accent ? "rgba(61,214,245,0.2)" : "rgba(255,255,255,0.06)"}`,
          }}
        >
          <Icon size={17} style={{ color: accent ? TEAL : "rgba(168,237,255,0.4)" }} />
        </div>
      </div>
      <div className="text-xl font-bold" style={{ color: "rgba(168,237,255,0.92)" }}>{value}</div>
      <div className="text-xs mt-0.5" style={{ color: "rgba(168,237,255,0.4)" }}>{label}</div>
      {sub && <div className="text-xs mt-1" style={{ color: TEAL_DIM }}>{sub}</div>}
    </div>
  );
}

export default function Dashboard({ user }: { user: any }) {
  const { data: summary, isLoading: loadingSummary } = useGetIncomeSummary();
  const { data: investments, isLoading: loadingInv } = useListInvestments();
  const { data: teamStats } = useGetTeamStats();
  const { data: rankProgress } = useGetMyRankProgress();

  const activeInv = investments?.filter(i => i.status === "active") || [];

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-6 pb-24 md:pb-8">

      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: "rgba(168,237,255,0.6)" }}>Welcome back,</h1>
          <p
            className="text-xl font-bold"
            style={{
              fontFamily: "'Orbitron', sans-serif",
              background: "linear-gradient(135deg, #a8edff, #3DD6F5)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {user?.name}
          </p>
        </div>
      </div>

      {/* Balance Card */}
      <div
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(61,214,245,0.12) 0%, rgba(42,179,215,0.06) 50%, rgba(100,60,200,0.06) 100%)",
          border: "1px solid rgba(61,214,245,0.28)",
          boxShadow: "0 0 40px rgba(61,214,245,0.10), 0 8px 40px rgba(0,0,0,0.4)",
        }}
      >
        {/* Inner glow highlight */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at top right, rgba(61,214,245,0.18) 0%, transparent 65%)",
          }}
        />
        {/* Ring arc decoration */}
        <div
          className="absolute -right-12 -top-12 w-40 h-40 rounded-full pointer-events-none"
          style={{
            border: "1px solid rgba(61,214,245,0.15)",
            boxShadow: "0 0 0 16px rgba(61,214,245,0.04), 0 0 0 32px rgba(61,214,245,0.02)",
          }}
        />
        <div className="relative">
          <div className="text-xs mb-1 tracking-widest uppercase" style={{ color: "rgba(168,237,255,0.5)" }}>
            Available Balance
          </div>
          <div
            className="text-4xl font-black mb-4"
            data-testid="text-balance"
            style={{
              fontFamily: "'Orbitron', sans-serif",
              background: "linear-gradient(135deg, #a8edff, #3DD6F5, #2AB3CF)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              textShadow: "none",
            }}
          >
            ${loadingSummary ? "—" : (summary?.availableBalance ?? 0).toFixed(2)}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Total Earnings", value: summary?.totalEarnings, testId: "text-total-earnings" },
              { label: "Total Withdrawn", value: summary?.withdrawnTotal },
            ].map(item => (
              <div
                key={item.label}
                className="rounded-xl p-3"
                style={{
                  background: "rgba(0,10,20,0.4)",
                  border: "1px solid rgba(61,214,245,0.10)",
                }}
              >
                <div className="text-xs" style={{ color: "rgba(168,237,255,0.4)" }}>{item.label}</div>
                <div
                  className="font-bold text-sm mt-0.5"
                  data-testid={item.testId}
                  style={{ color: "rgba(168,237,255,0.85)" }}
                >
                  ${item.value?.toFixed(2) ?? "—"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total Invested"  value={`$${user?.totalInvested?.toFixed(2) || "0.00"}`} icon={Wallet} accent />
        <StatCard
          label="Daily Return"
          icon={DollarSign}
          value={activeInv.length > 0
            ? `$${(activeInv.reduce((s, i) => s + i.amount * i.dailyRate, 0)).toFixed(2)}`
            : "$0.00"}
          sub="Today's estimate"
        />
        <StatCard label="Team Members"  value={teamStats?.totalMembers ?? "—"} icon={Users} />
        <StatCard label="Current Level" value={`L${user?.currentLevel ?? 0}`}  icon={Award} accent />
      </div>

      {/* Active Investments */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm tracking-wide" style={{ color: "rgba(168,237,255,0.8)" }}>
            Active Investments
          </h2>
          <Link href="/invest" className="text-xs flex items-center gap-1" style={{ color: TEAL }}>
            View all <ArrowRight size={12} />
          </Link>
        </div>

        {loadingInv ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div
                key={i}
                className="rounded-xl h-20 animate-pulse"
                style={{ background: "rgba(61,214,245,0.04)", border: "1px solid rgba(61,214,245,0.08)" }}
              />
            ))}
          </div>
        ) : activeInv.length === 0 ? (
          <div
            className="rounded-xl p-6 text-center"
            style={{
              background: "rgba(5,18,32,0.65)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(61,214,245,0.10)",
            }}
          >
            <TrendingUp size={32} className="mx-auto mb-2" style={{ color: "rgba(168,237,255,0.25)" }} />
            <p className="text-sm" style={{ color: "rgba(168,237,255,0.4)" }}>No active investments yet</p>
            <Link href="/invest">
              <button
                className="mt-3 px-4 py-2 rounded-lg text-sm font-semibold"
                style={{
                  background: "linear-gradient(135deg, #3DD6F5, #2AB3CF)",
                  color: "#010810",
                }}
              >
                Make your first investment
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {activeInv.slice(0, 3).map(inv => (
              <div
                key={inv.id}
                data-testid={`card-investment-${inv.id}`}
                className="rounded-xl p-4 transition-all"
                style={{
                  background: "rgba(5,18,32,0.65)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(61,214,245,0.12)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{
                        background: "rgba(61,214,245,0.10)",
                        border: "1px solid rgba(61,214,245,0.18)",
                      }}
                    >
                      <TrendingUp size={15} style={{ color: TEAL }} />
                    </div>
                    <div>
                      <div className="font-semibold text-sm" style={{ color: "rgba(168,237,255,0.85)" }}>
                        ${inv.amount.toFixed(2)}
                      </div>
                      <div className="text-xs capitalize" style={{ color: "rgba(168,237,255,0.35)" }}>
                        {inv.planTier.replace("tier", "Tier ")}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm" style={{ color: TEAL }}>
                      +{(inv.dailyRate * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs" style={{ color: "rgba(168,237,255,0.35)" }}>daily</div>
                  </div>
                </div>
                {/* Progress bar */}
                <div
                  className="w-full rounded-full h-1.5"
                  style={{ background: "rgba(61,214,245,0.08)" }}
                >
                  <div
                    className="h-1.5 rounded-full uranus-progress"
                    style={{
                      width: `${Math.max(5, ((inv.durationDays - inv.remainingDays) / inv.durationDays) * 100)}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs mt-1.5" style={{ color: "rgba(168,237,255,0.35)" }}>
                  <span>{inv.durationDays - inv.remainingDays} days done</span>
                  <span>{inv.remainingDays} days left</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Income Breakdown */}
      {summary && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm tracking-wide" style={{ color: "rgba(168,237,255,0.8)" }}>
              Income Breakdown
            </h2>
            <Link href="/income" className="text-xs flex items-center gap-1" style={{ color: TEAL }}>
              Details <ArrowRight size={12} />
            </Link>
          </div>
          <div
            className="rounded-xl overflow-hidden"
            style={{
              background: "rgba(5,18,32,0.65)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(61,214,245,0.10)",
            }}
          >
            {[
              { label: "Daily Returns",     value: summary.dailyReturnTotal },
              { label: "Spot Referral",     value: summary.spotReferralTotal },
              { label: "Level Commission",  value: summary.levelCommissionTotal },
              { label: "Rank Bonuses",      value: summary.rankBonusTotal },
            ].map((item, idx) => (
              <div
                key={item.label}
                className="flex items-center justify-between px-4 py-3"
                style={{
                  borderTop: idx > 0 ? "1px solid rgba(61,214,245,0.07)" : "none",
                }}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle size={13} style={{ color: TEAL }} />
                  <span className="text-sm" style={{ color: "rgba(168,237,255,0.7)" }}>{item.label}</span>
                </div>
                <span className="font-semibold text-sm" style={{ color: "rgba(168,237,255,0.85)" }}>
                  ${item.value.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rank Progress */}
      {rankProgress?.nextRank && (
        <div
          className="rounded-2xl overflow-hidden relative"
          style={{
            background: "linear-gradient(155deg, rgba(4,16,32,0.95) 0%, rgba(2,10,22,0.95) 100%)",
            border: "1px solid rgba(61,214,245,0.16)",
            boxShadow: "0 0 40px rgba(61,214,245,0.06)",
          }}
        >
          {/* Top accent line */}
          <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, transparent, #3DD6F5, transparent)" }} />

          {/* Ambient glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at top right, rgba(61,214,245,0.07) 0%, transparent 65%)" }}
          />

          <div className="relative p-5">
            {/* Header row */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(61,214,245,0.12)", border: "1px solid rgba(61,214,245,0.22)" }}
                >
                  <Award size={15} style={{ color: TEAL }} />
                </div>
                <span
                  className="font-bold text-xs tracking-widest uppercase"
                  style={{ color: "rgba(168,237,255,0.55)", fontFamily: "'Orbitron', sans-serif" }}
                >
                  Rank Progress
                </span>
              </div>
              <Link href="/ranks">
                <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: TEAL }}>
                  Details <ArrowRight size={11} />
                </span>
              </Link>
            </div>

            {/* Current → Next rank journey */}
            <div className="flex items-center gap-3 mb-4">
              {/* Current rank */}
              <div className="flex-1 rounded-xl p-3 text-center"
                style={{ background: "rgba(0,10,24,0.6)", border: "1px solid rgba(61,214,245,0.08)" }}>
                <div className="text-xs mb-1" style={{ color: "rgba(168,237,255,0.32)" }}>Current</div>
                <div className="font-bold text-sm" style={{ color: "rgba(168,237,255,0.7)" }}>
                  {rankProgress.currentRank?.name ?? "Unranked"}
                </div>
              </div>

              {/* Arrow */}
              <div className="flex flex-col items-center gap-0.5 shrink-0">
                <ArrowRight size={16} style={{ color: "rgba(61,214,245,0.4)" }} />
              </div>

              {/* Next rank */}
              <div className="flex-1 rounded-xl p-3 text-center"
                style={{
                  background: "linear-gradient(135deg, rgba(61,214,245,0.10), rgba(42,179,215,0.05))",
                  border: "1px solid rgba(61,214,245,0.22)",
                  boxShadow: "0 0 16px rgba(61,214,245,0.06)",
                }}>
                <div className="text-xs mb-1" style={{ color: "rgba(168,237,255,0.38)" }}>Next Rank</div>
                <div className="font-bold text-sm" style={{ color: TEAL }}>
                  {rankProgress.nextRank.name}
                </div>
              </div>
            </div>

            {/* Reward banner */}
            <div
              className="flex items-center gap-2.5 rounded-xl px-4 py-3 mb-4"
              style={{ background: "rgba(61,214,245,0.05)", border: "1px solid rgba(61,214,245,0.12)" }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "rgba(61,214,245,0.12)", border: "1px solid rgba(61,214,245,0.2)" }}
              >
                <Award size={13} style={{ color: TEAL }} />
              </div>
              <div className="min-w-0">
                <div className="text-xs" style={{ color: "rgba(168,237,255,0.38)" }}>Reward upon achieving</div>
                <div className="font-bold text-sm truncate" style={{ color: TEAL }}>
                  {rankProgress.nextRank.reward}
                </div>
              </div>
            </div>

            {/* Criteria */}
            {rankProgress.nextRank.criteria && (
              <div className="text-xs mb-4 leading-relaxed" style={{ color: "rgba(168,237,255,0.38)" }}>
                {rankProgress.nextRank.criteria}
              </div>
            )}

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { label: "Levels Done",    value: rankProgress.levelsCompleted         ?? 0 },
                { label: "Ranked Refs",    value: rankProgress.qualifyingReferrersCount ?? 0 },
              ].map(s => (
                <div key={s.label} className="rounded-xl p-3 text-center"
                  style={{ background: "rgba(0,10,24,0.55)", border: "1px solid rgba(61,214,245,0.07)" }}>
                  <div
                    className="font-black text-lg"
                    style={{ color: "rgba(168,237,255,0.85)", fontFamily: "'Orbitron', sans-serif" }}
                  >
                    {s.value}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "rgba(168,237,255,0.32)" }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <Link href="/ranks">
              <button
                className="w-full py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: "linear-gradient(135deg, #3DD6F5, #2AB3CF)",
                  color: "#010810",
                  letterSpacing: "0.03em",
                  boxShadow: "0 0 20px rgba(61,214,245,0.25)",
                }}
              >
                View Full Rank Journey
              </button>
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}
