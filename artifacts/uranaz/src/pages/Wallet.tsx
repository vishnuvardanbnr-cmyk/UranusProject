import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { QRCodeSVG } from "qrcode.react";
import Pagination from "@/components/Pagination";
import {
  useGetIncomeSummary,
  useListInvestments,
  useListWithdrawals,
} from "@workspace/api-client-react";
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  X,
  CheckCircle,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  Calendar,
  Hash,
  DollarSign,
  Percent,
  Timer,
  MapPin,
  AlertCircle,
  Copy,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";

function getToken() {
  return localStorage.getItem("uranaz_token") || "";
}

/* ────────────────────────────────────────────────
   DEPOSIT MODAL
   ──────────────────────────────────────────────── */
function DepositModal({ onClose }: { onClose: () => void }) {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{ status: string; message: string; amount?: number; sweepTxHash?: string; newBalance?: number } | null>(null);

  useEffect(() => {
    fetch("/api/deposits/address", { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json())
      .then(d => setAddress(d.address))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const copy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const checkDeposit = async () => {
    setChecking(true);
    setResult(null);
    try {
      const res = await fetch("/api/deposits/check", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ status: "failed", message: "Connection error. Please try again." });
    } finally {
      setChecking(false);
    }
  };

  const resultColors: Record<string, string> = {
    credited:  "rgba(52,211,153,0.9)",
    not_found: "rgba(61,214,245,0.7)",
    too_small: "rgba(251,191,36,0.9)",
    failed:    "rgba(248,113,113,0.9)",
    sweeping:  TEAL,
  };

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
          boxShadow: "0 8px 60px rgba(1,8,16,0.9), 0 0 0 1px rgba(61,214,245,0.06)",
          maxHeight: "92dvh",
          overflowY: "auto",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top accent bar */}
        <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, transparent, ${TEAL}, transparent)` }} />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgba(61,214,245,0.18), rgba(61,214,245,0.06))",
                border: "1px solid rgba(61,214,245,0.28)",
                boxShadow: "0 0 16px rgba(61,214,245,0.15)",
              }}
            >
              <ArrowDownLeft size={18} style={{ color: TEAL }} />
            </div>
            <div>
              <div
                className="font-bold tracking-wide"
                style={{ color: "rgba(200,240,255,0.92)", fontFamily: "'Orbitron', sans-serif", fontSize: "0.8rem" }}
              >
                Deposit USDT
              </div>
              <div className="text-xs mt-0.5" style={{ color: "rgba(168,237,255,0.4)" }}>BEP-20 · Binance Smart Chain</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
            style={{ background: "rgba(168,237,255,0.06)", border: "1px solid rgba(168,237,255,0.09)" }}
          >
            <X size={14} style={{ color: "rgba(168,237,255,0.45)" }} />
          </button>
        </div>

        <div className="px-5 pb-6 space-y-4">
          {/* QR Code */}
          <div className="flex justify-center">
            {loading ? (
              <div className="w-44 h-44 rounded-2xl animate-pulse" style={{ background: "rgba(61,214,245,0.06)" }} />
            ) : address ? (
              <div
                className="p-3 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.97)", boxShadow: "0 0 40px rgba(61,214,245,0.18)" }}
              >
                <QRCodeSVG value={address} size={152} bgColor="#fff" fgColor="#010810" level="M" />
              </div>
            ) : (
              <p className="text-sm" style={{ color: "rgba(248,113,113,0.8)" }}>Failed to load address</p>
            )}
          </div>

          {/* Address + Copy */}
          {address && (
            <div className="space-y-1.5">
              <button
                onClick={copy}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all"
                style={{
                  background: "rgba(0,20,40,0.8)",
                  border: `1px solid ${copied ? "rgba(52,211,153,0.5)" : "rgba(61,214,245,0.2)"}`,
                }}
              >
                <span className="text-xs font-mono break-all text-left leading-relaxed" style={{ color: "rgba(168,237,255,0.75)" }}>
                  {address}
                </span>
                {copied
                  ? <CheckCircle2 size={15} className="shrink-0" style={{ color: "rgba(52,211,153,0.9)" }} />
                  : <Copy size={15} className="shrink-0" style={{ color: "rgba(61,214,245,0.55)" }} />
                }
              </button>
              {copied && (
                <div className="flex items-center justify-center gap-1.5 py-1 rounded-lg" style={{ background: "rgba(52,211,153,0.10)", border: "1px solid rgba(52,211,153,0.22)" }}>
                  <CheckCircle2 size={12} style={{ color: "rgba(52,211,153,0.9)" }} />
                  <span className="text-xs font-semibold" style={{ color: "rgba(52,211,153,0.9)" }}>Address Copied!</span>
                </div>
              )}
            </div>
          )}

          {/* Warning */}
          <div
            className="flex gap-2.5 px-3 py-2.5 rounded-xl"
            style={{ background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.16)" }}
          >
            <ShieldAlert size={13} className="shrink-0 mt-0.5" style={{ color: "rgba(251,191,36,0.75)" }} />
            <p className="text-xs leading-relaxed" style={{ color: "rgba(251,191,36,0.75)" }}>
              Send <strong>USDT on BEP-20 (BSC) only</strong>. Other networks or tokens will result in permanent loss.
            </p>
          </div>

          {/* Check Deposit Button */}
          <button
            onClick={checkDeposit}
            disabled={checking || !address}
            className="w-full py-3.5 rounded-2xl font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            style={{
              background: result?.status === "credited"
                ? "linear-gradient(135deg, #34d399, #10b981)"
                : "linear-gradient(135deg, #3DD6F5, #2AB3CF)",
              color: "#010810",
              fontFamily: "'Orbitron', sans-serif",
              fontSize: "0.75rem",
              letterSpacing: "0.05em",
              boxShadow: "0 0 24px rgba(61,214,245,0.25)",
            }}
          >
            {checking ? (
              <><RefreshCw size={15} className="animate-spin" /> Checking…</>
            ) : result?.status === "credited" ? (
              <><CheckCircle2 size={15} /> Credited!</>
            ) : (
              <><RefreshCw size={15} /> Check Deposit</>
            )}
          </button>

          {/* Result */}
          {result && (
            <div
              className="px-4 py-3 rounded-xl space-y-1.5"
              style={{
                background: result.status === "credited" ? "rgba(52,211,153,0.06)" : result.status === "not_found" ? "rgba(61,214,245,0.05)" : "rgba(248,113,113,0.05)",
                border: `1px solid ${result.status === "credited" ? "rgba(52,211,153,0.22)" : result.status === "not_found" ? "rgba(61,214,245,0.15)" : "rgba(248,113,113,0.22)"}`,
              }}
            >
              <p className="text-xs font-medium" style={{ color: resultColors[result.status] ?? "rgba(168,237,255,0.7)" }}>
                {result.message}
              </p>
              {result.status === "credited" && (
                <>
                  {result.newBalance !== undefined && (
                    <p className="text-xs" style={{ color: "rgba(168,237,255,0.45)" }}>
                      New balance: <strong style={{ color: TEAL }}>${result.newBalance.toFixed(2)}</strong>
                    </p>
                  )}
                  {result.sweepTxHash && (
                    <a
                      href={`https://bscscan.com/tx/${result.sweepTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs"
                      style={{ color: TEAL }}
                    >
                      <ExternalLink size={11} /> View on BSCScan
                    </a>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const TEAL = "#3DD6F5";
const GLASS = {
  background: "rgba(5,18,32,0.65)",
  backdropFilter: "blur(14px)",
  border: "1px solid rgba(61,214,245,0.10)",
} as const;

/* ────────────────────────────────────────────────
   TRANSFER MODAL (USDT ↔ HYPERCOIN)
   ──────────────────────────────────────────────── */
function TransferModal({
  usdtBalance,
  hyperBalance,
  onClose,
  onSuccess,
}: {
  usdtBalance: number;
  hyperBalance: number;
  onClose: () => void;
  onSuccess: (usdt: number, hyper: number) => void;
}) {
  const [direction, setDirection] = useState<"usdt_to_hypercoin" | "hypercoin_to_usdt">("usdt_to_hypercoin");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const fromLabel = direction === "usdt_to_hypercoin" ? "USDT" : "HYPERCOIN";
  const toLabel   = direction === "usdt_to_hypercoin" ? "HYPERCOIN" : "USDT";
  const fromBal   = direction === "usdt_to_hypercoin" ? usdtBalance : hyperBalance;
  const fromColor = direction === "usdt_to_hypercoin" ? TEAL : "#b87fff";
  const toColor   = direction === "usdt_to_hypercoin" ? "#b87fff" : TEAL;

  const handleSubmit = async () => {
    setError(null);
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { setError("Enter a valid amount"); return; }
    if (amt > fromBal)    { setError(`Insufficient ${fromLabel} balance`); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/wallet/internal-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ direction, amount: amt }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Transfer failed"); return; }
      setDone(true);
      onSuccess(data.walletBalance, data.hyperCoinBalance);
      setTimeout(onClose, 1500);
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, transparent, #b87fff, #3DD6F5, transparent)" }} />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, rgba(184,127,255,0.18), rgba(61,214,245,0.08))", border: "1px solid rgba(184,127,255,0.3)" }}
            >
              <ArrowLeftRight size={17} style={{ color: "#b87fff" }} />
            </div>
            <div>
              <div className="font-bold tracking-wide" style={{ color: "rgba(200,240,255,0.92)", fontFamily: "'Orbitron', sans-serif", fontSize: "0.8rem" }}>
                Internal Transfer
              </div>
              <div className="text-xs mt-0.5" style={{ color: "rgba(168,237,255,0.4)" }}>USDT ↔ HYPERCOIN</div>
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

        <div className="px-5 pb-6 space-y-4">
          {/* Direction Toggle */}
          <div className="grid grid-cols-2 gap-2 rounded-xl p-1" style={{ background: "rgba(0,20,40,0.6)", border: "1px solid rgba(61,214,245,0.10)" }}>
            {(["usdt_to_hypercoin", "hypercoin_to_usdt"] as const).map(d => (
              <button
                key={d}
                onClick={() => { setDirection(d); setAmount(""); setError(null); }}
                className="rounded-lg py-2 text-xs font-semibold transition-all"
                style={direction === d ? {
                  background: "linear-gradient(135deg, rgba(184,127,255,0.20), rgba(61,214,245,0.10))",
                  color: "rgba(200,240,255,0.92)",
                  border: "1px solid rgba(184,127,255,0.28)",
                } : { color: "rgba(168,237,255,0.4)" }}
              >
                {d === "usdt_to_hypercoin" ? "USDT → HC" : "HC → USDT"}
              </button>
            ))}
          </div>

          {/* Balance pills */}
          <div className="flex gap-2">
            <div className="flex-1 rounded-xl px-3 py-2.5" style={{ background: "rgba(61,214,245,0.06)", border: "1px solid rgba(61,214,245,0.12)" }}>
              <div className="text-xs mb-0.5" style={{ color: "rgba(168,237,255,0.4)" }}>USDT Balance</div>
              <div className="font-bold text-sm" style={{ color: TEAL }}>${usdtBalance.toFixed(2)}</div>
            </div>
            <div className="flex-1 rounded-xl px-3 py-2.5" style={{ background: "rgba(184,127,255,0.06)", border: "1px solid rgba(184,127,255,0.14)" }}>
              <div className="text-xs mb-0.5" style={{ color: "rgba(168,237,255,0.4)" }}>HYPERCOIN Balance</div>
              <div className="font-bold text-sm" style={{ color: "#b87fff" }}>${hyperBalance.toFixed(2)}</div>
            </div>
          </div>

          {/* From / To display */}
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-xl px-3 py-2 text-center" style={{ background: "rgba(0,20,40,0.5)", border: `1px solid ${fromColor}25` }}>
              <div className="text-xs mb-0.5" style={{ color: "rgba(168,237,255,0.4)" }}>From</div>
              <div className="font-bold text-xs" style={{ color: fromColor }}>{fromLabel}</div>
            </div>
            <ArrowLeftRight size={14} style={{ color: "rgba(168,237,255,0.3)", flexShrink: 0 }} />
            <div className="flex-1 rounded-xl px-3 py-2 text-center" style={{ background: "rgba(0,20,40,0.5)", border: `1px solid ${toColor}25` }}>
              <div className="text-xs mb-0.5" style={{ color: "rgba(168,237,255,0.4)" }}>To</div>
              <div className="font-bold text-xs" style={{ color: toColor }}>{toLabel}</div>
            </div>
          </div>

          {/* Amount input */}
          <div>
            <label className="block text-xs mb-1.5" style={{ color: "rgba(168,237,255,0.55)" }}>
              Amount ({fromLabel}) — Available: ${fromBal.toFixed(2)}
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={e => { setAmount(e.target.value); setError(null); }}
                placeholder="0.00"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{ background: "rgba(0,20,40,0.7)", border: `1px solid ${error ? "rgba(248,113,113,0.4)" : "rgba(61,214,245,0.18)"}`, color: "rgba(168,237,255,0.9)" }}
              />
              <button
                onClick={() => setAmount(fromBal.toFixed(2))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs px-2 py-0.5 rounded-md"
                style={{ background: "rgba(61,214,245,0.12)", color: TEAL }}
              >
                MAX
              </button>
            </div>
            {error && <p className="text-xs mt-1.5" style={{ color: "#f87171" }}>{error}</p>}
          </div>

          {/* Submit */}
          {done ? (
            <div className="flex items-center justify-center gap-2 py-3 rounded-2xl" style={{ background: "rgba(52,211,153,0.10)", border: "1px solid rgba(52,211,153,0.25)" }}>
              <CheckCircle2 size={16} style={{ color: "#34d399" }} />
              <span className="text-sm font-semibold" style={{ color: "#34d399" }}>Transfer Successful!</span>
            </div>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading || !amount}
              className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              style={{
                background: "linear-gradient(135deg, #b87fff, #8b5cf6)",
                color: "#fff",
                boxShadow: "0 0 20px rgba(184,127,255,0.25)",
                letterSpacing: "0.04em",
              }}
            >
              {loading
                ? <><RefreshCw size={15} className="animate-spin" /> Processing…</>
                : <><ArrowLeftRight size={15} /> Transfer {amount ? `$${parseFloat(amount).toFixed(2)}` : ""}</>
              }
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────
   P2P TRANSFER MODAL
   ──────────────────────────────────────────────── */
function P2PModal({ usdtBalance, hyperBalance, hyperEnabled, onClose, onSuccess }: {
  usdtBalance: number;
  hyperBalance: number;
  hyperEnabled: boolean;
  onClose: () => void;
  onSuccess: (newUsdt: number, newHyper: number) => void;
}) {
  const [currency, setCurrency] = useState<"usdt" | "hypercoin">("usdt");
  const [userId, setUserId] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState<{ id: number; name: string; email: string } | null>(null);
  const [verifyError, setVerifyError] = useState("");
  const [amount, setAmount] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState("");

  const activeBal = currency === "usdt" ? usdtBalance : hyperBalance;
  const coinColor = currency === "usdt" ? TEAL : "#b87fff";
  const coinLabel = currency === "usdt" ? "USDT" : "HYPERCOIN";

  const handleVerify = async () => {
    setVerified(null); setVerifyError("");
    const id = parseInt(userId, 10);
    if (!id || isNaN(id)) { setVerifyError("Enter a valid numeric user ID"); return; }
    setVerifying(true);
    try {
      const res = await fetch(`/api/wallet/p2p/lookup?userId=${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("uranaz_token") || ""}` },
      });
      const data = await res.json();
      if (!res.ok) { setVerifyError(data.message || "User not found"); return; }
      setVerified(data);
    } catch { setVerifyError("Connection error"); }
    finally { setVerifying(false); }
  };

  const handleSend = async () => {
    if (!verified) return;
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { setSendError("Enter a valid amount"); return; }
    if (amt > activeBal) { setSendError(`Insufficient balance. Available: $${activeBal.toFixed(2)}`); return; }
    setSending(true); setSendError("");
    try {
      const res = await fetch("/api/wallet/p2p/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("uranaz_token") || ""}` },
        body: JSON.stringify({ recipientId: verified.id, amount: amt, currency }),
      });
      const data = await res.json();
      if (!res.ok) { setSendError(data.message || "Transfer failed"); return; }
      setSent(true);
      onSuccess(data.walletBalance, data.hyperCoinBalance);
    } catch { setSendError("Connection error"); }
    finally { setSending(false); }
  };

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
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, transparent, #3DD6F5, transparent)" }} />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, rgba(61,214,245,0.18), rgba(61,214,245,0.06))", border: "1px solid rgba(61,214,245,0.28)" }}>
              <ArrowUpRight size={17} style={{ color: TEAL }} />
            </div>
            <div>
              <div className="font-bold" style={{ color: "rgba(200,240,255,0.92)", fontFamily: "'Orbitron', sans-serif", fontSize: "0.8rem" }}>P2P Transfer</div>
              <div className="text-xs mt-0.5" style={{ color: "rgba(168,237,255,0.35)" }}>Send to another user</div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(168,237,255,0.06)", border: "1px solid rgba(168,237,255,0.09)" }}>
            <X size={14} style={{ color: "rgba(168,237,255,0.45)" }} />
          </button>
        </div>

        <div className="px-5 pb-6 space-y-4">
          {sent ? (
            <div className="text-center py-6">
              <CheckCircle2 size={48} className="mx-auto mb-3" style={{ color: "#34d399" }} />
              <div className="font-bold text-sm mb-1" style={{ color: "#34d399" }}>Transfer Successful!</div>
              <div className="text-xs" style={{ color: "rgba(168,237,255,0.45)" }}>
                ${parseFloat(amount).toFixed(2)} {coinLabel} sent to {verified?.name}
              </div>
              <button onClick={onClose} className="mt-5 w-full py-3 rounded-2xl font-bold text-xs"
                style={{ background: "linear-gradient(135deg, #3DD6F5, #2AB3CF)", color: "#010810" }}>
                Done
              </button>
            </div>
          ) : (
            <>
              {/* Currency toggle */}
              {hyperEnabled && (
                <div className="flex rounded-xl p-1" style={{ background: "rgba(0,20,40,0.6)", border: "1px solid rgba(61,214,245,0.1)" }}>
                  {(["usdt", "hypercoin"] as const).map(c => (
                    <button
                      key={c}
                      onClick={() => { setCurrency(c); setAmount(""); setSendError(""); }}
                      className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
                      style={{
                        background: currency === c
                          ? c === "usdt" ? "linear-gradient(135deg, rgba(61,214,245,0.22), rgba(61,214,245,0.10))" : "linear-gradient(135deg, rgba(184,127,255,0.22), rgba(184,127,255,0.10))"
                          : "transparent",
                        color: currency === c ? (c === "usdt" ? TEAL : "#b87fff") : "rgba(168,237,255,0.35)",
                        border: currency === c ? `1px solid ${c === "usdt" ? "rgba(61,214,245,0.3)" : "rgba(184,127,255,0.3)"}` : "1px solid transparent",
                      }}
                    >
                      {c === "usdt" ? "USDT" : "HYPERCOIN"}
                    </button>
                  ))}
                </div>
              )}

              {/* Available balance */}
              <div className="rounded-xl px-4 py-2.5 text-center"
                style={{ background: `rgba(${currency === "usdt" ? "61,214,245" : "184,127,255"},0.06)`, border: `1px solid rgba(${currency === "usdt" ? "61,214,245" : "184,127,255"},0.12)` }}>
                <div className="text-xs mb-0.5" style={{ color: "rgba(168,237,255,0.4)" }}>Available {coinLabel}</div>
                <div className="font-bold text-sm" style={{ color: coinColor }}>${activeBal.toFixed(2)}</div>
              </div>

              {/* User ID lookup */}
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "rgba(168,237,255,0.55)" }}>Recipient User ID</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={userId}
                    onChange={e => { setUserId(e.target.value); setVerified(null); setVerifyError(""); }}
                    placeholder="Enter user ID..."
                    className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none"
                    style={{
                      background: "rgba(0,20,40,0.6)",
                      border: `1px solid ${verified ? "rgba(52,211,153,0.45)" : verifyError ? "rgba(248,113,113,0.35)" : "rgba(61,214,245,0.15)"}`,
                      color: "rgba(200,240,255,0.9)",
                    }}
                    onKeyDown={e => e.key === "Enter" && handleVerify()}
                  />
                  <button
                    onClick={handleVerify}
                    disabled={verifying || !userId}
                    className="px-4 rounded-xl font-bold text-xs transition-all"
                    style={{
                      background: verified ? "linear-gradient(135deg, rgba(52,211,153,0.2), rgba(52,211,153,0.08))" : "linear-gradient(135deg, rgba(61,214,245,0.2), rgba(61,214,245,0.08))",
                      border: verified ? "1px solid rgba(52,211,153,0.4)" : "1px solid rgba(61,214,245,0.25)",
                      color: verified ? "#34d399" : TEAL,
                      opacity: verifying || !userId ? 0.5 : 1,
                    }}
                  >
                    {verifying ? "..." : verified ? <CheckCircle2 size={16} /> : "Verify"}
                  </button>
                </div>
                {verifyError && <p className="text-xs mt-1.5" style={{ color: "#f87171" }}>{verifyError}</p>}
                {verified && (
                  <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-xl"
                    style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.2)" }}>
                    <CheckCircle2 size={14} style={{ color: "#34d399" }} />
                    <div>
                      <div className="text-xs font-semibold" style={{ color: "#34d399" }}>{verified.name}</div>
                      <div className="text-xs" style={{ color: "rgba(168,237,255,0.35)" }}>{verified.email}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Amount */}
              {verified && (
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: "rgba(168,237,255,0.55)" }}>Amount ({coinLabel})</label>
                  <div className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                    style={{ background: "rgba(0,20,40,0.6)", border: `1px solid rgba(${currency === "usdt" ? "61,214,245" : "184,127,255"},0.15)` }}>
                    <input
                      type="number"
                      value={amount}
                      onChange={e => { setAmount(e.target.value); setSendError(""); }}
                      placeholder="0.00"
                      className="flex-1 bg-transparent outline-none text-sm"
                      style={{ color: "rgba(200,240,255,0.9)" }}
                    />
                    <button
                      onClick={() => setAmount(activeBal.toFixed(2))}
                      className="text-xs font-bold px-2 py-0.5 rounded-lg"
                      style={{ background: `rgba(${currency === "usdt" ? "61,214,245" : "184,127,255"},0.12)`, color: coinColor }}
                    >
                      MAX
                    </button>
                  </div>
                  {sendError && <p className="text-xs mt-1.5" style={{ color: "#f87171" }}>{sendError}</p>}
                </div>
              )}

              {/* Send button */}
              <button
                onClick={handleSend}
                disabled={!verified || !amount || sending}
                className="w-full py-3 rounded-2xl font-bold text-xs transition-all"
                style={{
                  background: !verified || !amount
                    ? "rgba(61,214,245,0.08)"
                    : currency === "usdt"
                      ? "linear-gradient(135deg, #3DD6F5, #2AB3CF)"
                      : "linear-gradient(135deg, #b87fff, #8b5cf6)",
                  color: !verified || !amount ? "rgba(168,237,255,0.3)" : "#010810",
                  boxShadow: verified && amount ? `0 0 24px rgba(${currency === "usdt" ? "61,214,245" : "184,127,255"},0.3)` : "none",
                  cursor: !verified || !amount || sending ? "not-allowed" : "pointer",
                }}
              >
                {sending ? "Sending..." : `Send ${coinLabel}${amount ? ` · $${parseFloat(amount || "0").toFixed(2)}` : ""}`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  pending:   { icon: Clock,        color: "#fbbf24", label: "Pending"   },
  approved:  { icon: CheckCircle,  color: "#34d399", label: "Approved"  },
  rejected:  { icon: XCircle,      color: "#f87171", label: "Rejected"  },
  active:    { icon: TrendingUp,   color: TEAL,      label: "Active"    },
  completed: { icon: CheckCircle,  color: "#34d399", label: "Completed" },
};

const planLabels: Record<string, string> = {
  tier1: "Starter — 0.6%/day · 300 days",
  tier2: "Growth  — 0.7%/day · 260 days",
  tier3: "Premium — 0.8%/day · 225 days",
};

function formatDate(iso: string, full = false) {
  const d = new Date(iso);
  return full
    ? d.toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function shortId(id: string | number) {
  return String(id).slice(0, 8).toUpperCase();
}

/* ────────────────────────────────────────────────
   DETAIL MODAL
   ──────────────────────────────────────────────── */
function DetailModal({ item, type, onClose }: { item: any; type: "deposit" | "withdraw"; onClose: () => void }) {
  const cfg = statusConfig[item.status] || statusConfig.pending;
  const isDeposit = type === "deposit";
  const accentColor = isDeposit ? TEAL : "#f87171";

  const allRows =
    isDeposit
      ? [
          { icon: Hash,       label: "Transaction ID",  value: `#${shortId(item.id)}`,                                           raw: item.id },
          { icon: Calendar,   label: "Date",            value: formatDate(item.createdAt, true),                                  raw: item.createdAt },
          { icon: DollarSign, label: "Total Amount",    value: `$${item.amount?.toFixed(2)}`,                                     raw: item.amount },
          { icon: DollarSign, label: "USDT",            value: item.usdtAmount != null ? `$${item.usdtAmount.toFixed(2)}` : null, raw: item.usdtAmount },
          { icon: DollarSign, label: "HYPERCOIN",       value: item.hyperCoinAmount != null ? `$${item.hyperCoinAmount.toFixed(2)}` : null, raw: item.hyperCoinAmount },
          { icon: Percent,    label: "Plan",            value: item.plan ? (planLabels[item.plan] ?? item.plan) : null,           raw: item.plan },
          { icon: TrendingUp, label: "Expected Return", value: item.expectedReturn != null ? `$${item.expectedReturn.toFixed(2)}` : null, raw: item.expectedReturn },
          { icon: Timer,      label: "Duration",        value: item.durationDays != null ? `${item.durationDays} days` : null,    raw: item.durationDays },
          { icon: Calendar,   label: "Maturity Date",   value: item.maturityDate ? formatDate(item.maturityDate) : null,          raw: item.maturityDate },
        ]
      : [
          { icon: Hash,        label: "Transaction ID", value: `#${shortId(item.id)}`,                                             raw: item.id },
          { icon: Calendar,    label: "Requested",      value: formatDate(item.createdAt, true),                                   raw: item.createdAt },
          { icon: DollarSign,  label: "Amount",         value: `$${item.amount?.toFixed(2)}`,                                      raw: item.amount },
          { icon: MapPin,      label: "Wallet Address", value: item.walletAddress ?? null,                                          raw: item.walletAddress },
          { icon: Calendar,    label: "Processed",      value: item.processedAt ? formatDate(item.processedAt, true) : "Awaiting", raw: true },
          { icon: AlertCircle, label: "Reason",         value: item.rejectionReason ?? null,                                        raw: item.rejectionReason },
        ];

  const rows = allRows.filter(r => r.value !== null);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3"
      style={{ background: "rgba(1,8,16,0.88)", backdropFilter: "blur(10px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(170deg, rgba(4,16,32,0.99) 0%, rgba(2,10,22,0.99) 100%)",
          border: "1px solid rgba(61,214,245,0.16)",
          boxShadow: "0 8px 60px rgba(1,8,16,0.9), 0 0 0 1px rgba(61,214,245,0.06)",
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }} />

        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${accentColor}20, ${accentColor}08)`,
                border: `1px solid ${accentColor}30`,
                boxShadow: `0 0 16px ${accentColor}15`,
              }}
            >
              {isDeposit
                ? <ArrowDownLeft size={17} style={{ color: accentColor }} />
                : <ArrowUpRight  size={17} style={{ color: accentColor }} />}
            </div>
            <div>
              <div
                className="font-bold tracking-wide"
                style={{ color: "rgba(200,240,255,0.92)", fontFamily: "'Orbitron', sans-serif", fontSize: "0.78rem" }}
              >
                {isDeposit ? "Deposit Details" : "Withdrawal Details"}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color, boxShadow: `0 0 6px ${cfg.color}` }} />
                <span className="text-xs font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:brightness-125"
            style={{ background: "rgba(168,237,255,0.06)", border: "1px solid rgba(168,237,255,0.09)" }}
          >
            <X size={14} style={{ color: "rgba(168,237,255,0.45)" }} />
          </button>
        </div>

        <div
          className="mx-5 mb-5 rounded-2xl py-5 text-center"
          style={{
            background: isDeposit
              ? "linear-gradient(135deg, rgba(61,214,245,0.07), rgba(42,179,215,0.03))"
              : "linear-gradient(135deg, rgba(248,113,113,0.07), rgba(220,80,80,0.03))",
            border: `1px solid ${accentColor}20`,
          }}
        >
          <div className="text-xs mb-2 uppercase tracking-widest" style={{ color: "rgba(168,237,255,0.35)" }}>
            {isDeposit ? "Amount Deposited" : "Amount Withdrawn"}
          </div>
          <div
            className="font-black"
            style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: "1.75rem",
              color: accentColor,
              textShadow: `0 0 24px ${accentColor}50`,
            }}
          >
            {isDeposit ? "+" : "−"}${item.amount?.toFixed(2)}
          </div>
        </div>

        <div className="mx-5 mb-4 h-px" style={{ background: "rgba(61,214,245,0.07)" }} />

        <div className="px-5 pb-6 space-y-0">
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
                className="text-xs font-semibold text-right max-w-[55%] break-all leading-relaxed"
                style={{
                  color: row.label === "Transaction ID"
                    ? "rgba(168,237,255,0.55)"
                    : row.label === "Reason"
                      ? "#f87171"
                      : row.label === "Processed" && row.value === "Awaiting"
                        ? "#fbbf24"
                        : "rgba(200,240,255,0.85)",
                  fontFamily: row.label === "Transaction ID" || row.label === "Wallet Address"
                    ? "monospace"
                    : "inherit",
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

/* ────────────────────────────────────────────────
   EMPTY STATE
   ──────────────────────────────────────────────── */
function EmptyState() {
  return (
    <div className="rounded-xl p-12 text-center" style={GLASS}>
      <Wallet size={36} className="mx-auto mb-3" style={{ color: "rgba(168,237,255,0.15)" }} />
      <p className="text-sm" style={{ color: "rgba(168,237,255,0.3)" }}>No transactions yet</p>
    </div>
  );
}

/* ────────────────────────────────────────────────
   MAIN PAGE
   ──────────────────────────────────────────────── */
const WALLET_PAGE_SIZE = 10;
type EntryType = "deposit" | "withdraw";

export default function WalletPage({ user }: { user: any }) {
  const [, setLocation] = useLocation();
  const [selected, setSelected] = useState<{ item: any; type: EntryType } | null>(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showP2PModal, setShowP2PModal] = useState(false);
  const [page, setPage] = useState(1);
  const [localUsdtBal, setLocalUsdtBal] = useState<number | null>(null);
  const [localHyperBal, setLocalHyperBal] = useState<number | null>(null);

  const usdtBalance  = localUsdtBal  ?? (user?.walletBalance ?? 0);
  const hyperBalance = localHyperBal ?? (user?.hyperCoinBalance ?? 0);
  const [hyperEnabled, setHyperEnabled] = useState(true);

  useEffect(() => {
    fetch("/api/settings/public")
      .then(r => r.json())
      .then(d => setHyperEnabled((d.hyperCoinMinPercent ?? 50) > 0))
      .catch(() => {});
  }, []);

  const { data: summary }    = useGetIncomeSummary();
  const { data: investments } = useListInvestments();
  const { data: withdrawals } = useListWithdrawals();

  /* Merge + sort descending by date */
  const combined: { item: any; type: EntryType }[] = [
    ...(investments ?? []).map(inv => ({ item: inv, type: "deposit" as EntryType })),
    ...(withdrawals ?? []).map(w   => ({ item: w,   type: "withdraw" as EntryType })),
  ].sort((a, b) => new Date(b.item.createdAt).getTime() - new Date(a.item.createdAt).getTime());

  const total      = combined.length;
  const totalPages = Math.max(1, Math.ceil(total / WALLET_PAGE_SIZE));
  const paginated  = combined.slice((page - 1) * WALLET_PAGE_SIZE, page * WALLET_PAGE_SIZE);

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-5 pb-28 md:pb-8">

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

      {/* ── Available Balance Hero ── */}
      <div
        className="rounded-2xl p-5 text-center"
        style={{
          background: "linear-gradient(135deg, rgba(61,214,245,0.13), rgba(42,179,215,0.05))",
          border: "1px solid rgba(61,214,245,0.28)",
          boxShadow: "0 0 32px rgba(61,214,245,0.10)",
        }}
      >
        <div className="text-xs uppercase tracking-widest mb-2" style={{ color: "rgba(168,237,255,0.4)" }}>
          Available Balance
        </div>
        <div
          className="font-black"
          style={{ fontFamily: "'Orbitron', sans-serif", color: TEAL, fontSize: "2.2rem", textShadow: `0 0 28px ${TEAL}55`, lineHeight: 1.1 }}
        >
          ${(summary?.availableBalance ?? 0).toFixed(2)}
        </div>
        <div className="text-xs mt-2" style={{ color: "rgba(168,237,255,0.28)" }}>USDT · Ready to withdraw</div>
      </div>

      {/* ── HYPERCOIN Balance (only when enabled) ── */}
      {hyperEnabled && (
        <div
          className="rounded-xl p-4"
          style={{
            background: "linear-gradient(135deg, rgba(184,127,255,0.12), rgba(139,92,246,0.06))",
            border: "1px solid rgba(184,127,255,0.28)",
            boxShadow: "0 0 20px rgba(184,127,255,0.07)",
          }}
        >
          <div className="text-xs mb-1" style={{ color: "rgba(168,237,255,0.4)" }}>HYPERCOIN Balance</div>
          <div className="font-black" style={{ fontFamily: "'Orbitron', sans-serif", color: "#b87fff", fontSize: "1.05rem" }}>
            ${hyperBalance.toFixed(2)}
          </div>
        </div>
      )}

      {/* ── Earnings Stats ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Earnings",     value: summary?.totalEarnings     },
          { label: "Pending Withdrawal", value: summary?.pendingWithdrawal },
          { label: "Total Withdrawn",    value: summary?.withdrawnTotal    },
        ].map(item => (
          <div key={item.label} className="rounded-xl p-3.5" style={GLASS}>
            <div className="text-xs mb-1" style={{ color: "rgba(168,237,255,0.38)" }}>{item.label}</div>
            <div className="font-bold text-sm" style={{ color: "rgba(168,237,255,0.82)" }}>
              ${item.value?.toFixed(2) ?? "0.00"}
            </div>
          </div>
        ))}
      </div>

      {/* ── Action Buttons ── */}
      <div className={`grid gap-2 ${hyperEnabled ? "grid-cols-4" : "grid-cols-3"}`}>
        {/* Deposit */}
        <button
          onClick={() => setShowDepositModal(true)}
          className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl font-bold text-xs transition-all active:scale-[0.97]"
          style={{
            background: "linear-gradient(135deg, #3DD6F5, #2AB3CF)",
            color: "#010810",
            boxShadow: "0 0 24px rgba(61,214,245,0.30)",
          }}
        >
          <ArrowDownLeft size={16} strokeWidth={2.5} />
          Deposit
        </button>

        {/* P2P */}
        <button
          onClick={() => setShowP2PModal(true)}
          className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl font-bold text-xs transition-all active:scale-[0.97]"
          style={{
            background: "linear-gradient(135deg, rgba(52,211,153,0.18), rgba(16,185,129,0.10))",
            border: "1px solid rgba(52,211,153,0.32)",
            color: "#34d399",
            boxShadow: "0 0 20px rgba(52,211,153,0.12)",
          }}
        >
          <ArrowLeftRight size={16} strokeWidth={2.5} />
          P2P
        </button>

        {/* Transfer — only when HYPERCOIN is active */}
        {hyperEnabled && (
          <button
            onClick={() => setShowTransferModal(true)}
            className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl font-bold text-xs transition-all active:scale-[0.97]"
            style={{
              background: "linear-gradient(135deg, rgba(184,127,255,0.18), rgba(139,92,246,0.10))",
              border: "1px solid rgba(184,127,255,0.32)",
              color: "#b87fff",
              boxShadow: "0 0 20px rgba(184,127,255,0.12)",
            }}
          >
            <ArrowLeftRight size={16} strokeWidth={2.5} />
            Swap
          </button>
        )}

        {/* Withdraw */}
        <button
          onClick={() => setLocation("/withdrawals")}
          className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl font-bold text-xs transition-all active:scale-[0.97]"
          style={{
            background: "linear-gradient(135deg, rgba(248,113,113,0.18), rgba(220,60,60,0.12))",
            border: "1px solid rgba(248,113,113,0.35)",
            color: "#f87171",
            boxShadow: "0 0 20px rgba(248,113,113,0.12)",
          }}
        >
          <ArrowUpRight size={16} strokeWidth={2.5} />
          Withdraw
        </button>
      </div>

      {/* ── Section Label ── */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: "rgba(61,214,245,0.08)" }} />
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(168,237,255,0.28)" }}>
          Transaction History
        </span>
        <div className="flex-1 h-px" style={{ background: "rgba(61,214,245,0.08)" }} />
      </div>

      {/* ── Combined History ── */}
      {combined.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-2.5">
          {paginated.map(({ item, type }) => {
            const isDeposit = type === "deposit";
            const cfg = statusConfig[item.status] || statusConfig.pending;
            const accentColor = isDeposit ? TEAL : "#f87171";

            return (
              <button
                key={`${type}-${item.id}`}
                onClick={() => setSelected({ item, type })}
                className="w-full rounded-xl px-4 py-3.5 flex items-center justify-between text-left transition-all hover:brightness-125 active:scale-[0.99]"
                style={{ ...GLASS, cursor: "pointer" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${accentColor}12`, border: `1px solid ${accentColor}28` }}
                  >
                    {isDeposit
                      ? <ArrowDownLeft size={16} style={{ color: accentColor }} />
                      : <ArrowUpRight  size={16} style={{ color: accentColor }} />}
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: "rgba(168,237,255,0.85)" }}>
                      {isDeposit ? "Deposit" : "Withdrawal"}{" "}
                      <span className="font-mono text-xs" style={{ color: "rgba(168,237,255,0.35)" }}>#{shortId(item.id)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs mt-0.5">
                      <cfg.icon size={10} style={{ color: cfg.color }} />
                      <span style={{ color: cfg.color }}>{cfg.label}</span>
                      <span style={{ color: "rgba(168,237,255,0.25)" }}>·</span>
                      <span style={{ color: "rgba(168,237,255,0.35)" }}>{formatDate(item.createdAt)}</span>
                    </div>
                    {isDeposit && item.plan && (
                      <div className="text-xs mt-0.5" style={{ color: "rgba(168,237,255,0.25)" }}>
                        {planLabels[item.plan] ?? item.plan}
                      </div>
                    )}
                    {!isDeposit && item.walletAddress && (
                      <div className="text-xs mt-0.5 truncate max-w-[160px]" style={{ color: "rgba(168,237,255,0.25)" }}>
                        {item.walletAddress}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <div
                    className="font-bold text-sm"
                    style={{ color: isDeposit ? TEAL : "#f87171" }}
                  >
                    {isDeposit ? "+" : "−"}${item.amount?.toFixed(2)}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "rgba(168,237,255,0.28)" }}>Tap for details</div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={WALLET_PAGE_SIZE}
        onPrev={() => setPage(p => Math.max(1, p - 1))}
        onNext={() => setPage(p => Math.min(totalPages, p + 1))}
      />

      {/* Detail Modal */}
      {selected && (
        <DetailModal
          item={selected.item}
          type={selected.type}
          onClose={() => setSelected(null)}
        />
      )}

      {/* Deposit Modal */}
      {showDepositModal && (
        <DepositModal onClose={() => setShowDepositModal(false)} />
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <TransferModal
          usdtBalance={usdtBalance}
          hyperBalance={hyperBalance}
          onClose={() => setShowTransferModal(false)}
          onSuccess={(usdt, hyper) => {
            setLocalUsdtBal(usdt);
            setLocalHyperBal(hyper);
          }}
        />
      )}

      {/* P2P Modal */}
      {showP2PModal && (
        <P2PModal
          usdtBalance={usdtBalance}
          hyperBalance={hyperBalance}
          hyperEnabled={hyperEnabled}
          onClose={() => setShowP2PModal(false)}
          onSuccess={(newUsdt, newHyper) => {
            setLocalUsdtBal(newUsdt);
            setLocalHyperBal(newHyper);
          }}
        />
      )}
    </div>
  );
}
