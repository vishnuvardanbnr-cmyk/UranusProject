import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateInvestment, useListInvestments, getListInvestmentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { TrendingUp, CheckCircle, Info } from "lucide-react";

const plans = [
  { tier: "tier1", range: "$100 – $400", rate: 0.006, days: 300, label: "0.6% Daily", min: 100, max: 400 },
  { tier: "tier2", range: "$500 – $900", rate: 0.007, days: 260, label: "0.7% Daily", min: 500, max: 900, popular: true },
  { tier: "tier3", range: "$1,000 – $1,500", rate: 0.008, days: 225, label: "0.8% Daily", min: 1000, max: 1500 },
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
    const usdt = val - hypercoin;
    form.setValue("amount", val);
    form.setValue("hyperCoinAmount", hypercoin);
    form.setValue("usdtAmount", usdt);
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
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-6 pb-24 md:pb-6">
      <h1 className="text-xl font-bold">Investment Plans</h1>

      {/* Plan Selector */}
      <div className="grid grid-cols-3 gap-2">
        {plans.map(p => (
          <button
            key={p.tier}
            data-testid={`button-select-${p.tier}`}
            onClick={() => setSelectedTier(p.tier)}
            className={`relative rounded-xl p-3 text-center transition-all ${
              selectedTier === p.tier
                ? "bg-primary/10 border-2 border-primary"
                : "bg-card border border-border hover:border-primary/30"
            }`}
          >
            {p.popular && (
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                BEST
              </div>
            )}
            <div className="text-primary font-bold text-base">{p.label}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{p.range}</div>
            <div className="text-xs text-muted-foreground">{p.days} days</div>
          </button>
        ))}
      </div>

      {/* Calculator */}
      <div className="bg-gradient-to-br from-primary/10 to-amber-700/5 border border-primary/20 rounded-2xl p-5">
        <h2 className="font-semibold text-sm mb-4">Investment Calculator</h2>
        <div className="mb-4">
          <label className="text-xs text-muted-foreground mb-1.5 block">Amount (multiples of $100)</label>
          <div className="flex gap-2">
            {[plan.min, Math.round((plan.min + plan.max) / 200) * 100, plan.max].map(v => (
              <button
                key={v}
                onClick={() => handleAmountChange(v)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                  watchedAmount === v ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-foreground hover:border-primary/40"
                }`}
              >
                ${v}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-background/50 rounded-xl p-3">
            <div className="text-xs text-muted-foreground">Daily Return</div>
            <div className="font-bold text-primary text-sm mt-0.5">${dailyEarning.toFixed(2)}</div>
          </div>
          <div className="bg-background/50 rounded-xl p-3">
            <div className="text-xs text-muted-foreground">Duration</div>
            <div className="font-bold text-sm mt-0.5">{plan.days} days</div>
          </div>
          <div className="bg-background/50 rounded-xl p-3">
            <div className="text-xs text-muted-foreground">Total Return</div>
            <div className="font-bold text-primary text-sm mt-0.5">${totalReturn.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Invest Form */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h2 className="font-semibold text-sm mb-4">New Investment</h2>
        <div className="flex items-start gap-2 bg-primary/5 border border-primary/20 rounded-lg p-3 mb-4">
          <Info size={14} className="text-primary mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">Minimum 50% must be HYPERCOIN. Payouts every weekday (5 days/week).</p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="amount" render={({ field }) => (
              <FormItem>
                <FormLabel>Total Amount (USDT)</FormLabel>
                <FormControl>
                  <Input
                    data-testid="input-amount"
                    type="number"
                    step="100"
                    min={plan.min}
                    max={plan.max}
                    {...field}
                    onChange={e => handleAmountChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="hyperCoinAmount" render={({ field }) => (
                <FormItem>
                  <FormLabel>HYPERCOIN (min 50%)</FormLabel>
                  <FormControl><Input data-testid="input-hypercoin" type="number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="usdtAmount" render={({ field }) => (
                <FormItem>
                  <FormLabel>USDT Amount</FormLabel>
                  <FormControl><Input data-testid="input-usdt" type="number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <button
              data-testid="button-submit-invest"
              type="submit"
              disabled={createInvestment.isPending}
              className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {createInvestment.isPending ? "Processing..." : `Invest $${watchedAmount || 0}`}
            </button>
          </form>
        </Form>
      </div>

      {/* Active Investments */}
      {activeInvestments.length > 0 && (
        <div>
          <h2 className="font-semibold text-sm mb-3">Your Active Investments</h2>
          <div className="space-y-3">
            {activeInvestments.map(inv => (
              <div key={inv.id} data-testid={`card-investment-${inv.id}`} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-semibold">${inv.amount.toFixed(2)}</div>
                  <span className="bg-primary/10 text-primary text-xs px-2.5 py-0.5 rounded-full font-medium">
                    +{(inv.dailyRate * 100).toFixed(1)}%/day
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  <span>Earned: <span className="text-foreground font-medium">${inv.earnedSoFar.toFixed(2)}</span></span>
                  <span>{inv.remainingDays} days left</span>
                </div>
                <div className="w-full bg-background rounded-full h-1.5">
                  <div
                    className="bg-primary h-1.5 rounded-full transition-all"
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
