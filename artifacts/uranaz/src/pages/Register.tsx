import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation, useSearch } from "wouter";
import { useRegister } from "@workspace/api-client-react";
import { setToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
const schema = z.object({
  name: z.string().min(2, "Full name required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(7, "Phone required"),
  password: z.string().min(6, "Min 6 characters"),
  referralCode: z.string().optional(),
});

interface Props { onLogin: (user: any) => void; }

const LABEL_STYLE = { color: "rgba(168,237,255,0.7)", fontSize: "0.8rem", letterSpacing: "0.05em" };
const INPUT_STYLE = { background: "rgba(0,20,40,0.6)", border: "1px solid rgba(61,214,245,0.18)", color: "rgba(168,237,255,0.9)" };

export default function Register({ onLogin }: Props) {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const ref = params.get("ref") || "";
  const register = useRegister();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", phone: "", password: "", referralCode: ref },
  });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    try {
      const res = await register.mutateAsync({ data });
      setToken(res.token);
      onLogin(res.user);
      setLocation("/profile-setup");
    } catch (err: any) {
      toast({ title: "Registration failed", description: err?.message || "Please try again", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div
            className="w-20 h-20 mx-auto mb-4 relative"
            style={{ filter: "drop-shadow(0 0 18px rgba(61,214,245,0.5))" }}
          >
            <img src="/logo.png" alt="URANAZ TRADES" className="w-full h-full object-contain" />
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
            Create Account
          </h1>
          <p style={{ color: "rgba(168,237,255,0.5)", fontSize: "0.875rem" }}>
            Join URANAZ TRADES and start earning
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {[
                { name: "name" as const,         label: "Full Name",                testId: "input-name",     type: "text",     placeholder: "Your full name" },
                { name: "email" as const,        label: "Email Address",            testId: "input-email",    type: "email",    placeholder: "you@example.com" },
                { name: "phone" as const,        label: "Phone Number",             testId: "input-phone",    type: "tel",      placeholder: "+65 8123 4567" },
                { name: "password" as const,     label: "Password",                 testId: "input-password", type: "password", placeholder: "Min 6 characters" },
                { name: "referralCode" as const, label: "Referral Code (Optional)", testId: "input-referral", type: "text",     placeholder: "Enter referral code" },
              ].map(f => (
                <FormField key={f.name} control={form.control} name={f.name} render={({ field }) => (
                  <FormItem>
                    <FormLabel style={LABEL_STYLE}>{f.label}</FormLabel>
                    <FormControl>
                      <Input data-testid={f.testId} type={f.type} placeholder={f.placeholder} {...field} style={INPUT_STYLE} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              ))}
              <button
                data-testid="button-submit-register"
                type="submit"
                disabled={register.isPending}
                className="w-full py-2.5 rounded-xl font-semibold transition-all duration-200 disabled:opacity-60 mt-2"
                style={{
                  background: "linear-gradient(135deg, #3DD6F5, #2AB3CF)",
                  color: "#010810",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  boxShadow: "0 0 20px rgba(61,214,245,0.35), 0 4px 16px rgba(0,0,0,0.4)",
                }}
              >
                {register.isPending ? "Creating account..." : "Create Account"}
              </button>
            </form>
          </Form>

          <div className="mt-5 text-center text-sm" style={{ color: "rgba(168,237,255,0.4)" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "#3DD6F5", fontWeight: 600 }} className="hover:underline">Sign In</Link>
          </div>
          <div className="mt-3 text-xs text-center" style={{ color: "rgba(168,237,255,0.3)" }}>
            By registering, you agree to our{" "}
            <Link href="/terms" style={{ color: "#3DD6F5" }} className="hover:underline">Terms</Link> and{" "}
            <Link href="/privacy" style={{ color: "#3DD6F5" }} className="hover:underline">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
