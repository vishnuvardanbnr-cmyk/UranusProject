import { useState } from "react";
import { useListAdminUsers, useUpdateAdminUser, getListAdminUsersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Users, Search, CheckCircle, XCircle, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminUsers() {
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
    <div className="px-4 py-6 max-w-4xl mx-auto space-y-5 pb-24 md:pb-6">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold">Users</h1>
        <span className="bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full font-semibold">{(users as any)?.total ?? filtered.length}</span>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          data-testid="input-search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="bg-card border border-border rounded-xl h-20 animate-pulse" />)}
        </div>
      ) : !filtered.length ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <Users size={32} className="text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No users found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((user: any) => (
            <div key={user.id} data-testid={`row-user-${user.id}`} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <div className="font-semibold text-sm truncate">{user.name}</div>
                      {user.isAdmin && <Shield size={12} className="text-primary shrink-0" />}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                    <div className="text-xs text-muted-foreground">{user.phone} · {user.country || "—"}</div>
                  </div>
                </div>
                <button
                  data-testid={`button-toggle-${user.id}`}
                  onClick={() => toggleStatus(user.id, user.isActive)}
                  disabled={updateUser.isPending}
                  className={`shrink-0 flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                    user.isActive
                      ? "bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20"
                      : "bg-destructive/10 text-destructive hover:bg-destructive/20"
                  }`}
                >
                  {user.isActive ? <CheckCircle size={11} /> : <XCircle size={11} />}
                  {user.isActive ? "Active" : "Inactive"}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border text-center">
                <div>
                  <div className="font-semibold text-xs">${user.totalInvested.toFixed(0)}</div>
                  <div className="text-xs text-muted-foreground">Invested</div>
                </div>
                <div>
                  <div className="font-semibold text-xs">L{user.currentLevel}</div>
                  <div className="text-xs text-muted-foreground">Level</div>
                </div>
                <div>
                  <div className="font-semibold text-xs">{formatDate(user.createdAt)}</div>
                  <div className="text-xs text-muted-foreground">Joined</div>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-border">
                <div className="text-xs text-muted-foreground">
                  Referral: <span className="font-mono text-foreground">{user.referralCode}</span>
                  {user.walletAddress && (
                    <span className="ml-3">Wallet: <span className="font-mono truncate text-foreground">{user.walletAddress.slice(0, 16)}…</span></span>
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
