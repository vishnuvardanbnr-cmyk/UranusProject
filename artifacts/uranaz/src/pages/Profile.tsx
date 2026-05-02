import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSetupProfile, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { User, Copy, Shield } from "lucide-react";
import { Link } from "wouter";

const schema = z.object({
  walletAddress: z.string().min(10, "Valid wallet address required"),
  country: z.string().min(2, "Country required"),
  idNumber: z.string().optional(),
});

export default function Profile({ user, onUpdate }: { user: any; onUpdate: (u: any) => void }) {
  const setup = useSetupProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      walletAddress: user?.walletAddress || "",
      country: user?.country || "",
      idNumber: user?.idNumber || "",
    },
  });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    try {
      const updated = await setup.mutateAsync({ data });
      await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      onUpdate(updated);
      toast({ title: "Profile updated!" });
    } catch (err: any) {
      toast({ title: "Failed", description: err?.message, variant: "destructive" });
    }
  };

  const copyReferral = () => {
    navigator.clipboard.writeText(user?.referralCode || "");
    toast({ title: "Referral code copied!" });
  };

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-6 pb-24 md:pb-6">
      <h1 className="text-xl font-bold">My Profile</h1>

      {/* Avatar / Info */}
      <div className="bg-card border border-border rounded-2xl p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center text-primary text-2xl font-bold shrink-0">
          {user?.name?.charAt(0)?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-lg" data-testid="text-username">{user?.name}</div>
          <div className="text-sm text-muted-foreground">{user?.email}</div>
          <div className="text-sm text-muted-foreground">{user?.phone}</div>
          {user?.isAdmin && (
            <div className="flex items-center gap-1 text-primary text-xs mt-1">
              <Shield size={12} /> Admin
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Total Invested", value: `$${user?.totalInvested?.toFixed(2) || "0.00"}` },
          { label: "Total Earnings", value: `$${user?.totalEarnings?.toFixed(2) || "0.00"}` },
          { label: "Current Level", value: `Level ${user?.currentLevel ?? 0}` },
          { label: "Member Since", value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—" },
        ].map(item => (
          <div key={item.label} className="bg-card border border-border rounded-xl p-4">
            <div className="text-xs text-muted-foreground">{item.label}</div>
            <div className="font-bold text-sm mt-1">{item.value}</div>
          </div>
        ))}
      </div>

      {/* Referral Code */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="text-xs text-muted-foreground mb-2">Your Referral Code</div>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-background border border-border rounded-lg px-4 py-2.5 font-mono font-bold text-primary tracking-widest text-center">
            {user?.referralCode}
          </div>
          <button
            data-testid="button-copy-referral"
            onClick={copyReferral}
            className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary"
          >
            <Copy size={16} />
          </button>
        </div>
      </div>

      {/* Edit Form */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h2 className="font-semibold text-sm mb-4">Update Profile</h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="walletAddress" render={({ field }) => (
              <FormItem>
                <FormLabel>USDT Wallet Address (TRC20)</FormLabel>
                <FormControl><Input data-testid="input-wallet" placeholder="TXxxxxxxxxxxxxxxxxx" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="country" render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <FormControl><Input data-testid="input-country" placeholder="e.g. Singapore" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="idNumber" render={({ field }) => (
              <FormItem>
                <FormLabel>ID / Passport Number</FormLabel>
                <FormControl><Input data-testid="input-id" placeholder="Optional" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <button
              data-testid="button-save-profile"
              type="submit"
              disabled={setup.isPending}
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {setup.isPending ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </Form>
      </div>

      {/* Links */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/terms">
          <div className="bg-card border border-border rounded-xl p-4 text-sm font-medium hover:border-primary/30 transition-colors cursor-pointer">
            Terms & Conditions
          </div>
        </Link>
        <Link href="/privacy">
          <div className="bg-card border border-border rounded-xl p-4 text-sm font-medium hover:border-primary/30 transition-colors cursor-pointer">
            Privacy Policy
          </div>
        </Link>
      </div>
    </div>
  );
}
