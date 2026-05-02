import { Link } from "wouter";
import { useListRanks } from "@workspace/api-client-react";
import { TrendingUp, Shield, Globe, Award, Gift, Plane, ChevronRight, CheckCircle } from "lucide-react";

const plans = [
  { range: "$100 – $400", rate: "0.6%", days: 300, tier: "tier1", color: "from-amber-600 to-amber-500" },
  { range: "$500 – $900", rate: "0.7%", days: 260, tier: "tier2", color: "from-yellow-500 to-amber-400", popular: true },
  { range: "$1,000 – $1,500", rate: "0.8%", days: 225, tier: "tier3", color: "from-amber-400 to-yellow-300" },
];

const levels = [
  { level: 1, commission: "20%", duration: "80 Days", unlock: "Earn $1,000" },
  { level: 2, commission: "10%", duration: "80 Days", unlock: "Earn $3,000" },
  { level: 3, commission: "10%", duration: "60 Days", unlock: "Earn $10,000" },
  { level: "4–8", commission: "4% each", duration: "60 Days", unlock: "Earn $10,000" },
];

const stats = [
  { label: "Years Experience", value: "10+" },
  { label: "Active Investors", value: "5,200+" },
  { label: "Countries", value: "45+" },
  { label: "Total Returns Paid", value: "$12M+" },
];

export default function Landing() {
  const { data: ranks } = useListRanks();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-16 pb-24 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(246,195,67,0.1)_0%,_transparent_60%)] pointer-events-none" />
        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 text-primary text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            Launch Offer Active — Free Singapore Trip
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold mb-4 leading-tight">
            <span className="text-foreground">Grow Your Wealth with</span>
            <br />
            <span className="gold-text">URANAZ TRADES</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-10">
            10+ years of expertise in Real Estate, Stocks, Forex & Crypto — now opening our investment platform to the public. Earn up to 0.8% daily returns with a proven multi-level commission structure.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <button data-testid="button-get-started" className="bg-primary text-primary-foreground px-8 py-3.5 rounded-xl font-semibold text-base hover:bg-primary/90 transition-colors w-full sm:w-auto">
                Start Investing Now
              </button>
            </Link>
            <Link href="/login">
              <button data-testid="button-login-hero" className="border border-border text-foreground px-8 py-3.5 rounded-xl font-semibold text-base hover:bg-secondary transition-colors w-full sm:w-auto">
                Sign In
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-4 pb-16">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map(s => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-primary">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Investment Plans */}
      <section className="px-4 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">Investment Plans</h2>
            <p className="text-muted-foreground text-sm">Minimum investment multiples of $100 · Payouts every weekday · Min. 50% HYPERCOIN</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {plans.map(plan => (
              <div key={plan.tier} className={`relative bg-card border rounded-2xl p-6 ${plan.popular ? "border-primary gold-glow" : "border-border"}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                )}
                <div className={`text-3xl font-extrabold bg-gradient-to-r ${plan.color} bg-clip-text text-transparent mb-1`}>
                  {plan.rate}
                </div>
                <div className="text-xs text-muted-foreground mb-3">Daily Return</div>
                <div className="text-sm font-semibold text-foreground mb-1">{plan.range}</div>
                <div className="text-xs text-muted-foreground mb-4">{plan.days} Days Duration</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
                  <CheckCircle size={13} className="text-primary shrink-0" />
                  5 days/week payout
                </div>
                <Link href="/register">
                  <button className="w-full bg-primary/10 border border-primary/30 text-primary py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/20 transition-colors">
                    Invest Now
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Level Commission */}
      <section className="px-4 pb-20 bg-card/30">
        <div className="max-w-4xl mx-auto py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">Level Commission System</h2>
            <p className="text-muted-foreground text-sm">5% spot referral + multi-level passive income from your network</p>
          </div>
          <div className="grid gap-3">
            {levels.map(l => (
              <div key={String(l.level)} className="bg-card border border-border rounded-xl px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    L{l.level}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{l.commission} of return amount</div>
                    <div className="text-xs text-muted-foreground">{l.duration} active · Unlock: {l.unlock}</div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ranks */}
      {ranks && ranks.length > 0 && (
        <section className="px-4 pb-20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">Rank & Reward System</h2>
              <p className="text-muted-foreground text-sm">Build your team and unlock extraordinary rewards</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ranks.map(rank => (
                <div key={rank.id} className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                      {rank.rankNumber}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{rank.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{rank.criteria}</div>
                      <div className="mt-2 inline-flex items-center gap-1 bg-primary/10 border border-primary/20 rounded-full px-2.5 py-0.5 text-primary text-xs font-semibold">
                        <Gift size={11} /> {rank.reward}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Singapore Offer */}
      <section className="px-4 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-primary/20 to-amber-700/10 border border-primary/30 rounded-2xl p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(246,195,67,0.08)_0%,_transparent_70%)] pointer-events-none" />
            <Plane size={36} className="text-primary mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Free Singapore Trip</h3>
            <p className="text-muted-foreground mb-4 text-sm max-w-lg mx-auto">
              3 Days · 5-Star Accommodation · All-inclusive package for qualifying investors
            </p>
            <div className="grid sm:grid-cols-3 gap-3 mb-6">
              <div className="bg-background/40 rounded-lg p-3 text-sm">
                <div className="font-bold text-primary">$500+</div>
                <div className="text-muted-foreground text-xs">Self Investment</div>
              </div>
              <div className="bg-background/40 rounded-lg p-3 text-sm">
                <div className="font-bold text-primary">$25,000</div>
                <div className="text-muted-foreground text-xs">Team Business</div>
              </div>
              <div className="bg-background/40 rounded-lg p-3 text-sm">
                <div className="font-bold text-primary">3 Legs</div>
                <div className="text-muted-foreground text-xs">10k + 10k + 5k</div>
              </div>
            </div>
            <Link href="/register">
              <button className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors">
                Qualify for Singapore Trip
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Industries */}
      <section className="px-4 pb-20 bg-card/30">
        <div className="max-w-4xl mx-auto py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">Our Trading Expertise</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: Globe, title: "Real Estate", desc: "Commercial and residential property investments across premium global markets" },
              { icon: TrendingUp, title: "Stocks & Shares", desc: "Equity trading and portfolio management across major global exchanges" },
              { icon: Shield, title: "Forex & Crypto", desc: "Currency markets and digital asset trading with disciplined risk management" },
            ].map(item => (
              <div key={item.title} className="bg-card border border-border rounded-xl p-6">
                <item.icon size={28} className="text-primary mb-3" />
                <div className="font-semibold mb-2">{item.title}</div>
                <div className="text-muted-foreground text-sm">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to Start Earning?</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">Join thousands of investors already earning daily returns through URANAZ TRADES.</p>
        <Link href="/register">
          <button data-testid="button-register-cta" className="bg-primary text-primary-foreground px-10 py-4 rounded-xl font-bold text-lg hover:bg-primary/90 transition-colors">
            Create Free Account
          </button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-8">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="font-bold text-foreground">URANAZ TRADES</div>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/login" className="hover:text-foreground transition-colors">Sign In</Link>
          </div>
          <div>© 2025 URANAZ TRADES. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
