import { useState } from "react";
import { useLocation } from "wouter";
import { useListAdminUsers, useUpdateAdminUser, getListAdminUsersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Users, Search, CheckCircle, XCircle, Shield, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";

const TEAL = "#3DD6F5";
const GLASS = { background: "rgba(5,18,32,0.65)", backdropFilter: "blur(14px)", border: "1px solid rgba(61,214,245,0.10)" } as const;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminUsers() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const { data: users, isLoading } = useListAdminUsers();
  const updateUser = useUpdateAdminUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const userList = (users as any)?.users ?? users ?? [];
  const filtered = userList.filter((u: any) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggleStatus = async (userId: number, currentStatus: boolean) => {
    try {
      await updateUser.mutateAsync({ id: userId, data: { isActive: !currentStatus } });
      await queryClient.invalidateQueries({ queryKey: getListAdminUsersQueryKey() });
      toast({ title: `User ${!currentStatus ? "activated" : "deactivated"}` });
    } catch (err: any) {
      toast({ title: "Failed", description: err?.message, variant: "destructive" });
    }
  };

  return (
    <div className="px-4 py-6 max-w-4xl mx-auto space-y-5 pb-24 md:pb-8">
      <div className="flex items-center gap-3">
        <button
          data-testid="button-back-admin"
          onClick={() => setLocation("/admin")}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
          style={GLASS}
        >
          <ArrowLeft size={16} style={{ color: TEAL }} />
        </button>
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
          Users
        </h1>
        <span
          className="text-xs px-2.5 py-1 rounded-full font-semibold"
          style={{ background: "rgba(61,214,245,0.10)", border: "1px solid rgba(61,214,245,0.2)", color: TEAL }}
        >
          {(users as any)?.total ?? filtered.length}
        </span>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(168,237,255,0.35)" }} />
        <Input
          data-testid="input-search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="pl-9"
          style={{ background: "rgba(0,20,40,0.6)", border: "1px solid rgba(61,214,245,0.15)", color: "rgba(168,237,255,0.8)" }}
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
          {filtered.map((user: any) => (
            <div key={user.id} data-testid={`row-user-${user.id}`} className="rounded-xl p-4" style={GLASS}>
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
                    <div className="flex items-center gap-1.5">
                      <div className="font-semibold text-sm truncate" style={{ color: "rgba(168,237,255,0.85)" }}>{user.name}</div>
                      {user.isAdmin && <Shield size={12} style={{ color: "#f97316" }} className="shrink-0" />}
                    </div>
                    <div className="text-xs truncate" style={{ color: "rgba(168,237,255,0.4)" }}>{user.email}</div>
                    <div className="text-xs" style={{ color: "rgba(168,237,255,0.3)" }}>{user.phone} · {user.country || "—"}</div>
                  </div>
                </div>
                <button
                  data-testid={`button-toggle-${user.id}`}
                  onClick={() => toggleStatus(user.id, user.isActive)}
                  disabled={updateUser.isPending}
                  className="shrink-0 flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full transition-all"
                  style={user.isActive ? {
                    background: "rgba(52,211,153,0.10)",
                    border: "1px solid rgba(52,211,153,0.25)",
                    color: "#34d399",
                  } : {
                    background: "rgba(248,113,113,0.10)",
                    border: "1px solid rgba(248,113,113,0.25)",
                    color: "#f87171",
                  }}
                >
                  {user.isActive ? <CheckCircle size={11} /> : <XCircle size={11} />}
                  {user.isActive ? "Active" : "Inactive"}
                </button>
              </div>
              <div
                className="grid grid-cols-3 gap-2 mt-3 pt-3 text-center"
                style={{ borderTop: "1px solid rgba(61,214,245,0.07)" }}
              >
                <div>
                  <div className="font-semibold text-xs" style={{ color: "rgba(168,237,255,0.8)" }}>${user.totalInvested.toFixed(0)}</div>
                  <div className="text-xs" style={{ color: "rgba(168,237,255,0.35)" }}>Invested</div>
                </div>
                <div>
                  <div className="font-semibold text-xs" style={{ color: "rgba(168,237,255,0.8)" }}>L{user.currentLevel}</div>
                  <div className="text-xs" style={{ color: "rgba(168,237,255,0.35)" }}>Level</div>
                </div>
                <div>
                  <div className="font-semibold text-xs" style={{ color: "rgba(168,237,255,0.8)" }}>{formatDate(user.createdAt)}</div>
                  <div className="text-xs" style={{ color: "rgba(168,237,255,0.35)" }}>Joined</div>
                </div>
              </div>
              <div className="mt-2 pt-2" style={{ borderTop: "1px solid rgba(61,214,245,0.06)" }}>
                <div className="text-xs" style={{ color: "rgba(168,237,255,0.3)" }}>
                  Referral: <span className="font-mono" style={{ color: "rgba(168,237,255,0.6)" }}>{user.referralCode}</span>
                  {user.walletAddress && (
                    <span className="ml-3">
                      Wallet: <span className="font-mono" style={{ color: "rgba(168,237,255,0.6)" }}>{user.walletAddress.slice(0, 16)}…</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
