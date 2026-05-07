import { Link } from "wouter";
import { useEffect, useRef, useState } from "react";
import {
  TrendingUp, Building2, BarChart2, Coins, Shield, Users, Zap, Star,
  ArrowRight, CheckCircle, FileText, X,
} from "lucide-react";

/* ─── Certificate Modal ─────────────────────────────────────── */
function CertificateModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(1,8,16,0.96)", backdropFilter: "blur(16px)" }}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: "rgba(4,16,32,0.99)",
          border: "1px solid rgba(61,214,245,0.20)",
          boxShadow: "0 8px 60px rgba(1,8,16,0.9)",
          maxHeight: "90vh",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: "1px solid rgba(61,214,245,0.10)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(61,214,245,0.10)", border: "1px solid rgba(61,214,245,0.22)" }}
            >
              <FileText size={16} style={{ color: "#3DD6F5" }} />
            </div>
            <div>
              <div className="text-sm font-bold" style={{ color: "rgba(200,240,255,0.92)", fontFamily: "'Orbitron', sans-serif", fontSize: "0.75rem" }}>
                Certificate of Incorporation
              </div>
              <div className="text-xs" style={{ color: "rgba(168,237,255,0.35)" }}>
                URANUS INVESTMENT LTD · Company No. 14309852
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:brightness-125"
            style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.20)", color: "#f87171" }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Certificate content */}
        <div
          className="relative flex-1 overflow-y-auto"
          style={{ minHeight: 0 }}
          onContextMenu={e => e.preventDefault()}
        >
          {/* Certificate paper */}
          <div
            className="relative mx-4 my-5 rounded-xl p-8 sm:p-12 select-none"
            style={{
              background: "#f9f7f2",
              border: "2px solid #c8b87a",
              boxShadow: "inset 0 0 40px rgba(200,184,122,0.15), 0 4px 24px rgba(0,0,0,0.4)",
              fontFamily: "Georgia, 'Times New Roman', serif",
              color: "#1a1208",
            }}
          >
            {/* Corner decorations */}
            {["top-3 left-3", "top-3 right-3", "bottom-3 left-3", "bottom-3 right-3"].map(pos => (
              <div key={pos} className={`absolute ${pos} w-6 h-6`}
                style={{ border: "2px solid #c8b87a", borderRadius: 2 }} />
            ))}

            {/* Header */}
            <div className="text-center mb-8">
              <div className="text-xs tracking-[0.25em] uppercase mb-1" style={{ color: "#8a7a4a" }}>
                Companies House
              </div>
              <div className="w-16 h-px mx-auto mb-4" style={{ background: "#c8b87a" }} />
              <h2 className="text-lg font-bold tracking-widest uppercase mb-1" style={{ color: "#1a1208", letterSpacing: "0.15em" }}>
                Certificate of Incorporation
              </h2>
              <div className="text-sm tracking-wide" style={{ color: "#5a4a2a" }}>of a</div>
              <div className="text-base font-bold tracking-widest uppercase" style={{ color: "#1a1208" }}>
                Private Limited Company
              </div>
              <div className="w-32 h-px mx-auto mt-4" style={{ background: "linear-gradient(90deg, transparent, #c8b87a, transparent)" }} />
            </div>

            {/* Company Number */}
            <div className="text-center mb-6">
              <span className="text-sm" style={{ color: "#5a4a2a" }}>Company Number </span>
              <span className="text-base font-bold" style={{ color: "#1a1208" }}>14309852</span>
            </div>

            {/* Body */}
            <div className="text-sm leading-relaxed text-center mb-6" style={{ color: "#2a1e0a" }}>
              <p className="mb-4">
                The Registrar of Companies for England and Wales, hereby certifies that
              </p>
              <p className="text-2xl font-bold tracking-wider my-5" style={{ color: "#1a1208", fontFamily: "'Georgia', serif" }}>
                URANUS INVESTMENT LTD
              </p>
              <p>
                is this day incorporated under the Companies Act 2006 as a private company,
                that the company is limited by shares, and the situation of its registered
                office is in England and Wales.
              </p>
            </div>

            {/* Date */}
            <div className="text-center mb-8 text-sm" style={{ color: "#5a4a2a" }}>
              Given at Companies House, Cardiff, on{" "}
              <strong style={{ color: "#1a1208" }}>22nd August 2022</strong>.
            </div>

            {/* Divider */}
            <div className="w-full h-px mb-6" style={{ background: "linear-gradient(90deg, transparent, #c8b87a, transparent)" }} />

            {/* Footer note */}
            <p className="text-xs text-center leading-relaxed" style={{ color: "#7a6a4a" }}>
              The above information was communicated by electronic means and authenticated by the
              Registrar of Companies under section 1115 of the Companies Act 2006
            </p>

            {/* Watermark */}
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden rounded-xl"
            >
              <div
                className="text-3xl font-black tracking-widest"
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  color: "rgba(61,214,245,0.07)",
                  transform: "rotate(-30deg)",
                  whiteSpace: "nowrap",
                  userSelect: "none",
                }}
              >
                URANUS TRADES · OFFICIAL
              </div>
            </div>
          </div>

          {/* Transparent protective overlay */}
          <div
            className="absolute inset-0"
            style={{ zIndex: 10 }}
            onContextMenu={e => e.preventDefault()}
            onDragStart={e => e.preventDefault()}
          />
        </div>

        {/* Footer note */}
        <div
          className="px-5 py-3 text-center shrink-0"
          style={{ borderTop: "1px solid rgba(61,214,245,0.08)" }}
        >
          <p className="text-xs" style={{ color: "rgba(168,237,255,0.28)" }}>
            Issued by Companies House, England & Wales · 22 August 2022
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Star field canvas ─────────────────────────────────────── */
function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const stars = Array.from({ length: 180 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.4 + 0.2,
      a: Math.random(),
      speed: Math.random() * 0.003 + 0.001,
      phase: Math.random() * Math.PI * 2,
    }));

    let raf: number;
    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach(s => {
        const alpha = s.a * (0.5 + 0.5 * Math.sin(t * s.speed * 20 + s.phase));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(168,237,255,${alpha})`;
        ctx.fill();
      });
      t++;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
}

/* ─── Feature card ──────────────────────────────────────────── */
function FeatureCard({
  icon: Icon, title, desc, color,
}: { icon: any; title: string; desc: string; color: string }) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3 transition-all hover:scale-[1.02]"
      style={{
        background: "rgba(5,18,32,0.65)",
        backdropFilter: "blur(14px)",
        border: `1px solid ${color}22`,
        boxShadow: `0 4px 24px rgba(0,0,0,0.35), 0 0 40px ${color}08`,
      }}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center"
        style={{ background: `${color}15`, border: `1px solid ${color}30` }}
      >
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <div className="font-bold text-sm mb-1" style={{ color: "rgba(200,240,255,0.90)" }}>{title}</div>
        <div className="text-xs leading-relaxed" style={{ color: "rgba(168,237,255,0.45)" }}>{desc}</div>
      </div>
    </div>
  );
}

/* ─── Step card ─────────────────────────────────────────────── */
function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="flex gap-4">
      <div className="shrink-0 flex flex-col items-center">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black"
          style={{
            background: "linear-gradient(135deg, #3DD6F5, #2AB3CF)",
            color: "#010810",
            fontFamily: "'Orbitron', sans-serif",
            boxShadow: "0 0 20px rgba(61,214,245,0.35)",
          }}
        >
          {n}
        </div>
        {n < 3 && <div className="w-px flex-1 mt-2" style={{ background: "rgba(61,214,245,0.18)", minHeight: 32 }} />}
      </div>
      <div className="pb-8">
        <div className="font-bold text-sm mb-1" style={{ color: "rgba(200,240,255,0.90)" }}>{title}</div>
        <div className="text-xs leading-relaxed" style={{ color: "rgba(168,237,255,0.45)" }}>{desc}</div>
      </div>
    </div>
  );
}

/* ─── Main ──────────────────────────────────────────────────── */
export default function Landing() {
  const [showCert, setShowCert] = useState(false);

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: "#010810" }}>
      <StarField />

      {/* Nebula blobs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div style={{
          position: "absolute", top: "-20%", right: "-15%",
          width: 700, height: 700, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(61,214,245,0.07) 0%, transparent 65%)",
        }} />
        <div style={{
          position: "absolute", bottom: "-10%", left: "-10%",
          width: 600, height: 600, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(120,60,220,0.08) 0%, transparent 65%)",
        }} />
        <div style={{
          position: "absolute", top: "40%", left: "50%", transform: "translateX(-50%)",
          width: 800, height: 300, borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(61,214,245,0.04) 0%, transparent 70%)",
        }} />
      </div>

      {/* Grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `linear-gradient(rgba(61,214,245,0.025) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(61,214,245,0.025) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* ── Nav bar ───────────────────────────────────────────── */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div
          className="text-lg font-black tracking-wider"
          style={{
            fontFamily: "'Orbitron', sans-serif",
            background: "linear-gradient(135deg, #a8edff, #3DD6F5, #a8edff)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          URANUS
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <button
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:brightness-125"
              style={{ color: "rgba(168,237,255,0.7)", border: "1px solid rgba(61,214,245,0.18)", background: "rgba(61,214,245,0.05)" }}
            >
              Sign In
            </button>
          </Link>
          <Link href="/register">
            <button
              className="px-4 py-2 rounded-xl text-sm font-bold transition-all hover:brightness-110"
              style={{ background: "linear-gradient(135deg, #3DD6F5, #2AB3CF)", color: "#010810" }}
            >
              Get Started
            </button>
          </Link>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative z-10 px-4 pt-12 pb-20 text-center max-w-4xl mx-auto">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8"
          style={{
            background: "rgba(61,214,245,0.08)",
            border: "1px solid rgba(61,214,245,0.25)",
          }}
        >
          <Star size={12} style={{ color: "#3DD6F5" }} fill="#3DD6F5" />
          <span className="text-xs font-semibold tracking-wide" style={{ color: "#3DD6F5" }}>
            Launch Offer Active — Free Singapore Trip
          </span>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#3DD6F5" }} />
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl font-black leading-tight mb-6" style={{ fontFamily: "'Orbitron', sans-serif" }}>
          <span style={{ color: "rgba(200,240,255,0.92)" }}>Grow Your Wealth</span>
          <br />
          <span style={{
            background: "linear-gradient(135deg, #a8edff 0%, #3DD6F5 40%, #a8edff 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: "drop-shadow(0 0 30px rgba(61,214,245,0.35))",
          }}>
            URANUS TRADES
          </span>
        </h1>

        {/* Subtext */}
        <p className="text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: "rgba(168,237,255,0.55)" }}>
          10+ years of expertise in Real Estate, Stocks, Forex & Crypto — now opening our investment platform to the public.
          Earn up to <strong style={{ color: "#3DD6F5" }}>0.8% daily returns</strong> with a proven multi-level commission structure.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register">
            <button
              className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-base transition-all hover:brightness-110 hover:scale-[1.02] w-full sm:w-auto"
              style={{
                background: "linear-gradient(135deg, #3DD6F5, #2AB3CF)",
                color: "#010810",
                boxShadow: "0 0 30px rgba(61,214,245,0.30), 0 4px 16px rgba(0,0,0,0.4)",
              }}
            >
              Start Investing Now
              <ArrowRight size={16} />
            </button>
          </Link>
          <Link href="/login">
            <button
              data-testid="button-login-hero"
              className="px-8 py-3.5 rounded-xl font-semibold text-base transition-all hover:brightness-125 w-full sm:w-auto"
              style={{
                background: "rgba(61,214,245,0.06)",
                border: "1px solid rgba(61,214,245,0.22)",
                color: "rgba(168,237,255,0.80)",
              }}
            >
              Sign In
            </button>
          </Link>
        </div>
      </section>

      {/* ── Markets ───────────────────────────────────────────── */}
      <section className="relative z-10 px-4 pb-20 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <div className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "rgba(61,214,245,0.5)" }}>
            Where We Trade
          </div>
          <h2 className="text-2xl sm:text-3xl font-black" style={{ fontFamily: "'Orbitron', sans-serif", color: "rgba(200,240,255,0.90)" }}>
            Diversified Across 4 Markets
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <FeatureCard icon={Building2} title="Real Estate" desc="Institutional-grade property investments across high-growth markets." color="#3DD6F5" />
          <FeatureCard icon={BarChart2} title="Stocks" desc="Curated equity portfolios managed by experienced analysts." color="#a8edff" />
          <FeatureCard icon={TrendingUp} title="Forex" desc="24/7 currency trading with advanced risk management strategies." color="#34d399" />
          <FeatureCard icon={Coins} title="Crypto" desc="Capitalizing on digital asset volatility with disciplined entries." color="#b87fff" />
        </div>
      </section>

      {/* ── Why choose us ─────────────────────────────────────── */}
      <section className="relative z-10 px-4 pb-20 max-w-6xl mx-auto">
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: Shield, title: "Secured Platform", desc: "Multi-layer authentication, encrypted wallets, and 24/7 monitoring to keep your assets safe.", color: "#3DD6F5" },
            { icon: Users, title: "Referral Commissions", desc: "Earn on 8 levels of referrals — 5% spot commission plus tiered level rewards up through your network.", color: "#34d399" },
            { icon: Zap, title: "Daily Payouts", desc: "Returns distributed every business day. Withdraw anytime with a 24–48h processing window.", color: "#b87fff" },
          ].map(c => (
            <FeatureCard key={c.title} icon={c.icon} title={c.title} desc={c.desc} color={c.color} />
          ))}
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────── */}
      <section className="relative z-10 px-4 pb-24 max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "rgba(61,214,245,0.5)" }}>
            Simple Process
          </div>
          <h2 className="text-2xl sm:text-3xl font-black" style={{ fontFamily: "'Orbitron', sans-serif", color: "rgba(200,240,255,0.90)" }}>
            Start in 3 Steps
          </h2>
        </div>

        <div
          className="rounded-2xl p-6 sm:p-8"
          style={{
            background: "rgba(5,18,32,0.65)",
            backdropFilter: "blur(14px)",
            border: "1px solid rgba(61,214,245,0.13)",
          }}
        >
          <div className="max-w-md mx-auto">
            <Step n={1} title="Create Your Account" desc="Sign up in minutes. Verify your email and complete a quick profile setup." />
            <Step n={2} title="Deposit & Invest" desc="Fund your wallet with USDT (min. $100) and choose your investment plan." />
            <Step n={3} title="Earn Daily Returns" desc="Sit back and collect 0.6%–0.8% every business day. Refer friends to unlock additional commission levels." />
          </div>

          {/* Investment highlights */}
          <div className="mt-6 pt-6 border-t border-[rgba(61,214,245,0.10)] grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              "Min. $100 investment",
              "5% referral bonus",
              "8 commission levels",
              "BEP20 USDT withdrawals",
              "No lock-in period",
              "Weekday daily returns",
            ].map(item => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle size={13} style={{ color: "#34d399", shrink: 0 }} />
                <span className="text-xs" style={{ color: "rgba(168,237,255,0.55)" }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust / Certificate ───────────────────────────────── */}
      <section className="relative z-10 px-4 pb-20 max-w-4xl mx-auto">
        <div
          className="rounded-2xl px-6 py-5 flex flex-col sm:flex-row items-center gap-5"
          style={{
            background: "rgba(5,18,32,0.65)",
            backdropFilter: "blur(14px)",
            border: "1px solid rgba(61,214,245,0.13)",
          }}
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(61,214,245,0.10)", border: "1px solid rgba(61,214,245,0.25)" }}
          >
            <FileText size={22} style={{ color: "#3DD6F5" }} />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="font-bold text-sm mb-1" style={{ color: "rgba(200,240,255,0.90)" }}>
              Officially Registered Company
            </div>
            <div className="text-xs" style={{ color: "rgba(168,237,255,0.45)" }}>
              URANUS INVESTMENT LTD · Company No. 14309852 · Incorporated in England & Wales
            </div>
          </div>
          <button
            onClick={() => setShowCert(true)}
            className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all hover:brightness-125"
            style={{
              background: "rgba(61,214,245,0.10)",
              border: "1px solid rgba(61,214,245,0.28)",
              color: "#3DD6F5",
            }}
          >
            <FileText size={13} />
            View Certificate
          </button>
        </div>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────────── */}
      <section className="relative z-10 px-4 pb-20 max-w-3xl mx-auto text-center">
        <div
          className="rounded-3xl px-6 py-12"
          style={{
            background: "linear-gradient(170deg, rgba(61,214,245,0.07) 0%, rgba(5,18,32,0.80) 100%)",
            border: "1px solid rgba(61,214,245,0.20)",
            boxShadow: "0 0 80px rgba(61,214,245,0.06)",
          }}
        >
          <h2
            className="text-2xl sm:text-3xl font-black mb-4"
            style={{
              fontFamily: "'Orbitron', sans-serif",
              background: "linear-gradient(135deg, #a8edff, #3DD6F5)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Ready to Start Earning?
          </h2>
          <p className="text-sm mb-8 max-w-md mx-auto" style={{ color: "rgba(168,237,255,0.50)" }}>
            Join the URANUS TRADES platform today and put your money to work across global markets.
          </p>
          <Link href="/register">
            <button
              className="inline-flex items-center gap-2 px-10 py-3.5 rounded-xl font-bold text-base transition-all hover:brightness-110 hover:scale-[1.02]"
              style={{
                background: "linear-gradient(135deg, #3DD6F5, #2AB3CF)",
                color: "#010810",
                boxShadow: "0 0 30px rgba(61,214,245,0.30), 0 4px 16px rgba(0,0,0,0.4)",
              }}
            >
              Create Free Account
              <ArrowRight size={16} />
            </button>
          </Link>
        </div>
      </section>

      {/* ── Certificate Modal ─────────────────────────────────── */}
      {showCert && <CertificateModal onClose={() => setShowCert(false)} />}

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer
        className="relative z-10 px-6 py-8 max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{ borderTop: "1px solid rgba(61,214,245,0.08)" }}
      >
        <div
          className="text-sm font-black tracking-wider"
          style={{
            fontFamily: "'Orbitron', sans-serif",
            background: "linear-gradient(135deg, #a8edff, #3DD6F5)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          URANUS
        </div>
        <div className="flex items-center gap-5 text-xs" style={{ color: "rgba(168,237,255,0.35)" }}>
          <Link href="/terms"><span className="hover:text-teal-300 transition-colors cursor-pointer">Terms & Conditions</span></Link>
          <Link href="/privacy"><span className="hover:text-teal-300 transition-colors cursor-pointer">Privacy Policy</span></Link>
        </div>
        <div className="text-xs" style={{ color: "rgba(168,237,255,0.25)" }}>
          © {new Date().getFullYear()} URANUS TRADES. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
