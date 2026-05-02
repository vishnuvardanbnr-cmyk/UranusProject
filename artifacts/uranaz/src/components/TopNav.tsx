import { Link, useLocation } from "wouter";
import { clearToken } from "@/lib/auth";
import { useLogout } from "@workspace/api-client-react";
import { LogOut, Shield, Bell } from "lucide-react";

interface Props {
  user: any;
  onLogout: () => void;
}

export default function TopNav({ user, onLogout }: Props) {
  const logout = useLogout();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    try { await logout.mutateAsync(); } catch {}
    clearToken();
    onLogout();
    setLocation("/login");
  };

  return (
    <header className="sticky top-0 z-30 bg-card/90 backdrop-blur border-b border-border">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold">UT</span>
          </div>
          <span className="font-bold text-sm tracking-wide hidden sm:block">URANAZ TRADES</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
          <Link href="/invest" className="text-muted-foreground hover:text-foreground transition-colors">Invest</Link>
          <Link href="/income" className="text-muted-foreground hover:text-foreground transition-colors">Income</Link>
          <Link href="/team" className="text-muted-foreground hover:text-foreground transition-colors">Team</Link>
          <Link href="/withdrawals" className="text-muted-foreground hover:text-foreground transition-colors">Withdraw</Link>
          <Link href="/ranks" className="text-muted-foreground hover:text-foreground transition-colors">Ranks</Link>
          {user?.isAdmin && (
            <Link href="/admin" className="text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
              <Shield size={14} /> Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/profile" data-testid="link-profile" className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </Link>
          <button
            data-testid="button-logout"
            onClick={handleLogout}
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
