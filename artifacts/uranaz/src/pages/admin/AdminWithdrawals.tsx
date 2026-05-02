import { useState } from "react";
import { useListAdminWithdrawals, useApproveWithdrawal, useRejectWithdrawal, getListAdminWithdrawalsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Wallet, CheckCircle, XCircle } from "lucide-react";

const TEAL = "#3DD6F5";
const GLASS = { background: "rgba(5,18,32,0.65)", backdropFilter: "blur(14px)", border: "1px solid rgba(61,214,245,0.10)" } as const;

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
    <div className="px-4 py-6 max-w-4xl mx-auto space-y-5 pb-24 md:pb-8">
      <div className="flex items-center gap-3">
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
        {pendingCount > 0 && (
          <span
            className="text-xs px-2.5 py-1 rounded-full font-semibold"
            style={{ background: "rgba(251,191,36,0.10)", border: "1px solid rgba(251,191,36,0.22)", color: "#fbbf24" }}
          >
            {pendingCount} pending
          </span>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["all", "pending", "approved", "rejected"] as const).map(f => (
          <button
            key={f}
            data-testid={`filter-${f}`}
            onClick={() => setFilter(f)}
            className="flex-1 py-2 rounded-lg text-xs font-medium transition-all capitalize"
            style={filter === f ? {
              background: "linear-gradient(135deg, #3DD6F5, #2AB3CF)",
              color: "#010810",
              fontWeight: 700,
            } : {
              ...GLASS,
              color: "rgba(168,237,255,0.45)",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="rounded-xl h-24 animate-pulse" style={{ background: "rgba(61,214,245,0.04)", border: "1px solid rgba(61,214,245,0.08)" }} />)}
        </div>
      ) : !withdrawals?.length ? (
        <div className="rounded-xl p-8 text-center" style={GLASS}>
          <Wallet size={32} className="mx-auto mb-2" style={{ color: "rgba(168,237,255,0.2)" }} />
          <p className="text-sm" style={{ color: "rgba(168,237,255,0.35)" }}>No {filter} withdrawals</p>
        </div>
      ) : (
        <div className="space-y-2">
          {withdrawals.map(w => (
            <div key={w.id} data-testid={`row-withdrawal-${w.id}`} className="rounded-xl p-4" style={GLASS}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="font-semibold text-sm" style={{ color: "rgba(168,237,255,0.85)" }}>
                    {(w as any).userName || "User"}
                  </div>
                  <div className="text-xs" style={{ color: "rgba(168,237,255,0.4)" }}>{(w as any).userEmail || ""}</div>
                  <div className="text-xs mt-0.5 font-mono" style={{ color: "rgba(168,237,255,0.3)" }}>{w.walletAddress}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold" style={{ color: TEAL }}>${w.amount.toFixed(2)}</div>
                  <div className="text-xs" style={{ color: "rgba(168,237,255,0.35)" }}>{formatDate(w.createdAt)}</div>
                </div>
              </div>
              {w.status === "pending" ? (
                <div className="flex gap-2 pt-2" style={{ borderTop: "1px solid rgba(61,214,245,0.07)" }}>
                  <button
                    data-testid={`button-approve-${w.id}`}
                    onClick={() => handleApprove(w.id)}
                    disabled={approveWithdrawal.isPending || rejectWithdrawal.isPending}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                    style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", color: "#34d399" }}
                  >
                    <CheckCircle size={13} /> Approve
                  </button>
                  <button
                    data-testid={`button-reject-${w.id}`}
                    onClick={() => handleReject(w.id)}
                    disabled={approveWithdrawal.isPending || rejectWithdrawal.isPending}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                    style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171" }}
                  >
                    <XCircle size={13} /> Reject
                  </button>
                </div>
              ) : (
                <div
                  className="mt-2 pt-2 flex items-center gap-1.5 text-xs font-semibold"
                  style={{
                    borderTop: "1px solid rgba(61,214,245,0.07)",
                    color: w.status === "approved" ? "#34d399" : "#f87171",
                  }}
                >
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
