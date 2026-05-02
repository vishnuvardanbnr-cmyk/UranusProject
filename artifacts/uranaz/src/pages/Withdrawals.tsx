import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useListWithdrawals, useCreateWithdrawal, useGetIncomeSummary, getListWithdrawalsQueryKey, getGetIncomeSummaryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Wallet, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

const schema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  walletAddress: z.string().min(10, "Valid wallet address required"),
});

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  pending: { icon: Clock, color: "text-amber-400", label: "Pending" },
  approved: { icon: CheckCircle, color: "text-emerald-400", label: "Approved" },
  rejected: { icon: XCircle, color: "text-destructive", label: "Rejected" },
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
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-6 pb-24 md:pb-6">
      <h1 className="text-xl font-bold">Withdrawals</h1>

      {/* Balance */}
      <div className="bg-gradient-to-br from-primary/15 to-amber-700/5 border border-primary/30 rounded-2xl p-5">
        <div className="text-xs text-muted-foreground mb-1">Available for Withdrawal</div>
        <div className="text-3xl font-bold text-primary" data-testid="text-available-balance">
          ${summary?.availableBalance?.toFixed(2) ?? "0.00"}
        </div>
        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
          <span>Pending: <span className="text-foreground">${summary?.pendingWithdrawal?.toFixed(2) ?? "0.00"}</span></span>
          <span>Total Withdrawn: <span className="text-foreground">${summary?.withdrawnTotal?.toFixed(2) ?? "0.00"}</span></span>
        </div>
      </div>

      {/* Request Form */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h2 className="font-semibold text-sm mb-4">Request Withdrawal</h2>
        <div className="flex items-start gap-2 bg-primary/5 border border-primary/20 rounded-lg p-3 mb-4">
          <AlertCircle size={14} className="text-primary mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">Withdrawals are processed within 24-48 hours. Minimum withdrawal amount is $10.</p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="amount" render={({ field }) => (
              <FormItem>
                <FormLabel>Amount (USDT)</FormLabel>
                <FormControl><Input data-testid="input-withdraw-amount" type="number" min="10" step="0.01" placeholder="Enter amount" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="walletAddress" render={({ field }) => (
              <FormItem>
                <FormLabel>USDT Wallet Address (TRC20)</FormLabel>
                <FormControl><Input data-testid="input-withdraw-wallet" placeholder="TXxxxxxxxxxxxxxxxxx" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <button
              data-testid="button-submit-withdrawal"
              type="submit"
              disabled={createWithdrawal.isPending}
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {createWithdrawal.isPending ? "Submitting..." : "Request Withdrawal"}
            </button>
          </form>
        </Form>
      </div>

      {/* History */}
      <div>
        <h2 className="font-semibold text-sm mb-3">Withdrawal History</h2>
        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="bg-card border border-border rounded-xl h-16 animate-pulse" />)}
          </div>
        ) : !withdrawals?.length ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <Wallet size={32} className="text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No withdrawal history yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {withdrawals.map(w => {
              const cfg = statusConfig[w.status] || statusConfig.pending;
              return (
                <div key={w.id} data-testid={`row-withdrawal-${w.id}`} className="bg-card border border-border rounded-xl px-4 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg bg-background flex items-center justify-center ${cfg.color}`}>
                      <cfg.icon size={16} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">${w.amount.toFixed(2)} USDT</div>
                      <div className="text-xs text-muted-foreground">{formatDate(w.createdAt)}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-32">{w.walletAddress}</div>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    w.status === "approved" ? "bg-emerald-400/10 text-emerald-400" :
                    w.status === "rejected" ? "bg-destructive/10 text-destructive" :
                    "bg-amber-400/10 text-amber-400"
                  }`}>
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
