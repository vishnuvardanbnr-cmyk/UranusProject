import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useGetAdminSettings, useUpdateAdminSettings, getGetAdminSettingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save } from "lucide-react";

const TEAL = "#3DD6F5";
const GLASS = { background: "rgba(5,18,32,0.65)", backdropFilter: "blur(14px)", border: "1px solid rgba(61,214,245,0.10)" } as const;
const INPUT_CLS = "w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none";
const INPUT_STYLE = {
  background: "rgba(0,20,40,0.7)",
  border: "1px solid rgba(61,214,245,0.18)",
  color: "rgba(168,237,255,0.9)",
};

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

  const { register, handleSubmit, reset } = useForm<SettingsForm>();

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
        {[1,2,3].map(i => <div key={i} className="rounded-xl h-20 animate-pulse" style={{ background: "rgba(61,214,245,0.04)", border: "1px solid rgba(61,214,245,0.08)" }} />)}
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-5 pb-24 md:pb-8">
      <div className="flex items-center gap-3">
        <Settings size={20} style={{ color: TEAL }} />
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
          Platform Settings
        </h1>
      </div>

      <div className="rounded-2xl p-5" style={GLASS}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* Deposit Limits */}
          <div className="pb-3" style={{ borderBottom: "1px solid rgba(61,214,245,0.08)" }}>
            <h2 className="font-semibold text-sm" style={{ color: TEAL }}>Deposit Limits</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Min Deposit (USDT)",      testId: "input-min-deposit",   name: "minDeposit" as const,         type: "number", extra: {} },
              { label: "Max Deposit (USDT)",      testId: "input-max-deposit",   name: "maxDeposit" as const,         type: "number", extra: {} },
              { label: "Min HYPERCOIN % (0–100)", testId: "input-hypercoin-pct", name: "hyperCoinMinPercent" as const, type: "number", extra: { step: "1", min: "0", max: "100" } },
              { label: "Spot Referral Rate (%)",  testId: "input-spot-commission",name: "spotReferralRate" as const,  type: "number", extra: { step: "0.01" } },
            ].map(f => (
              <div key={f.name}>
                <label className="text-xs font-medium block mb-1.5" style={{ color: "rgba(168,237,255,0.5)" }}>{f.label}</label>
                <input
                  data-testid={f.testId}
                  type={f.type}
                  {...f.extra}
                  {...register(f.name, { valueAsNumber: true })}
                  className={INPUT_CLS}
                  style={INPUT_STYLE}
                />
              </div>
            ))}
          </div>

          {/* Toggles */}
          <div className="pb-3 pt-2" style={{ borderBottom: "1px solid rgba(61,214,245,0.08)" }}>
            <h2 className="font-semibold text-sm" style={{ color: TEAL }}>Platform Toggles</h2>
          </div>
          <div className="space-y-3">
            {[
              { key: "maintenanceMode" as const,  label: "Maintenance Mode",    desc: "Disable all user logins temporarily" },
              { key: "launchOfferActive" as const, label: "Launch Offer Active", desc: "Show Singapore trip offer to users" },
              { key: "withdrawalEnabled" as const, label: "Withdrawals Enabled", desc: "Allow users to submit withdrawal requests" },
            ].map(item => (
              <div
                key={item.key}
                className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: "rgba(0,15,30,0.5)", border: "1px solid rgba(61,214,245,0.08)" }}
              >
                <div>
                  <div className="text-sm font-medium" style={{ color: "rgba(168,237,255,0.8)" }}>{item.label}</div>
                  <div className="text-xs" style={{ color: "rgba(168,237,255,0.35)" }}>{item.desc}</div>
                </div>
                <input
                  type="checkbox"
                  data-testid={`toggle-${item.key}`}
                  {...register(item.key)}
                  className="w-4 h-4"
                  style={{ accentColor: TEAL }}
                />
              </div>
            ))}
          </div>

          <button
            data-testid="button-save-settings"
            type="submit"
            disabled={updateSettings.isPending}
            className="w-full py-3 rounded-xl font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            style={{
              background: "linear-gradient(135deg, #3DD6F5, #2AB3CF)",
              color: "#010810",
              letterSpacing: "0.04em",
              boxShadow: "0 0 20px rgba(61,214,245,0.3)",
            }}
          >
            <Save size={16} />
            {updateSettings.isPending ? "Saving..." : "Save Settings"}
          </button>
        </form>
      </div>
    </div>
  );
}
