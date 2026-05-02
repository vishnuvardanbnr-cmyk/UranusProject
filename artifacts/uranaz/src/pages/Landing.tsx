import { Link } from "wouter";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
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
            <span className="gold-text">URANUS TRADES</span>
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
    </div>
  );
}
