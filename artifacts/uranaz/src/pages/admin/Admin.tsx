import { useGetAdminStats } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Users, TrendingUp, Wallet, Settings, DollarSign, ArrowRight } from "lucide-react";

function StatCard({ label, value, icon: Icon }: any) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
        <Icon size={18} className="text-primary" />
      </div>
      <div className="text-2xl font-bold">{value ?? "—"}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

export default function Admin() {
  const { data: stats, isLoading } = useGetAdminStats();

  return (
    <div className="px-4 py-6 max-w-4xl mx-auto space-y-6 pb-24 md:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm">URANAZ TRADES Platform Overview</p>
        </div>
        <div className="bg-primary/10 border border-primary/30 text-primary text-xs px-3 py-1 rounded-full font-semibold">ADMIN</div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="bg-card border border-border rounded-xl h-24 animate-pulse" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Total Users" value={stats?.totalUsers} icon={Users} />
            <StatCard label="Active Users" value={stats?.activeUsers} icon={Users} />
            <StatCard label="Active Investments" value={stats?.activeInvestments} icon={TrendingUp} />
            <StatCard label="Pending Withdrawals" value={stats?.pendingWithdrawals} icon={Wallet} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Total Invested" value={`$${stats?.totalInvested?.toFixed(0) ?? "—"}`} icon={DollarSign} />
            <StatCard label="Total Withdrawn" value={`$${stats?.totalWithdrawn?.toFixed(0) ?? "—"}`} icon={Wallet} />
            <StatCard label="Commissions Paid" value={`$${stats?.totalCommissionsPaid?.toFixed(0) ?? "—"}`} icon={DollarSign} />
            <StatCard label="New Users Today" value={stats?.newUsersToday} icon={Users} />
          </div>
        </>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Manage Users", sub: `${stats?.totalUsers ?? 0} users`, href: "/admin/users", icon: Users },
          { label: "Investments", sub: `${stats?.activeInvestments ?? 0} active`, href: "/admin/investments", icon: TrendingUp },
          { label: "Withdrawals", sub: `${stats?.pendingWithdrawals ?? 0} pending`, href: "/admin/withdrawals", icon: Wallet },
          { label: "Platform Settings", sub: "Configure platform", href: "/admin/settings", icon: Settings },
        ].map(item => (
          <Link key={item.label} href={item.href}>
            <div className="bg-card border border-border rounded-xl p-5 flex items-start justify-between hover:border-primary/40 transition-colors cursor-pointer">
              <div>
                <item.icon size={20} className="text-primary mb-2" />
                <div className="font-semibold text-sm">{item.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{item.sub}</div>
              </div>
              <ArrowRight size={14} className="text-muted-foreground mt-1" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
