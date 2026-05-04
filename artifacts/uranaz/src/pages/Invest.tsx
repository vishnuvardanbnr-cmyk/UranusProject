import { useState, useEffect } from "react";
import Pagination from "@/components/Pagination";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateInvestment, useListInvestments, getListInvestmentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { TrendingUp, X, Calendar, DollarSign, Percent, Timer, Hash, TrendingDown, AlertTriangle, Snowflake } from "lucide-react";

const COOLING_HOURS = 24;

function getCoolingInfo(createdAt: string) {
  const msElapsed = Date.now() - new Date(createdAt).getTime();
  const msTotal   = COOLING_HOURS * 3_600_000;
  const msLeft    = msTotal - msElapsed;
  if (msLeft <= 0) return null;
  const h = Math.floor(msLeft / 3_600_000);
  const m = Math.floor((msLeft % 3_600_000) / 60_000);
  return { h, m, endsAt: new Date(new Date(createdAt).getTime() + msTotal) };
}

const TEAL = "#3DD6F5";

/* ── Investment Detail Modal ── */
function InvestmentDetailModal({ inv, hyperEnabled, onClose }: { inv: any; hyperEnabled: boolean; onClose: () => void }) {
  const progress = Math.max(2, ((inv.durationDays - inv.remainingDays) / inv.durationDays) * 100);
  const planLabels: Record<string, string> = {
    tier1: "Starter — 0.6%/day · 300 days",
    tier2: "Growth  — 0.7%/day · 260 days",
    tier3: "Premium — 0.8%/day · 225 days",
  };
  const totalExpected = inv.amount * inv.dailyRate * inv.durationDays;
  const daysElapsed = inv.durationDays - inv.remainingDays;

  const cooling = getCoolingInfo(inv.createdAt);

  const rows = [
    { icon: Hash,        label: "Investment ID",    value: `#${String(inv.id).padStart(6, "0")}` },
    { icon: Calendar,    label: "Plan",             value: planLabels[inv.planTier] ?? inv.planTier },
    { icon: Calendar,    label: "Start Date",       value: new Date(inv.startDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) },
    { icon: Calendar,    label: "End Date",         value: new Date(inv.endDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) },
    { icon: Timer,       label: "Duration",         value: `${inv.durationDays} days total` },
    { icon: Timer,       label: "Days Elapsed",     value: `${daysElapsed} days` },
    { icon: Timer,       label: "Days Remaining",   value: `${inv.remainingDays} days` },
    { icon: DollarSign,  label: "Total Invested",   value: `$${inv.amount.toFixed(2)}` },
    ...(hyperEnabled ? [
      { icon: DollarSign, label: "HYPERCOIN",       value: `$${inv.hyperCoinAmount.toFixed(2)}` },
      { icon: DollarSign, label: "USDT",            value: `$${inv.usdtAmount.toFixed(2)}` },
    ] : []),
    { icon: Percent,     label: "Daily Rate",       value: `${(inv.dailyRate * 100).toFixed(1)}%` },
    { icon: TrendingUp,  label: "Earned So Far",    value: `$${inv.earnedSoFar.toFixed(2)}` },
    { icon: TrendingDown, label: "Expected Total",  value: `$${totalExpected.toFixed(2)}` },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3"
      style={{ background: "rgba(1,8,16,0.92)", backdropFilter: "blur(12px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(170deg, rgba(4,16,32,0.99) 0%, rgba(2,10,22,0.99) 100%)",
          border: "1px solid rgba(61,214,245,0.18)",
          boxShadow: "0 8px 60px rgba(1,8,16,0.9)",
          maxHeight: "90dvh",
          overflowY: "auto",
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, transparent, ${TEAL}, transparent)` }} />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, rgba(61,214,245,0.18), rgba(61,214,245,0.06))", border: "1px solid rgba(61,214,245,0.28)" }}
            >
              <TrendingUp size={17} style={{ color: TEAL }} />
            </div>
            <div>
              <div className="font-bold tracking-wide" style={{ color: "rgba(200,240,255,0.92)", fontFamily: "'Orbitron', sans-serif", fontSize: "0.8rem" }}>
                Investment Details
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: TEAL, boxShadow: `0 0 6px ${TEAL}` }} />
                <span className="text-xs font-semibold" style={{ color: TEAL }}>Active</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(168,237,255,0.06)", border: "1px solid rgba(168,237,255,0.09)" }}
          >
            <X size={14} style={{ color: "rgba(168,237,255,0.45)" }} />
          </button>
        </div>

        {/* Amount hero */}
        <div
          className="mx-5 mb-4 rounded-2xl py-4 text-center"
          style={{ background: "linear-gradient(135deg, rgba(61,214,245,0.08), rgba(42,179,215,0.03))", border: "1px solid rgba(61,214,245,0.18)" }}
        >
          <div className="text-xs mb-1 uppercase tracking-widest" style={{ color: "rgba(168,237,255,0.35)" }}>Total Invested</div>
          <div className="font-black" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "2rem", color: TEAL, textShadow: `0 0 24px ${TEAL}50` }}>
            ${inv.amount.toFixed(2)}
          </div>
          <div className="text-xs mt-1" style={{ color: "rgba(168,237,255,0.4)" }}>+{(inv.dailyRate * 100).toFixed(1)}% per day</div>
        </div>

        {/* Cooling period banner */}
        {cooling && (
          <div
            className="mx-5 mb-4 flex items-start gap-2.5 px-4 py-3 rounded-xl"
            style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.3)" }}
          >
            <Snowflake size={14} className="shrink-0 mt-0.5" style={{ color: "rgba(251,191,36,0.9)" }} />
            <div>
              <div className="text-xs font-bold mb-0.5" style={{ color: "rgba(251,191,36,0.9)" }}>
                24h Cooling Period — {cooling.h}h {cooling.m}m remaining
              </div>
              <div className="text-xs leading-relaxed" style={{ color: "rgba(251,191,36,0.65)" }}>
                ROI and level commissions will not be distributed during this period. First payout after{" "}
                <strong style={{ color: "rgba(251,191,36,0.85)" }}>
                  {cooling.endsAt.toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                </strong>.
              </div>
            </div>
          </div>
        )}

        {/* Progress bar */}
        <div className="px-5 mb-4">
          <div className="flex justify-between text-xs mb-1.5" style={{ color: "rgba(168,237,255,0.4)" }}>
            <span>Progress</span>
            <span>{progress.toFixed(1)}%</span>
          </div>
          <div className="w-full rounded-full h-2" style={{ background: "rgba(61,214,245,0.08)" }}>
            <div className="h-2 rounded-full uranus-progress" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between text-xs mt-1" style={{ color: "rgba(168,237,255,0.28)" }}>
            <span>Day {daysElapsed}</span>
            <span>Day {inv.durationDays}</span>
          </div>
        </div>

        <div className="mx-5 h-px mb-1" style={{ background: "rgba(61,214,245,0.07)" }} />

        {/* Detail rows */}
        <div className="px-5 pb-6">
          {rows.map((row, i) => (
            <div
              key={row.label}
              className="flex items-center justify-between py-3"
              style={{ borderBottom: i < rows.length - 1 ? "1px solid rgba(61,214,245,0.05)" : "none" }}
            >
              <div className="flex items-center gap-2.5">
                <row.icon size={12} style={{ color: "rgba(168,237,255,0.28)" }} />
                <span className="text-xs" style={{ color: "rgba(168,237,255,0.42)" }}>{row.label}</span>
              </div>
              <span
                className="text-xs font-semibold"
                style={{
                  color: row.label === "Earned So Far" ? "#34d399"
                    : row.label === "HYPERCOIN" ? "#b87fff"
                    : row.label === "Expected Total" ? "rgba(168,237,255,0.6)"
                    : "rgba(200,240,255,0.85)",
                  fontFamily: row.label === "Investment ID" ? "monospace" : "inherit",
                }}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
/* ── Max Investment Limit Modal ── */
function MaxInvestmentModal({
  currentTotal,
  remaining,
  onClose,
}: {
  currentTotal: number;
  remaining: number;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(1,8,16,0.92)", backdropFilter: "blur(12px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(170deg, rgba(4,16,32,0.99) 0%, rgba(2,10,22,0.99) 100%)",
          border: "1px solid rgba(255,100,100,0.25)",
          boxShadow: "0 8px 60px rgba(1,8,16,0.9)",
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, transparent, #ff6464, transparent)" }} />

        <div className="p-6 text-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(255,100,100,0.1)", border: "1px solid rgba(255,100,100,0.25)" }}
          >
            <AlertTriangle size={26} style={{ color: "#ff6464" }} />
          </div>

          <h2
            className="font-bold text-base mb-2"
            style={{ fontFamily: "'Orbitron', sans-serif", color: "rgba(200,240,255,0.92)" }}
          >
            Investment Limit Reached
          </h2>
          <p className="text-sm mb-5" style={{ color: "rgba(168,237,255,0.5)" }}>
            The maximum total investment per account is{" "}
            <span style={{ color: "#ff6464", fontWeight: 700 }}>$2,000</span>.
          </p>

          <div
            className="rounded-2xl p-4 mb-5 text-left space-y-3"
            style={{ background: "rgba(255,100,100,0.05)", border: "1px solid rgba(255,100,100,0.15)" }}
          >
            <div className="flex justify-between text-sm">
              <span style={{ color: "rgba(168,237,255,0.45)" }}>Currently Active</span>
              <span style={{ color: "rgba(200,240,255,0.85)", fontWeight: 600 }}>${currentTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: "rgba(168,237,255,0.45)" }}>Maximum Allowed</span>
              <span style={{ color: "rgba(200,240,255,0.85)", fontWeight: 600 }}>$2,000.00</span>
            </div>
            <div className="h-px" style={{ background: "rgba(255,100,100,0.12)" }} />
            <div className="flex justify-between text-sm">
              <span style={{ color: "rgba(168,237,255,0.45)" }}>You Can Still Invest</span>
              <span style={{ color: remaining > 0 ? TEAL : "#ff6464", fontWeight: 700 }}>
                {remaining > 0 ? `$${remaining.toFixed(2)}` : "Nothing"}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl font-bold text-sm"
            style={{
              background: "rgba(61,214,245,0.1)",
              border: "1px solid rgba(61,214,245,0.2)",
              color: TEAL,
            }}
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}

const GLASS = {
  background: "rgba(5,18,32,0.65)",
  backdropFilter: "blur(14px)",
  border: "1px solid rgba(61,214,245,0.12)",
} as const;

const DEFAULT_PLANS = [
  { tier: "tier1", range: "$100 – $400",     rate: 0.005, days: 360, label: "0.5% Daily", min: 100,  max: 400  },
  { tier: "tier2", range: "$500 – $900",     rate: 0.0055, days: 328, label: "0.55% Daily", min: 500,  max: 900,  popular: true },
  { tier: "tier3", range: "$1,000 – $1,500", rate: 0.006, days: 300, label: "0.6% Daily", min: 1000, max: 1500 },
];

function buildPlans(apiPlans: any) {
  if (!apiPlans) return DEFAULT_PLANS;
  return [
    { tier: "tier1", range: "$100 – $400",     rate: apiPlans.tier1.dailyRate, days: apiPlans.tier1.days, label: `${(apiPlans.tier1.dailyRate * 100).toFixed(2)}% Daily`, min: 100,  max: 400  },
    { tier: "tier2", range: "$500 – $900",     rate: apiPlans.tier2.dailyRate, days: apiPlans.tier2.days, label: `${(apiPlans.tier2.dailyRate * 100).toFixed(2)}% Daily`, min: 500,  max: 900, popular: true },
    { tier: "tier3", range: "$1,000 – $1,500", rate: apiPlans.tier3.dailyRate, days: apiPlans.tier3.days, label: `${(apiPlans.tier3.dailyRate * 100).toFixed(2)}% Daily`, min: 1000, max: 1500 },
  ];
}

const schema = z.object({
  amount: z.coerce.number().min(100).max(1500),
  hyperCoinAmount: z.coerce.number().min(0),
  usdtAmount: z.coerce.number().min(0),
});

export default function Invest({ user }: { user: any }) {
  const [selectedInvestment, setSelectedInvestment] = useState<any>(null);
  const [selectedTier, setSelectedTier] = useState<string>("tier1");
  const [limitModal, setLimitModal] = useState<{ currentTotal: number; remaining: number } | null>(null);
  const [hyperCoinMinPercent, setHyperCoinMinPercent] = useState<number>(50);
  const [plans, setPlans] = useState(DEFAULT_PLANS);
  const createInvestment = useCreateInvestment();
  const { data: investments } = useListInvestments();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch live admin-configured settings (rates, days, HC min %)
  useEffect(() => {
    fetch("/api/settings/public")
      .then(r => r.json())
      .then(d => {
        if (typeof d.hyperCoinMinPercent === "number") {
          setHyperCoinMinPercent(d.hyperCoinMinPercent);
        }
        if (d.plans) {
          setPlans(buildPlans(d.plans));
        }
      })
      .catch(() => {});
  }, []);

  const plan = plans.find(p => p.tier === selectedTier) ?? plans[0];

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { amount: 100, hyperCoinAmount: 50, usdtAmount: 50 },
  });

  const watchedAmount = form.watch("amount");
  const dailyEarning = watchedAmount * plan.rate;
  const totalReturn = dailyEarning * plan.days;

  const hyperEnabled = hyperCoinMinPercent > 0;

  const handleAmountChange = (val: number) => {
    const hypercoin = hyperEnabled ? Math.ceil(val * (hyperCoinMinPercent / 100)) : 0;
    form.setValue("amount", val);
    form.setValue("hyperCoinAmount", hypercoin);
    form.setValue("usdtAmount", val - hypercoin);
  };

  // Update split whenever hyperCoinMinPercent loads
  useEffect(() => {
    const val = form.getValues("amount");
    const hypercoin = hyperEnabled ? Math.ceil(val * (hyperCoinMinPercent / 100)) : 0;
    form.setValue("hyperCoinAmount", hypercoin);
    form.setValue("usdtAmount", val - hypercoin);
  }, [hyperCoinMinPercent]);

  const usdtBalance = user?.walletBalance ?? 0;
  const hyperBalance = user?.hyperCoinBalance ?? 0;

  const onSubmit = async (data: z.infer<typeof schema>) => {
    try {
      await createInvestment.mutateAsync({ data });
      await queryClient.invalidateQueries({ queryKey: getListInvestmentsQueryKey() });
      toast({ title: "Investment created!", description: `$${data.amount} invested successfully` });
      const defaultHyper = Math.ceil(100 * (hyperCoinMinPercent / 100));
      form.reset({ amount: 100, hyperCoinAmount: defaultHyper, usdtAmount: 100 - defaultHyper });
      setSelectedTier("tier1");
    } catch (err: any) {
      const data = err?.data;
      if (data?.code === "MAX_INVESTMENT_EXCEEDED") {
        setLimitModal({
          currentTotal: data.currentTotal ?? 0,
          remaining: data.remaining ?? 0,
        });
        return;
      }
      toast({ title: "Investment failed", description: data?.message || err?.message || "Please try again", variant: "destructive" });
    }
  };

  const activeInvestments = investments?.filter(i => i.status === "active") || [];
  const INVEST_PAGE_SIZE = 5;
  const [investPage, setInvestPage] = useState(1);
  const totalInvestPages = Math.max(1, Math.ceil(activeInvestments.length / INVEST_PAGE_SIZE));
  const paginatedInvestments = activeInvestments.slice((investPage - 1) * INVEST_PAGE_SIZE, investPage * INVEST_PAGE_SIZE);

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-6 pb-24 md:pb-8">
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
        Investment Plans
      </h1>

      {/* Invest Form */}
      <div className="rounded-2xl p-5" style={{ ...GLASS, backdropFilter: "blur(14px)" }}>
        <h2 className="font-semibold text-sm mb-4" style={{ color: "rgba(168,237,255,0.8)" }}>New Investment</h2>

        {/* Available balances */}
        <div className={`grid gap-2 mb-4 ${hyperEnabled ? "grid-cols-2" : "grid-cols-1"}`}>
          <div className="rounded-lg px-3 py-2" style={{ background: "rgba(61,214,245,0.06)", border: "1px solid rgba(61,214,245,0.12)" }}>
            <div className="text-xs mb-0.5" style={{ color: "rgba(168,237,255,0.4)" }}>USDT Balance</div>
            <div className="font-bold text-sm" style={{ color: TEAL }}>${usdtBalance.toFixed(2)}</div>
          </div>
          {hyperEnabled && (
            <div className="rounded-lg px-3 py-2" style={{ background: "rgba(168,100,255,0.06)", border: "1px solid rgba(168,100,255,0.14)" }}>
              <div className="text-xs mb-0.5" style={{ color: "rgba(168,237,255,0.4)" }}>HYPERCOIN Balance</div>
              <div className="font-bold text-sm" style={{ color: "#b87fff" }}>${hyperBalance.toFixed(2)}</div>
            </div>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="amount" render={({ field }) => (
              <FormItem>
                <FormLabel style={{ color: "rgba(168,237,255,0.65)", fontSize: "0.8rem" }}>Total Amount (USDT)</FormLabel>
                <FormControl>
                  <Input
                    data-testid="input-amount"
                    type="number" step="100" min={plan.min} max={plan.max}
                    {...field}
                    onChange={e => handleAmountChange(Number(e.target.value))}
                    style={{ background: "rgba(0,20,40,0.6)", border: "1px solid rgba(61,214,245,0.18)", color: "rgba(168,237,255,0.9)" }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            {hyperEnabled && (
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="hyperCoinAmount" render={({ field }) => (
                  <FormItem>
                    <FormLabel style={{ color: "rgba(168,237,255,0.65)", fontSize: "0.8rem" }}>
                      HYPERCOIN (min {hyperCoinMinPercent}%)
                    </FormLabel>
                    <FormControl>
                      <Input
                        data-testid="input-hypercoin"
                        type="number"
                        {...field}
                        onChange={e => {
                          const hyper = Number(e.target.value);
                          const total = form.getValues("amount");
                          field.onChange(hyper);
                          form.setValue("usdtAmount", Math.max(0, total - hyper));
                        }}
                        style={{ background: "rgba(0,20,40,0.6)", border: "1px solid rgba(168,100,255,0.25)", color: "rgba(168,237,255,0.9)" }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="usdtAmount" render={({ field }) => (
                  <FormItem>
                    <FormLabel style={{ color: "rgba(168,237,255,0.65)", fontSize: "0.8rem" }}>USDT Amount</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="input-usdt"
                        type="number"
                        {...field}
                        onChange={e => {
                          const usdt = Number(e.target.value);
                          const total = form.getValues("amount");
                          field.onChange(usdt);
                          form.setValue("hyperCoinAmount", Math.max(0, total - usdt));
                        }}
                        style={{ background: "rgba(0,20,40,0.6)", border: "1px solid rgba(61,214,245,0.18)", color: "rgba(168,237,255,0.9)" }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            )}
            <button
              data-testid="button-submit-invest"
              type="submit"
              disabled={createInvestment.isPending}
              className="w-full py-3 rounded-xl font-bold transition-all disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, #3DD6F5, #2AB3CF)",
                color: "#010810",
                letterSpacing: "0.04em",
                boxShadow: "0 0 20px rgba(61,214,245,0.35)",
              }}
            >
              {createInvestment.isPending ? "Processing..." : `Invest $${watchedAmount || 0}`}
            </button>
          </form>
        </Form>
      </div>

      {/* Active Investments */}
      {activeInvestments.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm" style={{ color: "rgba(168,237,255,0.75)" }}>
              Your Active Investments
            </h2>
            <span className="text-xs" style={{ color: "rgba(168,237,255,0.35)" }}>
              {activeInvestments.length} total
            </span>
          </div>
          <div className="space-y-3">
            {paginatedInvestments.map(inv => {
                const cooling = getCoolingInfo(inv.createdAt);
                return (
                  <div
                    key={inv.id}
                    data-testid={`card-investment-${inv.id}`}
                    className="rounded-xl p-4 cursor-pointer active:scale-[0.98] transition-transform"
                    style={{ ...GLASS, userSelect: "none" }}
                    onClick={() => setSelectedInvestment(inv)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-semibold" style={{ color: "rgba(168,237,255,0.85)" }}>
                        ${inv.amount.toFixed(2)}
                      </div>
                      <div className="flex items-center gap-2">
                        {cooling && (
                          <span
                            className="flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-semibold"
                            style={{
                              background: "rgba(251,191,36,0.12)",
                              border: "1px solid rgba(251,191,36,0.35)",
                              color: "rgba(251,191,36,0.9)",
                            }}
                          >
                            <Snowflake size={10} />
                            Cooling {cooling.h}h {cooling.m}m
                          </span>
                        )}
                        <span
                          className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                          style={{
                            background: "rgba(61,214,245,0.10)",
                            border: "1px solid rgba(61,214,245,0.2)",
                            color: TEAL,
                          }}
                        >
                          +{(inv.dailyRate * 100).toFixed(1)}%/day
                        </span>
                      </div>
                    </div>

                    {cooling && (
                      <div
                        className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg text-xs"
                        style={{ background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.2)" }}
                      >
                        <Snowflake size={11} style={{ color: "rgba(251,191,36,0.8)", flexShrink: 0 }} />
                        <span style={{ color: "rgba(251,191,36,0.8)" }}>
                          24h cooling period — ROI &amp; commissions start after{" "}
                          <strong>{cooling.endsAt.toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}</strong>
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                      <div style={{ color: "rgba(168,237,255,0.4)" }}>
                        Earned: <span style={{ color: "rgba(168,237,255,0.8)", fontWeight: 600 }}>${inv.earnedSoFar.toFixed(2)}</span>
                      </div>
                      <div className="text-right" style={{ color: "rgba(168,237,255,0.4)" }}>{inv.remainingDays} days left</div>
                      {hyperEnabled && <div style={{ color: "rgba(168,100,255,0.6)" }}>HC: ${inv.hyperCoinAmount.toFixed(2)}</div>}
                      {hyperEnabled && <div className="text-right" style={{ color: "rgba(61,214,245,0.6)" }}>USDT: ${inv.usdtAmount.toFixed(2)}</div>}
                    </div>
                    <div className="w-full rounded-full h-1.5" style={{ background: "rgba(61,214,245,0.08)" }}>
                      <div
                        className="h-1.5 rounded-full uranus-progress"
                        style={{ width: `${Math.max(2, ((inv.durationDays - inv.remainingDays) / inv.durationDays) * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
          <Pagination
            page={investPage}
            totalPages={totalInvestPages}
            total={activeInvestments.length}
            pageSize={INVEST_PAGE_SIZE}
            onPrev={() => setInvestPage(p => Math.max(1, p - 1))}
            onNext={() => setInvestPage(p => Math.min(totalInvestPages, p + 1))}
          />
        </div>
      )}

      {selectedInvestment && (
        <InvestmentDetailModal
          inv={selectedInvestment}
          hyperEnabled={hyperEnabled}
          onClose={() => setSelectedInvestment(null)}
        />
      )}

      {limitModal && (
        <MaxInvestmentModal
          currentTotal={limitModal.currentTotal}
          remaining={limitModal.remaining}
          onClose={() => setLimitModal(null)}
        />
      )}
    </div>
  );
}
