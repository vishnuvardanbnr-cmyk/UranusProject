import { useLocation, Link } from "wouter";
import { LayoutDashboard, TrendingUp, Users, DollarSign, MoreHorizontal, Home } from "lucide-react";

const navItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/invest", icon: TrendingUp, label: "Invest" },
  { path: "/team", icon: Users, label: "Team" },
  { path: "/income", icon: DollarSign, label: "Income" },
];

interface Props {
  isLoggedIn: boolean;
}

export default function BottomNav({ isLoggedIn }: Props) {
  const [location] = useLocation();

  if (!isLoggedIn) return null;

  return (
    <nav
      data-testid="bottom-nav"
      className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border bottom-nav-safe md:hidden"
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ path, icon: Icon, label }) => {
          const active = location === path || (path !== "/" && location.startsWith(path));
          return (
            <Link
              key={path}
              href={path}
              data-testid={`nav-${label.toLowerCase()}`}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
