import { useGetIncomeSummary, useListInvestments, useGetTeamStats, useGetMyRankProgress } from "@workspace/api-client-react";
import { Link } from "wouter";
import { TrendingUp, Users, DollarSign, Award, ArrowRight, Wallet, Clock, CheckCircle } from "lucide-react";

function StatCard({ label, value, sub, icon: Icon, accent }: any) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${accent ? "bg-primary/10" : "bg-secondary"}`}>
          <Icon size={18} className={accent ? "text-primary" : "text-muted-foreground"} />
        </div>
      </div>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
      {sub && <div className="text-xs text-primary mt-1">{sub}</div>}
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
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-6 pb-24 md:pb-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Welcome back,</h1>
          <p className="text-primary font-semibold">{user?.name}</p>
        </div>
        <Link href="/invest">
          <button data-testid="button-invest-now" className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5">
            <TrendingUp size={14} /> Invest
          </button>
        </Link>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-primary/20 to-amber-700/5 border border-primary/30 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(246,195,67,0.15)_0%,_transparent_60%)] pointer-events-none" />
        <div className="relative">
          <div className="text-xs text-muted-foreground mb-1">Available Balance</div>
          <div className="text-3xl font-bold text-primary mb-4" data-testid="text-balance">
            ${loadingSummary ? "—" : (summary?.availableBalance ?? 0).toFixed(2)}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-background/30 rounded-xl p-3">
              <div className="text-xs text-muted-foreground">Total Earnings</div>
              <div className="font-bold text-sm mt-0.5" data-testid="text-total-earnings">${summary?.totalEarnings?.toFixed(2) ?? "—"}</div>
            </div>
            <div className="bg-background/30 rounded-xl p-3">
              <div className="text-xs text-muted-foreground">Total Withdrawn</div>
              <div className="font-bold text-sm mt-0.5">${summary?.withdrawnTotal?.toFixed(2) ?? "—"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total Invested" value={`$${user?.totalInvested?.toFixed(2) || "0.00"}`} icon={Wallet} accent />
        <StatCard label="Daily Return" icon={DollarSign}
          value={activeInv.length > 0 ? `$${(activeInv.reduce((s, i) => s + i.amount * i.dailyRate, 0)).toFixed(2)}` : "$0.00"}
          sub="Today's estimate" />
        <StatCard label="Team Members" value={teamStats?.totalMembers ?? "—"} icon={Users} />
        <StatCard label="Current Level" value={`L${user?.currentLevel ?? 0}`} icon={Award} accent />
      </div>

      {/* Active Investments */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm">Active Investments</h2>
          <Link href="/invest" className="text-primary text-xs flex items-center gap-1">View all <ArrowRight size={12} /></Link>
        </div>
        {loadingInv ? (
          <div className="space-y-3">
            {[1,2].map(i => <div key={i} className="bg-card border border-border rounded-xl h-20 animate-pulse" />)}
          </div>
        ) : activeInv.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <TrendingUp size={32} className="text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No active investments yet</p>
            <Link href="/invest">
              <button className="mt-3 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold">
                Make your first investment
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {activeInv.slice(0, 3).map(inv => (
              <div key={inv.id} data-testid={`card-investment-${inv.id}`} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <TrendingUp size={14} className="text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">${inv.amount.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground capitalize">{inv.planTier.replace("tier", "Tier ")}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-primary font-bold text-sm">+{(inv.dailyRate * 100).toFixed(1)}%</div>
                    <div className="text-xs text-muted-foreground">daily</div>
                  </div>
                </div>
                <div className="w-full bg-background rounded-full h-1.5">
                  <div
                    className="bg-primary h-1.5 rounded-full"
                    style={{ width: `${Math.max(5, ((inv.durationDays - inv.remainingDays) / inv.durationDays) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
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
            <h2 className="font-semibold text-sm">Income Breakdown</h2>
            <Link href="/income" className="text-primary text-xs flex items-center gap-1">Details <ArrowRight size={12} /></Link>
          </div>
          <div className="bg-card border border-border rounded-xl divide-y divide-border">
            {[
              { label: "Daily Returns", value: summary.dailyReturnTotal },
              { label: "Spot Referral", value: summary.spotReferralTotal },
              { label: "Level Commission", value: summary.levelCommissionTotal },
              { label: "Rank Bonuses", value: summary.rankBonusTotal },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <CheckCircle size={13} className="text-primary" />
                  <span className="text-sm">{item.label}</span>
                </div>
                <span className="font-semibold text-sm">${item.value.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rank Progress */}
      {rankProgress?.nextRank && (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Award size={16} className="text-primary" />
            <h2 className="font-semibold text-sm">Rank Progress</h2>
          </div>
          <div className="text-sm text-muted-foreground mb-1">Next Rank: <span className="text-foreground font-semibold">{rankProgress.nextRank.name}</span></div>
          <div className="text-sm text-muted-foreground mb-3">Reward: <span className="text-primary">{rankProgress.nextRank.reward}</span></div>
          <Link href="/ranks">
            <button className="w-full border border-primary/30 text-primary py-2 rounded-lg text-sm font-semibold hover:bg-primary/10 transition-colors">
              View Rank Details
            </button>
          </Link>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "My Team", href: "/team", icon: Users },
          { label: "Share Link", href: "/share", icon: Clock },
          { label: "Withdraw", href: "/withdrawals", icon: Wallet },
          { label: "All Ranks", href: "/ranks", icon: Award },
        ].map(item => (
          <Link key={item.label} href={item.href}>
            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 hover:border-primary/40 transition-colors cursor-pointer">
              <item.icon size={18} className="text-primary" />
              <span className="text-sm font-medium">{item.label}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
