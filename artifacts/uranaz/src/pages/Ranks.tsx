import { useListRanks, useGetMyRankProgress } from "@workspace/api-client-react";
import { Award, Gift, CheckCircle } from "lucide-react";

const TEAL = "#3DD6F5";
const GLASS = { background: "rgba(5,18,32,0.65)", backdropFilter: "blur(14px)", border: "1px solid rgba(61,214,245,0.10)" } as const;

const rankGradients = [
  { from: "#b45309", to: "#d97706" }, // Bronze
  { from: "#6b7280", to: "#9ca3af" }, // Silver
  { from: "#d97706", to: "#fbbf24" }, // Gold
  { from: "#7c3aed", to: "#a78bfa" }, // Platinum
  { from: "#0891b2", to: "#3DD6F5" }, // Diamond
];

export default function Ranks({ user }: { user: any }) {
  const { data: ranks, isLoading: loadingRanks } = useListRanks();
  const { data: progress } = useGetMyRankProgress();

  const currentRankNumber = progress?.currentRank?.rankNumber ?? 0;

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-6 pb-24 md:pb-8">
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
        Rank System
      </h1>

      {/* Current Status hero */}
      <div
        className="rounded-2xl p-5 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(61,214,245,0.12), rgba(100,60,200,0.06))",
          border: "1px solid rgba(61,214,245,0.28)",
        }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at top right, rgba(61,214,245,0.16) 0%, transparent 60%)" }} />
        <div className="relative">
          <div className="text-xs tracking-widest uppercase mb-1" style={{ color: "rgba(168,237,255,0.45)" }}>Your Current Rank</div>
          <div
            className="text-2xl font-black mb-1"
            data-testid="text-current-rank"
            style={{ fontFamily: "'Orbitron', sans-serif", color: "rgba(168,237,255,0.92)" }}
          >
            {progress?.currentRank?.name ?? "Unranked"}
          </div>
          {progress?.nextRank && (
            <>
              <div className="text-sm mb-2" style={{ color: "rgba(168,237,255,0.45)" }}>
                Next: <span style={{ color: "rgba(168,237,255,0.85)", fontWeight: 600 }}>{progress.nextRank.name}</span>
                {" "}— <span style={{ color: TEAL }}>{progress.nextRank.reward}</span>
              </div>
              <div className="text-xs mb-3" style={{ color: "rgba(168,237,255,0.35)" }}>{progress.nextRank.criteria}</div>
            </>
          )}
          <div className="grid grid-cols-3 gap-2 mt-3">
            {[
              { label: "Levels Done", value: progress?.levelsCompleted ?? 0 },
              { label: "Ranked Refs", value: progress?.qualifyingReferrersCount ?? 0 },
              { label: "Rank Level",  value: currentRankNumber },
            ].map(item => (
              <div
                key={item.label}
                className="rounded-lg p-2.5 text-center"
                style={{ background: "rgba(0,10,24,0.45)", border: "1px solid rgba(61,214,245,0.08)" }}
              >
                <div className="font-bold" style={{ color: TEAL }}>{item.value}</div>
                <div className="text-xs" style={{ color: "rgba(168,237,255,0.35)" }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leg progress */}
      {progress?.lugsProgress && progress.lugsProgress.length > 0 && (
        <div className="rounded-xl p-5" style={GLASS}>
          <h2 className="font-semibold text-sm mb-3" style={{ color: "rgba(168,237,255,0.75)" }}>Leg Business Progress</h2>
          <div className="space-y-3">
            {progress.lugsProgress.map(leg => {
              const pct = leg.required > 0 ? Math.min(100, (leg.business / leg.required) * 100) : 0;
              return (
                <div key={leg.lugIndex}>
                  <div className="flex justify-between text-xs mb-1.5" style={{ color: "rgba(168,237,255,0.4)" }}>
                    <span>Leg {leg.lugIndex}</span>
                    <span>${leg.business.toFixed(0)} / ${leg.required.toLocaleString()}</span>
                  </div>
                  <div className="w-full rounded-full h-2" style={{ background: "rgba(61,214,245,0.08)" }}>
                    <div className="h-2 rounded-full uranus-progress transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rank cards */}
      {loadingRanks ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="rounded-xl h-28 animate-pulse" style={{ background: "rgba(61,214,245,0.04)", border: "1px solid rgba(61,214,245,0.08)" }} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {ranks?.map((rank, idx) => {
            const isAchieved = rank.rankNumber <= currentRankNumber;
            const isCurrent = rank.rankNumber === currentRankNumber + 1;
            const grad = rankGradients[idx] || rankGradients[0];
            return (
              <div
                key={rank.id}
                data-testid={`card-rank-${rank.rankNumber}`}
                className="rounded-2xl p-5 transition-all"
                style={{
                  background: isCurrent
                    ? "linear-gradient(135deg, rgba(61,214,245,0.10), rgba(42,179,215,0.05))"
                    : "rgba(5,18,32,0.65)",
                  backdropFilter: "blur(14px)",
                  border: isCurrent
                    ? "1px solid rgba(61,214,245,0.35)"
                    : isAchieved
                    ? "1px solid rgba(52,211,153,0.25)"
                    : "1px solid rgba(61,214,245,0.08)",
                  boxShadow: isCurrent ? "0 0 24px rgba(61,214,245,0.10)" : "none",
                }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${grad.from}, ${grad.to})`,
                      boxShadow: `0 0 16px ${grad.to}40`,
                    }}
                  >
                    {rank.rankNumber}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold" style={{ color: "rgba(168,237,255,0.9)" }}>{rank.name}</span>
                      {isAchieved && <CheckCircle size={14} style={{ color: "#34d399" }} />}
                      {isCurrent && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{
                            background: "rgba(61,214,245,0.10)",
                            border: "1px solid rgba(61,214,245,0.2)",
                            color: TEAL,
                          }}
                        >
                          Next Goal
                        </span>
                      )}
                    </div>
                    <div className="text-sm mt-1" style={{ color: "rgba(168,237,255,0.4)" }}>{rank.criteria}</div>
                    <div
                      className="mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                      style={{
                        background: "rgba(61,214,245,0.08)",
                        border: "1px solid rgba(61,214,245,0.18)",
                        color: TEAL,
                      }}
                    >
                      <Gift size={11} /> {rank.reward}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Singapore Launch Offer */}
      <div
        className="rounded-2xl p-5 text-center relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(61,214,245,0.10), rgba(100,60,200,0.08))",
          border: "1px solid rgba(61,214,245,0.22)",
        }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(61,214,245,0.06) 0%, transparent 70%)" }} />
        <div className="relative">
          <div className="text-3xl mb-2">✈️</div>
          <h3 className="font-bold mb-1" style={{ color: "rgba(168,237,255,0.9)" }}>Launch Offer — Singapore Trip</h3>
          <p className="text-sm mb-4" style={{ color: "rgba(168,237,255,0.4)" }}>3-Day 5-Star Package for qualifying investors</p>
          <div className="grid grid-cols-3 gap-2 text-sm">
            {[
              { label: "Self Invest",   value: "$500+" },
              { label: "Team Business", value: "$25K" },
              { label: "3 Legs",        value: "10k+10k+5k" },
            ].map(item => (
              <div
                key={item.label}
                className="rounded-lg p-2.5"
                style={{ background: "rgba(0,10,24,0.5)", border: "1px solid rgba(61,214,245,0.10)" }}
              >
                <div className="font-bold" style={{ color: TEAL }}>{item.value}</div>
                <div className="text-xs" style={{ color: "rgba(168,237,255,0.35)" }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
