import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, CheckCircle2, Clock, XCircle, RefreshCw, ArrowDownToLine, Wallet, AlertTriangle, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TEAL = "#3DD6F5";
const GLASS = { background: "rgba(5,18,32,0.65)", backdropFilter: "blur(14px)", border: "1px solid rgba(61,214,245,0.10)" } as const;

function getToken() {
  return localStorage.getItem("uranaz_token") || "";
}

type DepositStatus = "idle" | "checking" | "not_found" | "too_small" | "sweeping" | "credited" | "failed";

type DepositRecord = {
  id: number;
  amount: number;
  status: string;
  sweepTxHash?: string | null;
  createdAt: string;
  creditedAt?: string | null;
};

const statusConfig: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  pending:  { icon: Clock,         color: "rgba(251,191,36,0.9)",  label: "Pending" },
  sweeping: { icon: RefreshCw,     color: TEAL,                    label: "Sweeping" },
  credited: { icon: CheckCircle2,  color: "rgba(52,211,153,0.9)",  label: "Credited" },
  failed:   { icon: XCircle,       color: "rgba(248,113,113,0.9)", label: "Failed" },
};

export default function Deposit({ user }: { user: any }) {
  const { toast } = useToast();
  const [address, setAddress] = useState<string | null>(null);
  const [addressLoading, setAddressLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [checkStatus, setCheckStatus] = useState<DepositStatus>("idle");
  const [checkResult, setCheckResult] = useState<{ amount?: number; sweepTxHash?: string; newBalance?: number; message?: string } | null>(null);
  const [history, setHistory] = useState<DepositRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    fetch("/api/deposits/address", { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json())
      .then(d => setAddress(d.address))
      .catch(() => {})
      .finally(() => setAddressLoading(false));

    fetchHistory();
  }, []);

  const fetchHistory = () => {
    setHistoryLoading(true);
    fetch("/api/deposits", { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json())
      .then(d => setHistory(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  };

  const copyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Address copied!" });
    });
  };

  const checkDeposit = async () => {
    setCheckStatus("checking");
    setCheckResult(null);
    try {
      const res = await fetch("/api/deposits/check", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      setCheckStatus(data.status as DepositStatus);
      setCheckResult(data);
      if (data.status === "credited") {
        toast({ title: `+$${data.amount?.toFixed(2)} USDT Credited!`, description: "Your wallet balance has been updated." });
        fetchHistory();
      } else if (data.status === "not_found") {
        toast({ title: "No deposit found yet", description: "USDT not detected at your address." });
      } else if (data.status === "too_small") {
        toast({ title: "Amount too small", description: data.message, variant: "destructive" });
      } else if (data.status === "failed") {
        toast({ title: "Sweep failed", description: data.message, variant: "destructive" });
      }
    } catch {
      setCheckStatus("failed");
      toast({ title: "Connection error", description: "Could not reach the server.", variant: "destructive" });
    }
  };

  const shortAddr = address ? `${address.slice(0, 8)}...${address.slice(-6)}` : "";

  return (
    <div className="px-4 py-6 max-w-xl mx-auto pb-24 md:pb-8 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ArrowDownToLine size={20} style={{ color: TEAL }} />
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
          Deposit USDT
        </h1>
      </div>

      {/* Wallet Balance */}
      <div
        className="flex items-center justify-between px-5 py-4 rounded-2xl"
        style={{ background: "rgba(61,214,245,0.06)", border: "1px solid rgba(61,214,245,0.18)" }}
      >
        <div className="flex items-center gap-3">
          <Wallet size={18} style={{ color: TEAL }} />
          <span className="text-sm font-medium" style={{ color: "rgba(168,237,255,0.7)" }}>Wallet Balance</span>
        </div>
        <span className="font-bold text-lg" style={{ color: TEAL, fontFamily: "'Orbitron', sans-serif" }}>
          ${parseFloat(user?.walletBalance ?? "0").toFixed(2)}
        </span>
      </div>

      {/* Deposit Address Card */}
      <div className="rounded-2xl p-5 space-y-5" style={GLASS}>
        <div>
          <h2 className="font-semibold text-sm mb-1" style={{ color: TEAL }}>Your BEP-20 (BSC) USDT Address</h2>
          <p className="text-xs" style={{ color: "rgba(168,237,255,0.4)" }}>
            Send <strong style={{ color: "rgba(168,237,255,0.7)" }}>USDT (BEP-20)</strong> only to this address. Each user has a unique address.
          </p>
        </div>

        {/* QR Code */}
        <div className="flex justify-center">
          {addressLoading ? (
            <div className="w-48 h-48 rounded-2xl animate-pulse" style={{ background: "rgba(61,214,245,0.06)" }} />
          ) : address ? (
            <div
              className="p-4 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.97)", boxShadow: "0 0 40px rgba(61,214,245,0.2)" }}
            >
              <QRCodeSVG value={address} size={160} bgColor="#fff" fgColor="#010810" level="M" />
            </div>
          ) : (
            <div className="text-sm" style={{ color: "rgba(248,113,113,0.8)" }}>Failed to load address</div>
          )}
        </div>

        {/* Address display */}
        {address && (
          <button
            onClick={copyAddress}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all group"
            style={{
              background: "rgba(0,20,40,0.7)",
              border: `1px solid ${copied ? "rgba(52,211,153,0.5)" : "rgba(61,214,245,0.2)"}`,
            }}
          >
            <span className="text-xs font-mono break-all text-left" style={{ color: "rgba(168,237,255,0.75)" }}>
              {address}
            </span>
            {copied ? (
              <CheckCircle2 size={16} className="shrink-0" style={{ color: "rgba(52,211,153,0.9)" }} />
            ) : (
              <Copy size={16} className="shrink-0" style={{ color: "rgba(61,214,245,0.6)" }} />
            )}
          </button>
        )}

        {/* Warning */}
        <div
          className="flex gap-3 p-3 rounded-xl"
          style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.18)" }}
        >
          <AlertTriangle size={15} className="shrink-0 mt-0.5" style={{ color: "rgba(251,191,36,0.8)" }} />
          <div className="text-xs space-y-1" style={{ color: "rgba(251,191,36,0.8)" }}>
            <p className="font-semibold">Important</p>
            <p>Only send <strong>USDT on BEP-20 (BSC) network</strong>. Sending other tokens or using a different network will result in permanent loss of funds.</p>
          </div>
        </div>

        {/* Check Deposit Button */}
        <button
          onClick={checkDeposit}
          disabled={checkStatus === "checking" || !address}
          className="w-full py-3.5 rounded-xl font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          style={{
            background: checkStatus === "credited"
              ? "linear-gradient(135deg, #34d399, #10b981)"
              : "linear-gradient(135deg, #3DD6F5, #2AB3CF)",
            color: "#010810",
            letterSpacing: "0.04em",
            fontFamily: "'Orbitron', sans-serif",
            fontSize: "0.8rem",
            boxShadow: "0 0 20px rgba(61,214,245,0.25)",
          }}
        >
          {checkStatus === "checking" ? (
            <>
              <RefreshCw size={16} className="animate-spin" />
              Checking & Sweeping…
            </>
          ) : checkStatus === "credited" ? (
            <>
              <CheckCircle2 size={16} />
              Deposit Credited!
            </>
          ) : (
            <>
              <RefreshCw size={16} />
              Check Deposit
            </>
          )}
        </button>

        {/* Check Result */}
        {checkResult && checkStatus !== "checking" && (
          <div
            className="p-4 rounded-xl space-y-2"
            style={{
              background: checkStatus === "credited"
                ? "rgba(52,211,153,0.06)"
                : checkStatus === "not_found"
                  ? "rgba(61,214,245,0.06)"
                  : "rgba(248,113,113,0.06)",
              border: `1px solid ${checkStatus === "credited" ? "rgba(52,211,153,0.25)" : checkStatus === "not_found" ? "rgba(61,214,245,0.2)" : "rgba(248,113,113,0.25)"}`,
            }}
          >
            <p className="text-sm font-medium" style={{
              color: checkStatus === "credited" ? "rgba(52,211,153,0.95)" : checkStatus === "not_found" ? "rgba(168,237,255,0.7)" : "rgba(248,113,113,0.9)"
            }}>
              {checkResult.message}
            </p>
            {checkStatus === "credited" && checkResult.sweepTxHash && (
              <a
                href={`https://bscscan.com/tx/${checkResult.sweepTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs"
                style={{ color: TEAL }}
              >
                <ExternalLink size={11} /> View on BSCScan
              </a>
            )}
            {checkStatus === "credited" && (
              <p className="text-xs" style={{ color: "rgba(168,237,255,0.5)" }}>
                New balance: <strong style={{ color: TEAL }}>${checkResult.newBalance?.toFixed(2)}</strong>
              </p>
            )}
          </div>
        )}
      </div>

      {/* How It Works */}
      <div className="rounded-2xl p-5" style={GLASS}>
        <h2 className="font-semibold text-sm mb-4" style={{ color: TEAL }}>How Deposits Work</h2>
        <div className="space-y-3">
          {[
            { step: "1", text: "Copy your unique BEP-20 USDT address or scan the QR code" },
            { step: "2", text: "Send USDT (BEP-20) from your wallet or exchange" },
            { step: "3", text: "Once sent, click \"Check Deposit\" — we verify your transaction on BSC" },
            { step: "4", text: "USDT is automatically swept to our secure vault and your wallet balance is credited" },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-start gap-3">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                style={{ background: "rgba(61,214,245,0.15)", border: "1px solid rgba(61,214,245,0.3)", color: TEAL }}
              >
                {step}
              </div>
              <p className="text-sm pt-0.5" style={{ color: "rgba(168,237,255,0.6)" }}>{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Deposit History */}
      <div className="rounded-2xl p-5" style={GLASS}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm" style={{ color: TEAL }}>Deposit History</h2>
          <button onClick={fetchHistory} style={{ color: "rgba(61,214,245,0.5)" }}>
            <RefreshCw size={14} />
          </button>
        </div>

        {historyLoading ? (
          <div className="space-y-2">
            {[1, 2].map(i => <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: "rgba(61,214,245,0.04)" }} />)}
          </div>
        ) : history.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: "rgba(168,237,255,0.3)" }}>No deposits yet</p>
        ) : (
          <div className="space-y-2">
            {history.map(dep => {
              const cfg = statusConfig[dep.status] ?? statusConfig.pending;
              const StatusIcon = cfg.icon;
              return (
                <div
                  key={dep.id}
                  className="flex items-center justify-between px-4 py-3 rounded-xl"
                  style={{ background: "rgba(0,15,30,0.5)", border: "1px solid rgba(61,214,245,0.07)" }}
                >
                  <div className="flex items-center gap-3">
                    <StatusIcon size={16} style={{ color: cfg.color }} />
                    <div>
                      <div className="text-sm font-medium" style={{ color: "rgba(168,237,255,0.85)" }}>
                        ${parseFloat(String(dep.amount)).toFixed(2)} USDT
                      </div>
                      <div className="text-xs" style={{ color: "rgba(168,237,255,0.35)" }}>
                        {new Date(dep.createdAt).toLocaleDateString()} · {cfg.label}
                      </div>
                    </div>
                  </div>
                  {dep.sweepTxHash && (
                    <a
                      href={`https://bscscan.com/tx/${dep.sweepTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: TEAL }}
                    >
                      <ExternalLink size={13} />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
