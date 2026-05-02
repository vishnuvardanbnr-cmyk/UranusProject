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

const schema = z.object({
  walletAddress: z.string().min(10, "Valid wallet address required"),
  country: z.string().min(2, "Country required"),
  idNumber: z.string().optional(),
});

interface Props { onUpdate: (user: any) => void; }

export default function ProfileSetup({ onUpdate }: Props) {
  const [, setLocation] = useLocation();
  const setupProfile = useSetupProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { walletAddress: "", country: "", idNumber: "" },
  });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    try {
      const user = await setupProfile.mutateAsync({ data });
      await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      onUpdate(user);
      toast({ title: "Profile complete!", description: "Welcome to URANAZ TRADES" });
      setLocation("/dashboard");
    } catch (err: any) {
      toast({ title: "Failed", description: err?.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(246,195,67,0.07)_0%,_transparent_60%)] pointer-events-none" />
      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Complete Your Profile</h1>
          <p className="text-muted-foreground text-sm mt-1">One last step before you can invest</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
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
                  <FormLabel>ID Number (Optional)</FormLabel>
                  <FormControl><Input data-testid="input-id" placeholder="Passport or ID number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <button
                data-testid="button-submit-profile"
                type="submit"
                disabled={setupProfile.isPending}
                className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {setupProfile.isPending ? "Saving..." : "Complete Setup"}
              </button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
