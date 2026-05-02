import { useState } from "react";
import { useListAdminWithdrawals, useApproveWithdrawal, useRejectWithdrawal, getListAdminWithdrawalsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Wallet, CheckCircle, XCircle } from "lucide-react";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminWithdrawals() {
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const { data: withdrawals, isLoading } = useListAdminWithdrawals(
    filter === "all" ? undefined : { status: filter }
  );
  const approveWithdrawal = useApproveWithdrawal();
  const rejectWithdrawal = useRejectWithdrawal();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleApprove = async (id: number) => {
    try {
      await approveWithdrawal.mutateAsync({ id });
      await queryClient.invalidateQueries({ queryKey: getListAdminWithdrawalsQueryKey() });
      toast({ title: "Withdrawal approved" });
    } catch (err: any) {
      toast({ title: "Failed", description: err?.message, variant: "destructive" });
    }
  };

  const handleReject = async (id: number) => {
    try {
      await rejectWithdrawal.mutateAsync({ id });
      await queryClient.invalidateQueries({ queryKey: getListAdminWithdrawalsQueryKey() });
      toast({ title: "Withdrawal rejected" });
    } catch (err: any) {
      toast({ title: "Failed", description: err?.message, variant: "destructive" });
    }
  };

  const pendingCount = filter === "all"
    ? withdrawals?.filter(w => w.status === "pending").length ?? 0
    : filter === "pending" ? withdrawals?.length ?? 0 : 0;

  return (
    <div className="px-4 py-6 max-w-4xl mx-auto space-y-5 pb-24 md:pb-6">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold">Withdrawals</h1>
        {pendingCount > 0 && (
          <span className="bg-amber-400/10 text-amber-400 text-xs px-2.5 py-1 rounded-full font-semibold">{pendingCount} pending</span>
        )}
      </div>

      <div className="flex gap-2">
        {(["all", "pending", "approved", "rejected"] as const).map(f => (
          <button
            key={f}
            data-testid={`filter-${f}`}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors capitalize ${
              filter === f ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:border-primary/30"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="bg-card border border-border rounded-xl h-24 animate-pulse" />)}
        </div>
      ) : !withdrawals?.length ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <Wallet size={32} className="text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No {filter} withdrawals</p>
        </div>
      ) : (
        <div className="space-y-2">
          {withdrawals.map(w => (
            <div key={w.id} data-testid={`row-withdrawal-${w.id}`} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="font-semibold text-sm">{(w as any).userName || "User"}</div>
                  <div className="text-xs text-muted-foreground">{(w as any).userEmail || ""}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 font-mono">{w.walletAddress}</div>
                </div>
                <div className="text-right">
                  <div className="text-primary font-bold">${w.amount.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">{formatDate(w.createdAt)}</div>
                </div>
              </div>
              {w.status === "pending" ? (
                <div className="flex gap-2 pt-2 border-t border-border">
                  <button
                    data-testid={`button-approve-${w.id}`}
                    onClick={() => handleApprove(w.id)}
                    disabled={approveWithdrawal.isPending || rejectWithdrawal.isPending}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle size={13} /> Approve
                  </button>
                  <button
                    data-testid={`button-reject-${w.id}`}
                    onClick={() => handleReject(w.id)}
                    disabled={approveWithdrawal.isPending || rejectWithdrawal.isPending}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-colors disabled:opacity-50"
                  >
                    <XCircle size={13} /> Reject
                  </button>
                </div>
              ) : (
                <div className={`mt-2 pt-2 border-t border-border flex items-center gap-1.5 text-xs font-semibold ${
                  w.status === "approved" ? "text-emerald-400" : "text-destructive"
                }`}>
                  {w.status === "approved" ? <CheckCircle size={12} /> : <XCircle size={12} />}
                  {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
