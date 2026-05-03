import { Link, useLocation } from "wouter";
import { clearToken } from "@/lib/auth";
import { useLogout } from "@workspace/api-client-react";
import { LogOut, Shield, HeadphonesIcon } from "lucide-react";
import NoticesBell from "@/components/NoticesBell";

interface Props {
  user: any;
  onLogout: () => void;
}

const navLinks = [
  { href: "/dashboard",   label: "Dashboard" },
  { href: "/deposit",     label: "Deposit" },
  { href: "/invest",      label: "Invest" },
  { href: "/income",      label: "Income" },
  { href: "/wallet",      label: "Wallet" },
  { href: "/team",        label: "Team" },
  { href: "/withdrawals", label: "Withdraw" },
  { href: "/ranks",       label: "Ranks" },
];

export default function TopNav({ user, onLogout }: Props) {
  const logout = useLogout();
  const [location, setLocation] = useLocation();

  const handleLogout = async () => {
    try { await logout.mutateAsync(); } catch {}
    clearToken();
    onLogout();
    setLocation("/login");
  };

  return (
    <header
      className="sticky top-0 z-30"
      style={{
        background: "rgba(1, 12, 24, 0.80)",
        backdropFilter: "blur(20px) saturate(1.6)",
        WebkitBackdropFilter: "blur(20px) saturate(1.6)",
        borderBottom: "1px solid rgba(61, 214, 245, 0.12)",
        boxShadow: "0 1px 0 rgba(61,214,245,0.06), 0 4px 24px rgba(0,0,0,0.5)",
      }}
    >
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center group">
          <div
            className="w-20 h-20 shrink-0"
            style={{ filter: "drop-shadow(0 0 8px rgba(61,214,245,0.6))" }}
          >
            <img src="/logo.png" alt="URANUS" className="w-full h-full object-contain" />
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1 text-sm">
          {navLinks.map(({ href, label }) => {
            const active = location === href || (href !== "/" && location.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className="px-3 py-1.5 rounded-lg transition-all duration-200 font-medium"
                style={{
                  color: active ? "#3DD6F5" : "rgba(168,237,255,0.55)",
                  background: active ? "rgba(61,214,245,0.08)" : "transparent",
                  textShadow: active ? "0 0 10px rgba(61,214,245,0.5)" : "none",
                  border: active ? "1px solid rgba(61,214,245,0.18)" : "1px solid transparent",
                }}
              >
                {label}
              </Link>
            );
          })}
          {user?.isAdmin && (
            <Link
              href="/admin"
              className="px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-all"
              style={{
                color: "#f97316",
                background: "rgba(249,115,22,0.08)",
                border: "1px solid rgba(249,115,22,0.2)",
              }}
            >
              <Shield size={13} /> Admin
            </Link>
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <NoticesBell />
          <Link
            href="/support"
            data-testid="link-support"
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
            style={{
              background: "rgba(61,214,245,0.06)",
              border: "1px solid rgba(61,214,245,0.18)",
              color: "rgba(168,237,255,0.55)",
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
              (e.currentTarget as HTMLAnchorElement).style.color = "#3DD6F5";
              (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(61,214,245,0.45)";
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
              (e.currentTarget as HTMLAnchorElement).style.color = "rgba(168,237,255,0.55)";
              (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(61,214,245,0.18)";
            }}
          >
            <HeadphonesIcon size={15} />
          </Link>
          <Link
            href="/profile"
            data-testid="link-profile"
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
            style={{
              background: "linear-gradient(135deg, rgba(61,214,245,0.25), rgba(42,179,215,0.15))",
              border: "1px solid rgba(61,214,245,0.35)",
              color: "#3DD6F5",
              boxShadow: "0 0 10px rgba(61,214,245,0.2)",
            }}
          >
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </Link>
          <button
            data-testid="button-logout"
            onClick={handleLogout}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ color: "rgba(168,237,255,0.4)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(168,237,255,0.4)")}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}
