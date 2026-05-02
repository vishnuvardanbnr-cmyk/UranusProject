import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateInvestment, useListInvestments, getListInvestmentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { TrendingUp, Info } from "lucide-react";

const TEAL = "#3DD6F5";
const GLASS = {
  background: "rgba(5,18,32,0.65)",
  backdropFilter: "blur(14px)",
  border: "1px solid rgba(61,214,245,0.12)",
} as const;

const plans = [
  { tier: "tier1", range: "$100 – $400",       rate: 0.006, days: 300, label: "0.6% Daily", min: 100,  max: 400  },
  { tier: "tier2", range: "$500 – $900",       rate: 0.007, days: 260, label: "0.7% Daily", min: 500,  max: 900,  popular: true },
  { tier: "tier3", range: "$1,000 – $1,500",   rate: 0.008, days: 225, label: "0.8% Daily", min: 1000, max: 1500 },
];

const schema = z.object({
  amount: z.coerce.number().min(100).max(1500),
  hyperCoinAmount: z.coerce.number().min(0),
  usdtAmount: z.coerce.number().min(0),
});

export default function Invest({ user }: { user: any }) {
  const [selectedTier, setSelectedTier] = useState<string>("tier2");
  const [hyperCoinMinPercent, setHyperCoinMinPercent] = useState<number>(50);
  const createInvestment = useCreateInvestment();
  const { data: investments } = useListInvestments();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch live admin-configured HYPERCOIN minimum %
  useEffect(() => {
    fetch("/api/settings/public")
      .then(r => r.json())
      .then(d => {
        if (typeof d.hyperCoinMinPercent === "number") {
          setHyperCoinMinPercent(d.hyperCoinMinPercent);
        }
      })
      .catch(() => {});
  }, []);

  const plan = plans.find(p => p.tier === selectedTier)!;

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { amount: 500, hyperCoinAmount: 250, usdtAmount: 250 },
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
      const defaultHyper = Math.ceil(500 * (hyperCoinMinPercent / 100));
      form.reset({ amount: 500, hyperCoinAmount: defaultHyper, usdtAmount: 500 - defaultHyper });
    } catch (err: any) {
      toast({ title: "Investment failed", description: err?.message || "Please try again", variant: "destructive" });
    }
  };

  const activeInvestments = investments?.filter(i => i.status === "active") || [];

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

        {/* Info banner */}
        <div
          className="flex items-start gap-2 rounded-lg p-3 mb-4"
          style={{
            background: "rgba(61,214,245,0.05)",
            border: "1px solid rgba(61,214,245,0.14)",
          }}
        >
          <Info size={14} className="shrink-0 mt-0.5" style={{ color: TEAL }} />
          <p className="text-xs" style={{ color: "rgba(168,237,255,0.5)" }}>
            {hyperEnabled
              ? <>Minimum <span style={{ color: TEAL, fontWeight: 700 }}>{hyperCoinMinPercent}%</span> must be HYPERCOIN. Payouts every weekday (5 days/week).</>
              : <>Payouts every weekday (5 days/week).</>
            }
          </p>
        </div>

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

      {/* Plan Tiers */}
      <div>
        <h2 className="font-semibold text-sm mb-3" style={{ color: "rgba(168,237,255,0.75)" }}>Select Plan</h2>
        <div className="space-y-2">
          {plans.map(p => (
            <button
              key={p.tier}
              onClick={() => {
                setSelectedTier(p.tier);
                handleAmountChange(p.min);
              }}
              className="w-full rounded-xl px-4 py-3 flex items-center justify-between transition-all"
              style={selectedTier === p.tier ? {
                background: "rgba(61,214,245,0.10)",
                border: "1px solid rgba(61,214,245,0.35)",
              } : {
                ...GLASS,
                opacity: 0.75,
              }}
            >
              <div className="text-left">
                <div className="font-semibold text-sm" style={{ color: "rgba(168,237,255,0.85)" }}>{p.range}</div>
                <div className="text-xs mt-0.5" style={{ color: "rgba(168,237,255,0.4)" }}>{p.days} days</div>
              </div>
              <div className="flex items-center gap-2">
                {p.popular && (
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(61,214,245,0.15)", color: TEAL }}>Popular</span>
                )}
                <span className="font-bold text-sm" style={{ color: TEAL }}>{p.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Active Investments */}
      {activeInvestments.length > 0 && (
        <div>
          <h2 className="font-semibold text-sm mb-3" style={{ color: "rgba(168,237,255,0.75)" }}>
            Your Active Investments
          </h2>
          <div className="space-y-3">
            {activeInvestments.map(inv => (
              <div
                key={inv.id}
                data-testid={`card-investment-${inv.id}`}
                className="rounded-xl p-4"
                style={GLASS}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="font-semibold" style={{ color: "rgba(168,237,255,0.85)" }}>
                    ${inv.amount.toFixed(2)}
                  </div>
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
                <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                  <div style={{ color: "rgba(168,237,255,0.4)" }}>
                    Earned: <span style={{ color: "rgba(168,237,255,0.8)", fontWeight: 600 }}>${inv.earnedSoFar.toFixed(2)}</span>
                  </div>
                  <div className="text-right" style={{ color: "rgba(168,237,255,0.4)" }}>{inv.remainingDays} days left</div>
                  <div style={{ color: "rgba(168,100,255,0.6)" }}>HC: ${inv.hyperCoinAmount.toFixed(2)}</div>
                  <div className="text-right" style={{ color: "rgba(61,214,245,0.6)" }}>USDT: ${inv.usdtAmount.toFixed(2)}</div>
                </div>
                <div className="w-full rounded-full h-1.5" style={{ background: "rgba(61,214,245,0.08)" }}>
                  <div
                    className="h-1.5 rounded-full uranus-progress"
                    style={{ width: `${Math.max(2, ((inv.durationDays - inv.remainingDays) / inv.durationDays) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
