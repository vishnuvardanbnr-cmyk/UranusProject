import { useListAdminInvestments } from "@workspace/api-client-react";
import { TrendingUp } from "lucide-react";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminInvestments() {
  const { data, isLoading } = useListAdminInvestments();
  const investments = data?.investments ?? [];

  const totalInvested = investments.reduce((s, i) => s + i.amount, 0);
  const activeCount = investments.filter(i => i.status === "active").length;

  return (
    <div className="px-4 py-6 max-w-4xl mx-auto space-y-5 pb-24 md:pb-6">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold">All Investments</h1>
        <span className="bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full font-semibold">{data?.total ?? 0}</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <div className="font-bold text-primary">${totalInvested.toFixed(0)}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Total Invested</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <div className="font-bold text-emerald-400">{activeCount}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Active</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <div className="font-bold text-muted-foreground">{investments.length - activeCount}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Completed</div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="bg-card border border-border rounded-xl h-24 animate-pulse" />)}
        </div>
      ) : !investments.length ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <TrendingUp size={32} className="text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No investments yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {investments.map(inv => (
            <div key={inv.id} data-testid={`row-investment-${inv.id}`} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-semibold text-sm">User #{inv.userId}</div>
                  <div className="text-xs text-muted-foreground capitalize">{inv.planTier.replace("tier", "Tier ")}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-primary">${inv.amount.toFixed(2)}</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    inv.status === "active" ? "bg-emerald-400/10 text-emerald-400" : "bg-muted text-muted-foreground"
                  }`}>
                    {inv.status}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-border text-center">
                <div>
                  <div className="text-xs font-semibold">{(inv.dailyRate * 100).toFixed(1)}%</div>
                  <div className="text-xs text-muted-foreground">Daily</div>
                </div>
                <div>
                  <div className="text-xs font-semibold">{inv.durationDays}d</div>
                  <div className="text-xs text-muted-foreground">Duration</div>
                </div>
                <div>
                  <div className="text-xs font-semibold">${inv.earnedSoFar.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">Earned</div>
                </div>
                <div>
                  <div className="text-xs font-semibold">{formatDate(inv.startDate)}</div>
                  <div className="text-xs text-muted-foreground">Started</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
