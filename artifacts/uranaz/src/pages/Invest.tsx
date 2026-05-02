import { useState } from "react";
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

export default function Invest() {
  const [selectedTier, setSelectedTier] = useState<string>("tier2");
  const createInvestment = useCreateInvestment();
  const { data: investments } = useListInvestments();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const plan = plans.find(p => p.tier === selectedTier)!;

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { amount: 500, hyperCoinAmount: 250, usdtAmount: 250 },
  });

  const watchedAmount = form.watch("amount");
  const dailyEarning = watchedAmount * plan.rate;
  const totalReturn = dailyEarning * plan.days;

  const handleAmountChange = (val: number) => {
    const hypercoin = Math.ceil(val * 0.5);
    form.setValue("amount", val);
    form.setValue("hyperCoinAmount", hypercoin);
    form.setValue("usdtAmount", val - hypercoin);
  };

  const onSubmit = async (data: z.infer<typeof schema>) => {
    try {
      await createInvestment.mutateAsync({ data });
      await queryClient.invalidateQueries({ queryKey: getListInvestmentsQueryKey() });
      toast({ title: "Investment created!", description: `$${data.amount} invested successfully` });
      form.reset({ amount: 500, hyperCoinAmount: 250, usdtAmount: 250 });
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
        <div
          className="flex items-start gap-2 rounded-lg p-3 mb-4"
          style={{
            background: "rgba(61,214,245,0.05)",
            border: "1px solid rgba(61,214,245,0.14)",
          }}
        >
          <Info size={14} className="shrink-0 mt-0.5" style={{ color: TEAL }} />
          <p className="text-xs" style={{ color: "rgba(168,237,255,0.5)" }}>
            Minimum 50% must be HYPERCOIN. Payouts every weekday (5 days/week).
          </p>
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
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="hyperCoinAmount" render={({ field }) => (
                <FormItem>
                  <FormLabel style={{ color: "rgba(168,237,255,0.65)", fontSize: "0.8rem" }}>HYPERCOIN (min 50%)</FormLabel>
                  <FormControl><Input data-testid="input-hypercoin" type="number" {...field} style={{ background: "rgba(0,20,40,0.6)", border: "1px solid rgba(61,214,245,0.18)", color: "rgba(168,237,255,0.9)" }} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="usdtAmount" render={({ field }) => (
                <FormItem>
                  <FormLabel style={{ color: "rgba(168,237,255,0.65)", fontSize: "0.8rem" }}>USDT Amount</FormLabel>
                  <FormControl><Input data-testid="input-usdt" type="number" {...field} style={{ background: "rgba(0,20,40,0.6)", border: "1px solid rgba(61,214,245,0.18)", color: "rgba(168,237,255,0.9)" }} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
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
                <div className="flex justify-between text-xs mb-2" style={{ color: "rgba(168,237,255,0.4)" }}>
                  <span>Earned: <span style={{ color: "rgba(168,237,255,0.8)", fontWeight: 600 }}>${inv.earnedSoFar.toFixed(2)}</span></span>
                  <span>{inv.remainingDays} days left</span>
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
