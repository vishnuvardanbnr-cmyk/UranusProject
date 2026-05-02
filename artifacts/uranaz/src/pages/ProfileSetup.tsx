import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useSetupProfile, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CheckCircle } from "lucide-react";

const BEP20_REGEX = /^0x[a-fA-F0-9]{40}$/;

const schema = z.object({
  walletAddress: z.string().trim().refine(
    (v) => v === "" || BEP20_REGEX.test(v),
    "Must be a valid BEP20 address (0x + 40 hex characters)"
  ),
});

interface Props { onUpdate: (user: any) => void; }

const LABEL_STYLE = { color: "rgba(168,237,255,0.7)", fontSize: "0.8rem", letterSpacing: "0.05em" };
const INPUT_STYLE = { background: "rgba(0,20,40,0.6)", border: "1px solid rgba(61,214,245,0.18)", color: "rgba(168,237,255,0.9)" };
const TEAL = "#3DD6F5";

export default function ProfileSetup({ onUpdate }: Props) {
  const [, setLocation] = useLocation();
  const setupProfile = useSetupProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { walletAddress: "" },
  });

  const submit = async (walletAddress: string) => {
    try {
      const user = await setupProfile.mutateAsync({ data: { walletAddress, country: "", idNumber: "" } as any });
      await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      onUpdate(user);
      toast({
        title: walletAddress ? "Profile complete!" : "Profile saved!",
        description: walletAddress ? "Welcome to URANAZ TRADES" : "You can add your wallet address later from your profile.",
      });
      setLocation("/dashboard");
    } catch (err: any) {
      toast({ title: "Failed", description: err?.message, variant: "destructive" });
    }
  };

  const onSubmit = (data: z.infer<typeof schema>) => submit(data.walletAddress);
  const onSkip = () => submit("");

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{
              background: "linear-gradient(135deg, rgba(61,214,245,0.18), rgba(42,179,215,0.08))",
              border: "2px solid rgba(61,214,245,0.45)",
              boxShadow: "0 0 30px rgba(61,214,245,0.25)",
            }}
          >
            <CheckCircle size={28} style={{ color: TEAL }} />
          </div>
          <h1
            className="text-2xl font-bold mb-1"
            style={{
              fontFamily: "'Orbitron', sans-serif",
              background: "linear-gradient(135deg, #a8edff, #3DD6F5)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Add Wallet Address
          </h1>
          <p style={{ color: "rgba(168,237,255,0.5)", fontSize: "0.875rem" }}>
            Add your USDT (BEP20) withdrawal address
          </p>
        </div>

        <div
          className="rounded-2xl p-6"
          style={{
            background: "rgba(5, 18, 32, 0.75)",
            backdropFilter: "blur(24px) saturate(1.5)",
            WebkitBackdropFilter: "blur(24px) saturate(1.5)",
            border: "1px solid rgba(61, 214, 245, 0.20)",
            boxShadow: "0 0 0 1px rgba(61,214,245,0.06) inset, 0 20px 60px rgba(0,0,0,0.5)",
          }}
        >
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField control={form.control} name="walletAddress" render={({ field }) => (
                <FormItem>
                  <FormLabel style={LABEL_STYLE}>USDT Wallet Address (BEP20)</FormLabel>
                  <FormControl>
                    <Input
                      data-testid="input-wallet"
                      placeholder="0x0000000000000000000000000000000000000000"
                      {...field}
                      style={INPUT_STYLE}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs mt-1" style={{ color: "rgba(168,237,255,0.35)" }}>
                    Make sure this is a BEP20 (BSC) address. You can add it later from your profile.
                  </p>
                </FormItem>
              )} />

              <button
                data-testid="button-submit-profile"
                type="submit"
                disabled={setupProfile.isPending}
                className="w-full py-2.5 rounded-xl font-bold transition-all disabled:opacity-60"
                style={{
                  background: "linear-gradient(135deg, #3DD6F5, #2AB3CF)",
                  color: "#010810",
                  letterSpacing: "0.04em",
                  boxShadow: "0 0 20px rgba(61,214,245,0.35)",
                }}
              >
                {setupProfile.isPending ? "Saving..." : "Save Wallet & Continue"}
              </button>

              <button
                type="button"
                data-testid="button-skip-profile"
                disabled={setupProfile.isPending}
                onClick={onSkip}
                className="w-full py-2 rounded-xl font-medium transition-all disabled:opacity-60 text-sm"
                style={{
                  background: "transparent",
                  border: "1px solid rgba(61,214,245,0.18)",
                  color: "rgba(168,237,255,0.45)",
                }}
              >
                Skip for now
              </button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
