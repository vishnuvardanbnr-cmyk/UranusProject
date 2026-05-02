import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useListWithdrawals, useCreateWithdrawal, useGetIncomeSummary, getListWithdrawalsQueryKey, getGetIncomeSummaryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Wallet, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

const TEAL = "#3DD6F5";
const GLASS = { background: "rgba(5,18,32,0.65)", backdropFilter: "blur(14px)", border: "1px solid rgba(61,214,245,0.12)" } as const;
const INPUT_STYLE = { background: "rgba(0,20,40,0.6)", border: "1px solid rgba(61,214,245,0.18)", color: "rgba(168,237,255,0.9)" };

const schema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  walletAddress: z.string().min(10, "Valid wallet address required"),
});

const statusConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  pending:  { icon: Clock,        color: "#fbbf24", bg: "rgba(251,191,36,0.10)",   label: "Pending"  },
  approved: { icon: CheckCircle,  color: "#34d399", bg: "rgba(52,211,153,0.10)",   label: "Approved" },
  rejected: { icon: XCircle,      color: "#f87171", bg: "rgba(248,113,113,0.10)",  label: "Rejected" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function Withdrawals({ user }: { user: any }) {
  const { data: withdrawals, isLoading } = useListWithdrawals();
  const { data: summary } = useGetIncomeSummary();
  const createWithdrawal = useCreateWithdrawal();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { amount: 0, walletAddress: user?.walletAddress || "" },
  });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    try {
      await createWithdrawal.mutateAsync({ data });
      await queryClient.invalidateQueries({ queryKey: getListWithdrawalsQueryKey() });
      await queryClient.invalidateQueries({ queryKey: getGetIncomeSummaryQueryKey() });
      toast({ title: "Withdrawal requested!", description: "Your request is being processed" });
      form.reset({ amount: 0, walletAddress: user?.walletAddress || "" });
    } catch (err: any) {
      toast({ title: "Failed", description: err?.message || "Could not submit withdrawal", variant: "destructive" });
    }
  };

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
        Withdrawals
      </h1>

      {/* Balance hero */}
      <div
        className="rounded-2xl p-5 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(61,214,245,0.12), rgba(42,179,215,0.05))",
          border: "1px solid rgba(61,214,245,0.28)",
          boxShadow: "0 0 30px rgba(61,214,245,0.07)",
        }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at top right, rgba(61,214,245,0.14) 0%, transparent 60%)" }} />
        <div className="relative">
          <div className="text-xs tracking-widest uppercase mb-1" style={{ color: "rgba(168,237,255,0.45)" }}>
            Available for Withdrawal
          </div>
          <div
            className="text-4xl font-black"
            data-testid="text-available-balance"
            style={{
              fontFamily: "'Orbitron', sans-serif",
              background: "linear-gradient(135deg, #a8edff, #3DD6F5)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            ${summary?.availableBalance?.toFixed(2) ?? "0.00"}
          </div>
          <div className="flex gap-4 mt-3 text-xs" style={{ color: "rgba(168,237,255,0.4)" }}>
            <span>Pending: <span style={{ color: "rgba(168,237,255,0.8)", fontWeight: 600 }}>${summary?.pendingWithdrawal?.toFixed(2) ?? "0.00"}</span></span>
            <span>Total Withdrawn: <span style={{ color: "rgba(168,237,255,0.8)", fontWeight: 600 }}>${summary?.withdrawnTotal?.toFixed(2) ?? "0.00"}</span></span>
          </div>
        </div>
      </div>

      {/* Request Form */}
      <div className="rounded-2xl p-5" style={GLASS}>
        <h2 className="font-semibold text-sm mb-4" style={{ color: "rgba(168,237,255,0.8)" }}>Request Withdrawal</h2>
        <div
          className="flex items-start gap-2 rounded-lg p-3 mb-4"
          style={{ background: "rgba(61,214,245,0.05)", border: "1px solid rgba(61,214,245,0.14)" }}
        >
          <AlertCircle size={14} className="shrink-0 mt-0.5" style={{ color: TEAL }} />
          <p className="text-xs" style={{ color: "rgba(168,237,255,0.5)" }}>
            Withdrawals are processed within 24–48 hours. Minimum withdrawal amount is $10.
          </p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="amount" render={({ field }) => (
              <FormItem>
                <FormLabel style={{ color: "rgba(168,237,255,0.65)", fontSize: "0.8rem" }}>Amount (USDT)</FormLabel>
                <FormControl>
                  <Input data-testid="input-withdraw-amount" type="number" min="10" step="0.01" placeholder="Enter amount" {...field} style={INPUT_STYLE} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="walletAddress" render={({ field }) => (
              <FormItem>
                <FormLabel style={{ color: "rgba(168,237,255,0.65)", fontSize: "0.8rem" }}>USDT Wallet Address (TRC20)</FormLabel>
                <FormControl>
                  <Input data-testid="input-withdraw-wallet" placeholder="TXxxxxxxxxxxxxxxxxx" {...field} style={INPUT_STYLE} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <button
              data-testid="button-submit-withdrawal"
              type="submit"
              disabled={createWithdrawal.isPending}
              className="w-full py-2.5 rounded-xl font-bold transition-all disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, #3DD6F5, #2AB3CF)",
                color: "#010810",
                letterSpacing: "0.04em",
                boxShadow: "0 0 20px rgba(61,214,245,0.3)",
              }}
            >
              {createWithdrawal.isPending ? "Submitting..." : "Request Withdrawal"}
            </button>
          </form>
        </Form>
      </div>

      {/* History */}
      <div>
        <h2 className="font-semibold text-sm mb-3" style={{ color: "rgba(168,237,255,0.75)" }}>Withdrawal History</h2>
        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="rounded-xl h-16 animate-pulse" style={{ background: "rgba(61,214,245,0.04)", border: "1px solid rgba(61,214,245,0.08)" }} />)}
          </div>
        ) : !withdrawals?.length ? (
          <div className="rounded-xl p-8 text-center" style={GLASS}>
            <Wallet size={32} className="mx-auto mb-2" style={{ color: "rgba(168,237,255,0.2)" }} />
            <p className="text-sm" style={{ color: "rgba(168,237,255,0.35)" }}>No withdrawal history yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {withdrawals.map(w => {
              const cfg = statusConfig[w.status] || statusConfig.pending;
              return (
                <div
                  key={w.id}
                  data-testid={`row-withdrawal-${w.id}`}
                  className="rounded-xl px-4 py-3.5 flex items-center justify-between"
                  style={GLASS}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: cfg.bg, border: `1px solid ${cfg.color}33` }}>
                      <cfg.icon size={16} style={{ color: cfg.color }} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold" style={{ color: "rgba(168,237,255,0.85)" }}>${w.amount.toFixed(2)} USDT</div>
                      <div className="text-xs" style={{ color: "rgba(168,237,255,0.35)" }}>{formatDate(w.createdAt)}</div>
                      <div className="text-xs truncate max-w-32" style={{ color: "rgba(168,237,255,0.3)" }}>{w.walletAddress}</div>
                    </div>
                  </div>
                  <span
                    className="text-xs font-semibold px-2 py-1 rounded-full"
                    style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}33` }}
                  >
                    {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
