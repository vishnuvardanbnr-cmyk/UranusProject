import { useEffect, useMemo, useState } from "react";
import { useListAdminUsers, useUpdateAdminUser, getListAdminUsersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Users, Search, CheckCircle, XCircle, Shield, Pencil, X,
  Wallet, ArrowDownToLine, ArrowLeftRight, TrendingUp, Save, Ban, AlertTriangle,
} from "lucide-react";
import { Input } from "@/components/ui/input";

const TEAL = "#3DD6F5";
const RED = "#f87171";
const GREEN = "#34d399";
const AMBER = "#fbbf24";
const GLASS = { background: "rgba(5,18,32,0.65)", backdropFilter: "blur(14px)", border: "1px solid rgba(61,214,245,0.10)" } as const;
const INPUT_STYLE = { background: "rgba(0,15,30,0.7)", border: "1px solid rgba(61,214,245,0.18)", color: "rgba(168,237,255,0.9)" };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

type AdminUser = {
  id: number; name: string; email: string; phone: string; country?: string | null;
  walletAddress?: string | null; referralCode: string;
  isAdmin: boolean; isActive: boolean;
  withdrawalBlocked: boolean; p2pBlocked: boolean; investmentBlocked: boolean;
  blockReason?: string | null;
  walletBalance: number; hyperCoinBalance: number;
  totalInvested: number; totalEarnings: number;
  currentLevel: number; createdAt: string;
};

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const { data: users, isLoading } = useListAdminUsers();
  const queryClient = useQueryClient();

  const userList: AdminUser[] = (users as any)?.users ?? [];
  const filtered = useMemo(() => userList.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.phone.includes(search) ||
    u.referralCode.toLowerCase().includes(search.toLowerCase())
  ), [userList, search]);

  const blockedCount = userList.filter(u => !u.isActive || u.withdrawalBlocked || u.p2pBlocked || u.investmentBlocked).length;

  return (
    <div className="px-4 py-6 max-w-4xl mx-auto space-y-5 pb-24 md:pb-8">
      <div className="flex items-center gap-3">
        <div className="flex-1">
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
            Manage Users
          </h1>
          <p className="text-xs" style={{ color: "rgba(168,237,255,0.4)" }}>
            Edit profile · block withdrawals · block P2P · adjust balances
          </p>
        </div>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl p-3 text-center" style={GLASS}>
          <div className="text-lg font-bold" style={{ color: TEAL }}>{(users as any)?.total ?? userList.length}</div>
          <div className="text-xs" style={{ color: "rgba(168,237,255,0.4)" }}>Total</div>
        </div>
        <div className="rounded-xl p-3 text-center" style={GLASS}>
          <div className="text-lg font-bold" style={{ color: GREEN }}>{userList.filter(u => u.isActive).length}</div>
          <div className="text-xs" style={{ color: "rgba(168,237,255,0.4)" }}>Active</div>
        </div>
        <div className="rounded-xl p-3 text-center" style={GLASS}>
          <div className="text-lg font-bold" style={{ color: blockedCount > 0 ? AMBER : "rgba(168,237,255,0.5)" }}>{blockedCount}</div>
          <div className="text-xs" style={{ color: "rgba(168,237,255,0.4)" }}>Restricted</div>
        </div>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(168,237,255,0.35)" }} />
        <Input
          data-testid="input-search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name, email, phone, referral…"
          className="pl-9"
          style={INPUT_STYLE}
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="rounded-xl h-20 animate-pulse" style={{ background: "rgba(61,214,245,0.04)", border: "1px solid rgba(61,214,245,0.08)" }} />)}
        </div>
      ) : !filtered.length ? (
        <div className="rounded-xl p-8 text-center" style={GLASS}>
          <Users size={32} className="mx-auto mb-2" style={{ color: "rgba(168,237,255,0.2)" }} />
          <p className="text-sm" style={{ color: "rgba(168,237,255,0.35)" }}>No users found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(user => {
            const restricted = !user.isActive || user.withdrawalBlocked || user.p2pBlocked || user.investmentBlocked;
            return (
              <button
                key={user.id}
                data-testid={`row-user-${user.id}`}
                onClick={() => setEditing(user)}
                className="w-full text-left rounded-xl p-4 transition-all hover:brightness-110"
                style={GLASS}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0"
                      style={{
                        background: "rgba(61,214,245,0.10)",
                        border: "1px solid rgba(61,214,245,0.2)",
                        color: TEAL,
                      }}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <div className="font-semibold text-sm truncate" style={{ color: "rgba(168,237,255,0.85)" }}>{user.name}</div>
                        {user.isAdmin && <Shield size={12} style={{ color: "#f97316" }} className="shrink-0" />}
                      </div>
                      <div className="text-xs truncate" style={{ color: "rgba(168,237,255,0.4)" }}>{user.email}</div>
                      <div className="text-xs" style={{ color: "rgba(168,237,255,0.3)" }}>{user.phone} · {user.country || "—"}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span
                      className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={user.isActive ? {
                        background: "rgba(52,211,153,0.10)", border: "1px solid rgba(52,211,153,0.25)", color: GREEN,
                      } : {
                        background: "rgba(248,113,113,0.10)", border: "1px solid rgba(248,113,113,0.25)", color: RED,
                      }}
                    >
                      {user.isActive ? <CheckCircle size={11} /> : <XCircle size={11} />}
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                    {restricted && user.isActive && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(251,191,36,0.10)", border: "1px solid rgba(251,191,36,0.25)", color: AMBER }}>
                        <AlertTriangle size={10} />
                        {[user.withdrawalBlocked && "WD", user.p2pBlocked && "P2P", user.investmentBlocked && "INV"].filter(Boolean).join(" ")}
                      </span>
                    )}
                  </div>
                </div>
                <div
                  className="grid grid-cols-4 gap-2 mt-3 pt-3 text-center"
                  style={{ borderTop: "1px solid rgba(61,214,245,0.07)" }}
                >
                  <div>
                    <div className="font-semibold text-xs" style={{ color: "rgba(168,237,255,0.8)" }}>${user.walletBalance.toFixed(2)}</div>
                    <div className="text-[10px]" style={{ color: "rgba(168,237,255,0.35)" }}>USDT</div>
                  </div>
                  <div>
                    <div className="font-semibold text-xs" style={{ color: "rgba(168,237,255,0.8)" }}>${user.totalInvested.toFixed(0)}</div>
                    <div className="text-[10px]" style={{ color: "rgba(168,237,255,0.35)" }}>Invested</div>
                  </div>
                  <div>
                    <div className="font-semibold text-xs" style={{ color: "rgba(168,237,255,0.8)" }}>L{user.currentLevel}</div>
                    <div className="text-[10px]" style={{ color: "rgba(168,237,255,0.35)" }}>Level</div>
                  </div>
                  <div className="flex items-center justify-center">
                    <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: TEAL }}>
                      <Pencil size={11} /> Edit
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {editing && (
        <EditUserDrawer
          user={editing}
          onClose={() => setEditing(null)}
          onSaved={async (updated?: AdminUser) => {
            if (updated) setEditing(updated);
            await queryClient.refetchQueries({ queryKey: getListAdminUsersQueryKey(), exact: false });
            if (!updated) setEditing(null);
          }}
        />
      )}
    </div>
  );
}

/* ───────────────────────── Edit Drawer ───────────────────────── */

function EditUserDrawer({ user, onClose, onSaved }: { user: AdminUser; onClose: () => void; onSaved: (updated?: AdminUser) => void }) {
  const { toast } = useToast();
  const updateUser = useUpdateAdminUser();

  const [tab, setTab] = useState<"profile" | "access" | "balance">("profile");

  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);
  const [country, setCountry] = useState(user.country ?? "");
  const [walletAddress, setWalletAddress] = useState(user.walletAddress ?? "");

  const [isActive, setIsActive] = useState(user.isActive);
  const [isAdmin, setIsAdmin] = useState(user.isAdmin);
  const [withdrawalBlocked, setWithdrawalBlocked] = useState(user.withdrawalBlocked);
  const [p2pBlocked, setP2pBlocked] = useState(user.p2pBlocked);
  const [investmentBlocked, setInvestmentBlocked] = useState(user.investmentBlocked);
  const [blockReason, setBlockReason] = useState(user.blockReason ?? "");

  const [walletBalance, setWalletBalance] = useState(user.walletBalance.toString());
  const [hyperCoinBalance, setHyperCoinBalance] = useState(user.hyperCoinBalance.toString());
  const [currentLevel, setCurrentLevel] = useState(user.currentLevel.toString());

  // Lock background scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  async function handleSave() {
    const body: Record<string, unknown> = {};
    if (name !== user.name) body.name = name.trim();
    if (email !== user.email) body.email = email.trim();
    if (phone !== user.phone) body.phone = phone.trim();
    if ((country || null) !== (user.country || null)) body.country = country.trim() || null;
    if ((walletAddress || null) !== (user.walletAddress || null)) body.walletAddress = walletAddress.trim() || null;
    if (isActive !== user.isActive) body.isActive = isActive;
    if (isAdmin !== user.isAdmin) body.isAdmin = isAdmin;
    if (withdrawalBlocked !== user.withdrawalBlocked) body.withdrawalBlocked = withdrawalBlocked;
    if (p2pBlocked !== user.p2pBlocked) body.p2pBlocked = p2pBlocked;
    if (investmentBlocked !== user.investmentBlocked) body.investmentBlocked = investmentBlocked;
    if ((blockReason || null) !== (user.blockReason || null)) body.blockReason = blockReason.trim() || null;
    const lvl = parseInt(currentLevel, 10);
    if (!Number.isNaN(lvl) && lvl !== user.currentLevel) body.currentLevel = lvl;
    const wb = parseFloat(walletBalance);
    if (!Number.isNaN(wb) && Math.abs(wb - user.walletBalance) > 1e-6) body.walletBalance = wb;
    const hb = parseFloat(hyperCoinBalance);
    if (!Number.isNaN(hb) && Math.abs(hb - user.hyperCoinBalance) > 1e-6) body.hyperCoinBalance = hb;

    if (Object.keys(body).length === 0) {
      toast({ title: "No changes to save" });
      return;
    }

    try {
      const updated = await updateUser.mutateAsync({ id: user.id, data: body as any });
      toast({ title: "User updated" });
      onSaved(updated as unknown as AdminUser);
    } catch (err: any) {
      toast({
        title: "Update failed",
        description: err?.response?.data?.message ?? err?.message ?? "Try again",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" style={{ background: "rgba(0,5,15,0.75)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div
        data-testid="drawer-edit-user"
        onClick={e => e.stopPropagation()}
        className="w-full md:max-w-lg max-h-[92vh] md:max-h-[85vh] rounded-t-2xl md:rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: "rgba(5,15,28,0.96)",
          border: "1px solid rgba(61,214,245,0.18)",
          boxShadow: "0 -10px 60px rgba(61,214,245,0.10)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(61,214,245,0.10)" }}>
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0"
              style={{ background: "rgba(61,214,245,0.10)", border: "1px solid rgba(61,214,245,0.25)", color: TEAL }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-sm truncate" style={{ color: "rgba(168,237,255,0.9)" }}>{user.name}</div>
              <div className="text-xs truncate" style={{ color: "rgba(168,237,255,0.4)" }}>{user.email}</div>
            </div>
          </div>
          <button
            data-testid="button-close-drawer"
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <X size={16} style={{ color: "rgba(168,237,255,0.7)" }} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-3 pt-3">
          {([
            { id: "profile", label: "Profile" },
            { id: "access", label: "Access" },
            { id: "balance", label: "Balance" },
          ] as const).map(t => (
            <button
              key={t.id}
              data-testid={`tab-${t.id}`}
              onClick={() => setTab(t.id)}
              className="flex-1 text-xs font-semibold py-2 rounded-lg transition-all"
              style={tab === t.id ? {
                background: "rgba(61,214,245,0.15)",
                border: "1px solid rgba(61,214,245,0.35)",
                color: TEAL,
              } : {
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.05)",
                color: "rgba(168,237,255,0.55)",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {tab === "profile" && (
            <>
              <Field label="Full name">
                <Input data-testid="input-name" value={name} onChange={e => setName(e.target.value)} style={INPUT_STYLE} />
              </Field>
              <Field label="Email">
                <Input data-testid="input-email" value={email} onChange={e => setEmail(e.target.value)} style={INPUT_STYLE} type="email" />
              </Field>
              <Field label="Phone">
                <Input data-testid="input-phone" value={phone} onChange={e => setPhone(e.target.value)} style={INPUT_STYLE} />
              </Field>
              <Field label="Country">
                <Input data-testid="input-country" value={country} onChange={e => setCountry(e.target.value)} style={INPUT_STYLE} />
              </Field>
              <Field label="Withdrawal wallet (BEP20)" hint="Leave empty to clear. Format: 0x… 42 chars">
                <Input data-testid="input-wallet" value={walletAddress} onChange={e => setWalletAddress(e.target.value)} style={INPUT_STYLE} placeholder="0x…" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <ReadOnly label="Referral code" value={user.referralCode} />
                <ReadOnly label="Joined" value={formatDate(user.createdAt)} />
              </div>
            </>
          )}

          {tab === "access" && (
            <>
              <Toggle
                testId="toggle-active"
                label="Account active"
                description="When off, the user cannot log in or use the platform at all."
                icon={<Ban size={14} />}
                value={isActive}
                onChange={setIsActive}
                positive
              />
              <Toggle
                testId="toggle-wd-blocked"
                label="Block withdrawals"
                description="User can browse but cannot submit any new withdrawal request."
                icon={<ArrowDownToLine size={14} />}
                value={withdrawalBlocked}
                onChange={setWithdrawalBlocked}
              />
              <Toggle
                testId="toggle-p2p-blocked"
                label="Block P2P transfers"
                description="User cannot send USDT or HYPERCOIN to other users."
                icon={<ArrowLeftRight size={14} />}
                value={p2pBlocked}
                onChange={setP2pBlocked}
              />
              <Toggle
                testId="toggle-invest-blocked"
                label="Block new investments"
                description="User cannot start new investment plans. Existing plans keep paying."
                icon={<TrendingUp size={14} />}
                value={investmentBlocked}
                onChange={setInvestmentBlocked}
              />
              <Toggle
                testId="toggle-admin"
                label="Admin access"
                description="Grants full access to the admin dashboard."
                icon={<Shield size={14} />}
                value={isAdmin}
                onChange={setIsAdmin}
                warning
              />
              <Field label="Block reason (shown to user)" hint="Optional. Visible in error message when they hit a blocked action.">
                <textarea
                  data-testid="input-block-reason"
                  value={blockReason}
                  onChange={e => setBlockReason(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none resize-none"
                  style={INPUT_STYLE}
                  placeholder="e.g. Pending KYC verification"
                />
              </Field>
            </>
          )}

          {tab === "balance" && (
            <>
              <div className="rounded-xl p-3 flex items-start gap-2" style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.18)" }}>
                <AlertTriangle size={14} style={{ color: AMBER }} className="shrink-0 mt-0.5" />
                <div className="text-xs" style={{ color: "rgba(168,237,255,0.7)" }}>
                  Manual balance edits bypass deposits, withdrawals, and earnings logic. Use only to correct genuine accounting errors.
                </div>
              </div>
              <Field label="Wallet balance (USDT)">
                <Input
                  data-testid="input-wallet-balance"
                  type="number"
                  step="0.01"
                  value={walletBalance}
                  onChange={e => setWalletBalance(e.target.value)}
                  style={INPUT_STYLE}
                />
              </Field>
              <Field label="HyperCoin balance">
                <Input
                  data-testid="input-hyper-balance"
                  type="number"
                  step="0.01"
                  value={hyperCoinBalance}
                  onChange={e => setHyperCoinBalance(e.target.value)}
                  style={INPUT_STYLE}
                />
              </Field>
              <Field label="Current level">
                <Input
                  data-testid="input-level"
                  type="number"
                  step="1"
                  min="0"
                  value={currentLevel}
                  onChange={e => setCurrentLevel(e.target.value)}
                  style={INPUT_STYLE}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <ReadOnly label="Total invested" value={`$${user.totalInvested.toFixed(2)}`} />
                <ReadOnly label="Total earnings" value={`$${user.totalEarnings.toFixed(2)}`} />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 py-4" style={{ borderTop: "1px solid rgba(61,214,245,0.10)" }}>
          <button
            data-testid="button-cancel"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(168,237,255,0.7)" }}
          >
            Cancel
          </button>
          <button
            data-testid="button-save"
            onClick={handleSave}
            disabled={updateUser.isPending}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, rgba(61,214,245,0.25), rgba(61,214,245,0.10))", border: "1px solid rgba(61,214,245,0.45)", color: TEAL }}
          >
            <Save size={14} />
            {updateUser.isPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ──────────── Small bits ──────────── */

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold mb-1.5 block" style={{ color: "rgba(168,237,255,0.65)" }}>{label}</label>
      {children}
      {hint && <p className="text-[10px] mt-1" style={{ color: "rgba(168,237,255,0.35)" }}>{hint}</p>}
    </div>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl px-3 py-2" style={{ background: "rgba(0,15,30,0.4)", border: "1px solid rgba(61,214,245,0.08)" }}>
      <div className="text-[10px] uppercase tracking-wide" style={{ color: "rgba(168,237,255,0.35)" }}>{label}</div>
      <div className="text-sm font-medium truncate" style={{ color: "rgba(168,237,255,0.85)" }}>{value}</div>
    </div>
  );
}

function Toggle({
  testId, label, description, icon, value, onChange, positive, warning,
}: {
  testId: string; label: string; description?: string; icon?: React.ReactNode;
  value: boolean; onChange: (v: boolean) => void; positive?: boolean; warning?: boolean;
}) {
  // For "positive" toggles (like "Account active"), ON is good (teal/green).
  // For block toggles, ON means blocked → red. For admin, ON means admin → amber.
  const onColor = positive ? GREEN : warning ? AMBER : RED;
  const onBg = positive ? "rgba(52,211,153,0.18)" : warning ? "rgba(251,191,36,0.18)" : "rgba(248,113,113,0.18)";
  const onBorder = positive ? "rgba(52,211,153,0.45)" : warning ? "rgba(251,191,36,0.45)" : "rgba(248,113,113,0.45)";

  return (
    <div className="rounded-xl p-3 flex items-start gap-3" style={GLASS}>
      {icon && (
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: value ? onBg : "rgba(61,214,245,0.06)", border: `1px solid ${value ? onBorder : "rgba(61,214,245,0.15)"}`, color: value ? onColor : "rgba(168,237,255,0.5)" }}>
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold" style={{ color: "rgba(168,237,255,0.9)" }}>{label}</div>
        {description && <div className="text-[11px] mt-0.5" style={{ color: "rgba(168,237,255,0.45)" }}>{description}</div>}
      </div>
      <button
        data-testid={testId}
        onClick={() => onChange(!value)}
        role="switch"
        aria-checked={value}
        className="relative w-11 h-6 rounded-full transition-all shrink-0"
        style={{
          background: value ? onBg : "rgba(255,255,255,0.06)",
          border: `1px solid ${value ? onBorder : "rgba(255,255,255,0.10)"}`,
        }}
      >
        <span
          className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
          style={{
            left: value ? "22px" : "2px",
            background: value ? onColor : "rgba(168,237,255,0.5)",
            boxShadow: value ? `0 0 8px ${onColor}` : "none",
          }}
        />
      </button>
    </div>
  );
}
