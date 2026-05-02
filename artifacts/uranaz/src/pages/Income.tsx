import { useState } from "react";
import { useListIncome, useGetIncomeSummary, getListIncomeQueryKey } from "@workspace/api-client-react";
import { DollarSign, TrendingUp, Users, Award, Filter } from "lucide-react";

const typeFilters = [
  { value: "", label: "All" },
  { value: "daily_return", label: "Daily Return" },
  { value: "spot_referral", label: "Referral" },
  { value: "level_commission", label: "Commission" },
  { value: "rank_bonus", label: "Rank Bonus" },
];

const typeIcons: Record<string, any> = {
  daily_return: TrendingUp,
  spot_referral: Users,
  level_commission: DollarSign,
  rank_bonus: Award,
};

const typeColors: Record<string, string> = {
  daily_return: "text-emerald-400",
  spot_referral: "text-blue-400",
  level_commission: "text-purple-400",
  rank_bonus: "text-primary",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function Income() {
  const [type, setType] = useState("");
  const { data: summary, isLoading: sumLoading } = useGetIncomeSummary();
  const { data: incomeData, isLoading } = useListIncome(
    type ? { type: type as any, page: 1, limit: 50 } : { page: 1, limit: 50 },
    { query: { queryKey: getListIncomeQueryKey(type ? { type: type as any, page: 1, limit: 50 } : { page: 1, limit: 50 }) } }
  );

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-6 pb-24 md:pb-6">
      <h1 className="text-xl font-bold">Income Details</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-primary/15 to-amber-700/5 border border-primary/30 rounded-xl p-4 col-span-2">
          <div className="text-xs text-muted-foreground">Total Earnings</div>
          <div className="text-3xl font-bold text-primary mt-1" data-testid="text-total-income">
            ${sumLoading ? "—" : (summary?.totalEarnings ?? 0).toFixed(2)}
          </div>
          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
            <span>Available: <span className="text-foreground font-semibold">${summary?.availableBalance?.toFixed(2) ?? "—"}</span></span>
            <span>Withdrawn: <span className="text-foreground font-semibold">${summary?.withdrawnTotal?.toFixed(2) ?? "—"}</span></span>
          </div>
        </div>
        {[
          { label: "Daily Returns", value: summary?.dailyReturnTotal, icon: TrendingUp, color: "text-emerald-400" },
          { label: "Spot Referral", value: summary?.spotReferralTotal, icon: Users, color: "text-blue-400" },
          { label: "Level Commission", value: summary?.levelCommissionTotal, icon: DollarSign, color: "text-purple-400" },
          { label: "Rank Bonus", value: summary?.rankBonusTotal, icon: Award, color: "text-primary" },
        ].map(item => (
          <div key={item.label} className="bg-card border border-border rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <item.icon size={13} className={item.color} />
              <div className="text-xs text-muted-foreground">{item.label}</div>
            </div>
            <div className="font-bold text-sm">${item.value?.toFixed(2) ?? "0.00"}</div>
          </div>
        ))}
      </div>

      {/* Type Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {typeFilters.map(f => (
          <button
            key={f.value}
            data-testid={`filter-${f.value || "all"}`}
            onClick={() => setType(f.value)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              type === f.value ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:border-primary/30"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Income List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="bg-card border border-border rounded-xl h-16 animate-pulse" />)}
        </div>
      ) : !incomeData?.records?.length ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center">
          <DollarSign size={36} className="text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No income records yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {incomeData.records.map(record => {
            const Icon = typeIcons[record.type] || DollarSign;
            const color = typeColors[record.type] || "text-primary";
            return (
              <div key={record.id} data-testid={`row-income-${record.id}`} className="bg-card border border-border rounded-xl px-4 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg bg-background flex items-center justify-center ${color}`}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{record.description}</div>
                    {record.fromUserName && (
                      <div className="text-xs text-muted-foreground">From: {record.fromUserName}</div>
                    )}
                    <div className="text-xs text-muted-foreground">{formatDate(record.createdAt)}</div>
                  </div>
                </div>
                <div className={`font-bold text-sm ${color}`}>+${record.amount.toFixed(2)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
