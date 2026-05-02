import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useGetIncomeSummary,
  useListIncome,
  useListWithdrawals,
  useCreateWithdrawal,
  getListWithdrawalsQueryKey,
  getGetIncomeSummaryQueryKey,
  getListIncomeQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users,
  DollarSign,
  Award,
  Clock,
  XCircle,
} from "lucide-react";

const TEAL = "#3DD6F5";
const GLASS = {
  background: "rgba(5,18,32,0.65)",
  backdropFilter: "blur(14px)",
  border: "1px solid rgba(61,214,245,0.10)",
} as const;
const INPUT_STYLE = {
  background: "rgba(0,20,40,0.6)",
  border: "1px solid rgba(61,214,245,0.18)",
  color: "rgba(168,237,255,0.9)",
};

const PLATFORM_WALLETS = {
  usdt:      { label: "USDT (TRC20)",   address: "TUranazDeposit1234567890USDT" },
  hypercoin: { label: "HYPERCOIN (TRC20)", address: "TUranazDeposit1234567890HCOIN" },
};

const withdrawSchema = z.object({
  amount: z.coerce.number().min(10, "Minimum withdrawal is $10"),
  walletAddress: z.string().min(10, "Valid wallet address required"),
});

const typeIcons: Record<string, any> = {
  daily_return:     TrendingUp,
  spot_referral:    Users,
  level_commission: DollarSign,
  rank_bonus:       Award,
};
const typeColors: Record<string, string> = {
  daily_return:     "#34d399",
  spot_referral:    "#60a5fa",
  level_commission: "#c084fc",
  rank_bonus:       TEAL,
};
const statusConfig: Record<string, { icon: any; color: string }> = {
  pending:  { icon: Clock,       color: "#fbbf24" },
  approved: { icon: CheckCircle, color: "#34d399" },
  rejected: { icon: XCircle,     color: "#f87171" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-all shrink-0"
      style={copied
        ? { background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.25)", color: "#34d399" }
        : { background: "rgba(61,214,245,0.08)", border: "1px solid rgba(61,214,245,0.18)", color: TEAL }
      }
    >
      {copied ? <><CheckCircle size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
    </button>
  );
}

type Tab = "deposit" | "withdraw" | "history";

export default function WalletPage({ user }: { user: any }) {
  const [tab, setTab] = useState<Tab>("deposit");
  const { data: summary } = useGetIncomeSummary();
  const { data: incomeData } = useListIncome({ page: 1, limit: 20 });
  const { data: withdrawals } = useListWithdrawals();
  const createWithdrawal = useCreateWithdrawal();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(withdrawSchema),
    defaultValues: { amount: 0, walletAddress: user?.walletAddress || "" },
  });

  const onWithdraw = async (data: z.infer<typeof withdrawSchema>) => {
    try {
      await createWithdrawal.mutateAsync({ data });
      await queryClient.invalidateQueries({ queryKey: getListWithdrawalsQueryKey() });
      await queryClient.invalidateQueries({ queryKey: getGetIncomeSummaryQueryKey() });
      await queryClient.invalidateQueries({ queryKey: getListIncomeQueryKey() });
      toast({ title: "Withdrawal requested!", description: "Your request is being processed." });
      form.reset({ amount: 0, walletAddress: user?.walletAddress || "" });
    } catch (err: any) {
      toast({ title: "Failed", description: err?.message || "Could not submit withdrawal", variant: "destructive" });
    }
  };

  // Merge income + withdrawals into one timeline, sorted newest first
  const allTxns = [
    ...(incomeData?.records ?? []).map(r => ({ type: "income" as const,    data: r, ts: new Date(r.createdAt).getTime() })),
    ...(withdrawals ?? []).map(w =>            ({ type: "withdrawal" as const, data: w, ts: new Date(w.createdAt).getTime() })),
  ].sort((a, b) => b.ts - a.ts);

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "deposit",  label: "Deposit",  icon: ArrowDownLeft },
    { id: "withdraw", label: "Withdraw", icon: ArrowUpRight },
    { id: "history",  label: "History",  icon: Wallet },
  ];

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-5 pb-24 md:pb-8">
      {/* Header */}
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
        Wallet
      </h1>

      {/* Balance Cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Available Balance",  value: summary?.availableBalance,  highlight: true },
          { label: "Total Earnings",     value: summary?.totalEarnings,     highlight: false },
          { label: "Pending Withdrawal", value: summary?.pendingWithdrawal, highlight: false },
          { label: "Total Withdrawn",    value: summary?.withdrawnTotal,    highlight: false },
        ].map(item => (
          <div
            key={item.label}
            className="rounded-xl p-4"
            style={item.highlight ? {
              background: "linear-gradient(135deg, rgba(61,214,245,0.12), rgba(42,179,215,0.06))",
              border: "1px solid rgba(61,214,245,0.28)",
              boxShadow: "0 0 20px rgba(61,214,245,0.07)",
            } : GLASS}
          >
            <div className="text-xs mb-1" style={{ color: "rgba(168,237,255,0.42)" }}>{item.label}</div>
            <div
              className="font-black text-xl"
              style={{
                fontFamily: "'Orbitron', sans-serif",
                color: item.highlight ? TEAL : "rgba(168,237,255,0.88)",
                fontSize: "1.1rem",
              }}
            >
              ${item.value?.toFixed(2) ?? "0.00"}
            </div>
          </div>
        ))}
      </div>

      {/* Tab switcher */}
      <div
        className="flex rounded-xl p-1 gap-1"
        style={{ background: "rgba(0,10,24,0.6)", border: "1px solid rgba(61,214,245,0.10)" }}
      >
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all"
            style={tab === t.id ? {
              background: "linear-gradient(135deg, #3DD6F5, #2AB3CF)",
              color: "#010810",
              boxShadow: "0 0 12px rgba(61,214,245,0.35)",
            } : {
              color: "rgba(168,237,255,0.45)",
            }}
          >
            <t.icon size={13} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── DEPOSIT TAB ── */}
      {tab === "deposit" && (
        <div className="space-y-4">
          <div
            className="flex items-start gap-2.5 rounded-xl p-3.5"
            style={{ background: "rgba(61,214,245,0.05)", border: "1px solid rgba(61,214,245,0.14)" }}
          >
            <AlertCircle size={15} className="shrink-0 mt-0.5" style={{ color: TEAL }} />
            <p className="text-xs leading-relaxed" style={{ color: "rgba(168,237,255,0.55)" }}>
              Send only the supported currencies to these addresses. Deposits are credited after network confirmation.
              Minimum deposit is <strong style={{ color: "rgba(168,237,255,0.8)" }}>$100 USDT</strong> and at least
              <strong style={{ color: "rgba(168,237,255,0.8)" }}> 50% must be HYPERCOIN</strong>.
            </p>
          </div>

          {Object.entries(PLATFORM_WALLETS).map(([key, wallet]) => (
            <div key={key} className="rounded-2xl p-5 space-y-3" style={GLASS}>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{ background: "rgba(61,214,245,0.12)", border: "1px solid rgba(61,214,245,0.22)", color: TEAL }}
                >
                  {key === "usdt" ? "₮" : "HC"}
                </div>
                <span className="font-semibold text-sm" style={{ color: "rgba(168,237,255,0.85)" }}>{wallet.label}</span>
              </div>

              {/* Fake QR placeholder */}
              <div
                className="w-28 h-28 mx-auto rounded-xl flex items-center justify-center"
                style={{ background: "rgba(0,10,24,0.7)", border: "1px solid rgba(61,214,245,0.15)" }}
              >
                <div className="grid grid-cols-5 gap-0.5 opacity-60">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-3.5 h-3.5 rounded-sm"
                      style={{ background: Math.random() > 0.4 ? TEAL : "transparent" }}
                    />
                  ))}
                </div>
              </div>

              <div
                className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                style={{ background: "rgba(0,10,24,0.6)", border: "1px solid rgba(61,214,245,0.12)" }}
              >
                <span
                  className="flex-1 text-xs font-mono truncate"
                  style={{ color: "rgba(168,237,255,0.6)" }}
                >
                  {wallet.address}
                </span>
                <CopyButton text={wallet.address} />
              </div>
              <p className="text-xs text-center" style={{ color: "rgba(168,237,255,0.3)" }}>
                Network: TRC20 (TRON)
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── WITHDRAW TAB ── */}
      {tab === "withdraw" && (
        <div className="space-y-4">
          {/* Balance reminder */}
          <div
            className="flex items-center justify-between rounded-xl px-4 py-3"
            style={{ background: "rgba(61,214,245,0.06)", border: "1px solid rgba(61,214,245,0.14)" }}
          >
            <span className="text-xs" style={{ color: "rgba(168,237,255,0.5)" }}>Available</span>
            <span className="font-bold" style={{ color: TEAL, fontFamily: "'Orbitron', sans-serif", fontSize: "0.95rem" }}>
              ${summary?.availableBalance?.toFixed(2) ?? "0.00"}
            </span>
          </div>

          <div
            className="flex items-start gap-2 rounded-xl p-3.5"
            style={{ background: "rgba(61,214,245,0.05)", border: "1px solid rgba(61,214,245,0.14)" }}
          >
            <AlertCircle size={14} className="shrink-0 mt-0.5" style={{ color: TEAL }} />
            <p className="text-xs" style={{ color: "rgba(168,237,255,0.5)" }}>
              Processed within 24–48 hours. Minimum $10. Ensure the wallet address is correct — transactions are irreversible.
            </p>
          </div>

          <div className="rounded-2xl p-5" style={GLASS}>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onWithdraw)} className="space-y-4">
                <FormField control={form.control} name="amount" render={({ field }) => (
                  <FormItem>
                    <FormLabel style={{ color: "rgba(168,237,255,0.65)", fontSize: "0.8rem" }}>Amount (USDT)</FormLabel>
                    <FormControl>
                      <Input data-testid="input-withdraw-amount" type="number" min="10" step="0.01" placeholder="0.00" {...field} style={INPUT_STYLE} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Quick amount buttons */}
                <div className="flex gap-2">
                  {[50, 100, 200, 500].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => form.setValue("amount", amt)}
                      className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{ background: "rgba(0,15,30,0.7)", border: "1px solid rgba(61,214,245,0.14)", color: "rgba(168,237,255,0.5)" }}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>

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
                  className="w-full py-3 rounded-xl font-bold transition-all disabled:opacity-60"
                  style={{
                    background: "linear-gradient(135deg, #3DD6F5, #2AB3CF)",
                    color: "#010810",
                    letterSpacing: "0.04em",
                    boxShadow: "0 0 20px rgba(61,214,245,0.3)",
                  }}
                >
                  {createWithdrawal.isPending ? "Submitting…" : "Request Withdrawal"}
                </button>
              </form>
            </Form>
          </div>
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {tab === "history" && (
        <div className="space-y-2">
          {allTxns.length === 0 ? (
            <div className="rounded-xl p-10 text-center" style={GLASS}>
              <Wallet size={36} className="mx-auto mb-2" style={{ color: "rgba(168,237,255,0.2)" }} />
              <p className="text-sm" style={{ color: "rgba(168,237,255,0.35)" }}>No transactions yet</p>
            </div>
          ) : (
            allTxns.map((txn, idx) => {
              if (txn.type === "income") {
                const r = txn.data as any;
                const Icon  = typeIcons[r.type]  || DollarSign;
                const color = typeColors[r.type] || TEAL;
                return (
                  <div
                    key={`inc-${r.id}`}
                    className="rounded-xl px-4 py-3.5 flex items-center justify-between"
                    style={GLASS}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: "rgba(0,10,24,0.6)", border: `1px solid ${color}33` }}>
                        <Icon size={15} style={{ color }} />
                      </div>
                      <div>
                        <div className="text-sm font-medium" style={{ color: "rgba(168,237,255,0.8)" }}>{r.description}</div>
                        <div className="text-xs" style={{ color: "rgba(168,237,255,0.3)" }}>{formatDate(r.createdAt)}</div>
                      </div>
                    </div>
                    <div className="font-bold text-sm" style={{ color }}>+${r.amount.toFixed(2)}</div>
                  </div>
                );
              } else {
                const w = txn.data as any;
                const cfg = statusConfig[w.status] || statusConfig.pending;
                return (
                  <div
                    key={`wd-${w.id}`}
                    className="rounded-xl px-4 py-3.5 flex items-center justify-between"
                    style={GLASS}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `${cfg.color}14`, border: `1px solid ${cfg.color}33` }}>
                        <ArrowUpRight size={15} style={{ color: cfg.color }} />
                      </div>
                      <div>
                        <div className="text-sm font-medium" style={{ color: "rgba(168,237,255,0.8)" }}>Withdrawal</div>
                        <div className="flex items-center gap-1.5 text-xs mt-0.5">
                          <cfg.icon size={10} style={{ color: cfg.color }} />
                          <span style={{ color: cfg.color, fontWeight: 600 }}>{w.status}</span>
                          <span style={{ color: "rgba(168,237,255,0.3)" }}>· {formatDate(w.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="font-bold text-sm" style={{ color: "#f87171" }}>-${w.amount.toFixed(2)}</div>
                  </div>
                );
              }
            })
          )}
        </div>
      )}
    </div>
  );
}
