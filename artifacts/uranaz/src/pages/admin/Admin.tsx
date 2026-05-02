import { useGetAdminStats } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Users, TrendingUp, Wallet, Settings, DollarSign, ArrowRight, Shield, MessageCircle, Award } from "lucide-react";

const TEAL = "#3DD6F5";
const GLASS = { background: "rgba(5,18,32,0.65)", backdropFilter: "blur(14px)", border: "1px solid rgba(61,214,245,0.10)" } as const;

function StatCard({ label, value, icon: Icon }: any) {
  return (
    <div className="rounded-xl p-4 transition-all" style={GLASS}>
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
        style={{ background: "rgba(61,214,245,0.10)", border: "1px solid rgba(61,214,245,0.18)" }}
      >
        <Icon size={17} style={{ color: TEAL }} />
      </div>
      <div className="text-2xl font-bold" style={{ color: "rgba(168,237,255,0.9)" }}>{value ?? "—"}</div>
      <div className="text-xs mt-0.5" style={{ color: "rgba(168,237,255,0.4)" }}>{label}</div>
    </div>
  );
}

export default function Admin() {
  const { data: stats, isLoading } = useGetAdminStats();

  return (
    <div className="px-4 py-6 max-w-4xl mx-auto space-y-6 pb-24 md:pb-8">
      <div className="flex items-center justify-between">
        <div>
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
            Admin Dashboard
          </h1>
          <p className="text-sm" style={{ color: "rgba(168,237,255,0.4)" }}>URANAZ TRADES Platform Overview</p>
        </div>
        <div
          className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-semibold"
          style={{
            background: "rgba(249,115,22,0.10)",
            border: "1px solid rgba(249,115,22,0.22)",
            color: "#f97316",
          }}
        >
          <Shield size={11} /> ADMIN
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="rounded-xl h-24 animate-pulse" style={{ background: "rgba(61,214,245,0.04)", border: "1px solid rgba(61,214,245,0.08)" }} />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Total Users"          value={stats?.totalUsers}          icon={Users} />
            <StatCard label="Active Users"         value={stats?.activeUsers}         icon={Users} />
            <StatCard label="Active Investments"   value={stats?.activeInvestments}   icon={TrendingUp} />
            <StatCard label="Pending Withdrawals"  value={stats?.pendingWithdrawals}  icon={Wallet} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Total Invested"    value={`$${stats?.totalInvested?.toFixed(0) ?? "—"}`}     icon={DollarSign} />
            <StatCard label="Total Withdrawn"   value={`$${stats?.totalWithdrawn?.toFixed(0) ?? "—"}`}    icon={Wallet} />
            <StatCard label="Commissions Paid"  value={`$${stats?.totalCommissionsPaid?.toFixed(0) ?? "—"}`} icon={DollarSign} />
            <StatCard label="New Users Today"   value={stats?.newUsersToday}                               icon={Users} />
          </div>
        </>
      )}

      {/* Quick nav cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Manage Users",     sub: `${stats?.totalUsers ?? 0} users`,       href: "/admin/users",        icon: Users },
          { label: "Investments",      sub: `${stats?.activeInvestments ?? 0} active`, href: "/admin/investments", icon: TrendingUp },
          { label: "Withdrawals",      sub: `${stats?.pendingWithdrawals ?? 0} pending`, href: "/admin/withdrawals", icon: Wallet },
          { label: "Platform Settings",sub: "Configure platform",                    href: "/admin/settings",     icon: Settings },
          { label: "Support Tickets", sub: "Manage user queries",                   href: "/admin/support",      icon: MessageCircle },
          { label: "Offers",           sub: "Create & manage offers",               href: "/admin/offers",       icon: Award },
        ].map(item => (
          <Link key={item.label} href={item.href}>
            <div
              className="rounded-xl p-5 flex items-start justify-between cursor-pointer transition-all"
              style={GLASS}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(61,214,245,0.28)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(61,214,245,0.10)"; }}
            >
              <div>
                <item.icon size={20} className="mb-2" style={{ color: TEAL }} />
                <div className="font-semibold text-sm" style={{ color: "rgba(168,237,255,0.85)" }}>{item.label}</div>
                <div className="text-xs mt-0.5" style={{ color: "rgba(168,237,255,0.4)" }}>{item.sub}</div>
              </div>
              <ArrowRight size={14} style={{ color: "rgba(168,237,255,0.25)" }} className="mt-1" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
