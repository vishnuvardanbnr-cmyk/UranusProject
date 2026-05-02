import { useListRanks, useGetMyRankProgress } from "@workspace/api-client-react";
import { Award, Gift, CheckCircle, ChevronRight } from "lucide-react";

const rankColors = ["from-amber-600 to-amber-500", "from-gray-400 to-gray-300", "from-yellow-500 to-amber-400", "from-purple-500 to-purple-400", "from-blue-500 to-cyan-400"];

export default function Ranks({ user }: { user: any }) {
  const { data: ranks, isLoading: loadingRanks } = useListRanks();
  const { data: progress, isLoading: loadingProgress } = useGetMyRankProgress();

  const currentRankNumber = progress?.currentRank?.rankNumber ?? 0;

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-6 pb-24 md:pb-6">
      <h1 className="text-xl font-bold">Rank System</h1>

      {/* Current Status */}
      <div className="bg-gradient-to-br from-primary/15 to-amber-700/5 border border-primary/30 rounded-2xl p-5">
        <div className="text-xs text-muted-foreground mb-1">Your Current Rank</div>
        <div className="text-2xl font-bold mb-1" data-testid="text-current-rank">
          {progress?.currentRank?.name ?? "Unranked"}
        </div>
        {progress?.nextRank && (
          <>
            <div className="text-sm text-muted-foreground mb-3">Next: <span className="text-foreground font-semibold">{progress.nextRank.name}</span> — {progress.nextRank.reward}</div>
            <div className="text-xs text-muted-foreground mb-1">{progress.nextRank.criteria}</div>
          </>
        )}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="bg-background/50 rounded-lg p-2.5 text-center">
            <div className="text-primary font-bold">{progress?.levelsCompleted ?? 0}</div>
            <div className="text-xs text-muted-foreground">Levels Done</div>
          </div>
          <div className="bg-background/50 rounded-lg p-2.5 text-center">
            <div className="text-primary font-bold">{progress?.qualifyingReferrersCount ?? 0}</div>
            <div className="text-xs text-muted-foreground">Ranked Refs</div>
          </div>
          <div className="bg-background/50 rounded-lg p-2.5 text-center">
            <div className="text-primary font-bold">{currentRankNumber}</div>
            <div className="text-xs text-muted-foreground">Rank Level</div>
          </div>
        </div>
      </div>

      {/* Legs Progress for ranks 2+ */}
      {progress?.lugsProgress && progress.lugsProgress.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold text-sm mb-3">Leg Business Progress</h2>
          <div className="space-y-3">
            {progress.lugsProgress.map(leg => {
              const pct = leg.required > 0 ? Math.min(100, (leg.business / leg.required) * 100) : 0;
              return (
                <div key={leg.lugIndex}>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                    <span>Leg {leg.lugIndex}</span>
                    <span>${leg.business.toFixed(0)} / ${leg.required.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-background rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rank Cards */}
      {loadingRanks ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <div key={i} className="bg-card border border-border rounded-xl h-28 animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {ranks?.map((rank, idx) => {
            const isAchieved = rank.rankNumber <= currentRankNumber;
            const isCurrent = rank.rankNumber === currentRankNumber + 1;
            return (
              <div
                key={rank.id}
                data-testid={`card-rank-${rank.rankNumber}`}
                className={`bg-card border rounded-2xl p-5 transition-all ${
                  isCurrent ? "border-primary gold-glow" : isAchieved ? "border-emerald-500/30" : "border-border"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${rankColors[idx] || rankColors[0]} flex items-center justify-center text-white font-bold text-lg shrink-0`}>
                    {rank.rankNumber}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{rank.name}</span>
                      {isAchieved && <CheckCircle size={14} className="text-emerald-400" />}
                      {isCurrent && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Next Goal</span>}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">{rank.criteria}</div>
                    <div className="mt-2 inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-full px-3 py-1 text-primary text-xs font-semibold">
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
      <div className="bg-gradient-to-br from-primary/15 to-amber-700/5 border border-primary/30 rounded-2xl p-5 text-center">
        <div className="text-2xl mb-2">✈</div>
        <h3 className="font-bold mb-1">Launch Offer — Singapore Trip</h3>
        <p className="text-sm text-muted-foreground mb-3">3-Day 5-Star Package for qualifying investors</p>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="bg-background/50 rounded-lg p-2">
            <div className="font-bold text-primary">$500+</div>
            <div className="text-xs text-muted-foreground">Self Invest</div>
          </div>
          <div className="bg-background/50 rounded-lg p-2">
            <div className="font-bold text-primary">$25K</div>
            <div className="text-xs text-muted-foreground">Team Business</div>
          </div>
          <div className="bg-background/50 rounded-lg p-2">
            <div className="font-bold text-primary">3 Legs</div>
            <div className="text-xs text-muted-foreground">10k+10k+5k</div>
          </div>
        </div>
      </div>
    </div>
  );
}
