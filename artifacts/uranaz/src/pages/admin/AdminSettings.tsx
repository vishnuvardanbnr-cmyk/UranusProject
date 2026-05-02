import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useGetAdminSettings, useUpdateAdminSettings, getGetAdminSettingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save } from "lucide-react";

type SettingsForm = {
  maintenanceMode: boolean;
  minDeposit: number;
  maxDeposit: number;
  hyperCoinMinPercent: number;
  spotReferralRate: number;
  launchOfferActive: boolean;
  withdrawalEnabled: boolean;
};

export default function AdminSettings() {
  const { data: settings, isLoading } = useGetAdminSettings();
  const updateSettings = useUpdateAdminSettings();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SettingsForm>();

  useEffect(() => {
    if (settings) reset(settings as SettingsForm);
  }, [settings]);

  const onSubmit = async (data: SettingsForm) => {
    try {
      await updateSettings.mutateAsync({ data });
      await queryClient.invalidateQueries({ queryKey: getGetAdminSettingsQueryKey() });
      toast({ title: "Settings updated!" });
    } catch (err: any) {
      toast({ title: "Failed", description: err?.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 py-6 max-w-2xl mx-auto space-y-4">
        {[1,2,3].map(i => <div key={i} className="bg-card border border-border rounded-xl h-20 animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-5 pb-24 md:pb-6">
      <div className="flex items-center gap-3">
        <Settings size={20} className="text-primary" />
        <h1 className="text-xl font-bold">Platform Settings</h1>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          <div className="pb-3 border-b border-border">
            <h2 className="font-semibold text-sm text-primary">Deposit Limits</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Min Deposit (USDT)</label>
              <input data-testid="input-min-deposit" type="number" {...register("minDeposit", { valueAsNumber: true })}
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Max Deposit (USDT)</label>
              <input data-testid="input-max-deposit" type="number" {...register("maxDeposit", { valueAsNumber: true })}
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Min HYPERCOIN % (0–100)</label>
              <input data-testid="input-hypercoin-pct" type="number" step="1" min="0" max="100" {...register("hyperCoinMinPercent", { valueAsNumber: true })}
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Spot Referral Rate (%)</label>
              <input data-testid="input-spot-commission" type="number" step="0.01" {...register("spotReferralRate", { valueAsNumber: true })}
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>

          <div className="pb-3 border-b border-border pt-2">
            <h2 className="font-semibold text-sm text-primary">Platform Toggles</h2>
          </div>
          <div className="space-y-3">
            {[
              { key: "maintenanceMode" as const, label: "Maintenance Mode", desc: "Disable all user logins temporarily" },
              { key: "launchOfferActive" as const, label: "Launch Offer Active", desc: "Show Singapore trip offer to users" },
              { key: "withdrawalEnabled" as const, label: "Withdrawals Enabled", desc: "Allow users to submit withdrawal requests" },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between p-3 bg-background rounded-xl border border-border">
                <div>
                  <div className="text-sm font-medium">{item.label}</div>
                  <div className="text-xs text-muted-foreground">{item.desc}</div>
                </div>
                <input type="checkbox" data-testid={`toggle-${item.key}`} {...register(item.key)}
                  className="w-4 h-4 accent-[hsl(var(--primary))]" />
              </div>
            ))}
          </div>

          <button
            data-testid="button-save-settings"
            type="submit"
            disabled={updateSettings.isPending}
            className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <Save size={16} />
            {updateSettings.isPending ? "Saving..." : "Save Settings"}
          </button>
        </form>
      </div>
    </div>
  );
}
