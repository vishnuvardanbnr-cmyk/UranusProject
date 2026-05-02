import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { setToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
const schema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(6, "Password required"),
});

interface Props { onLogin: (user: any) => void; }

export default function Login({ onLogin }: Props) {
  const [, setLocation] = useLocation();
  const login = useLogin();
  const { toast } = useToast();

  const form = useForm({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    try {
      const res = await login.mutateAsync({ data });
      setToken(res.token);
      onLogin(res.user);
      setLocation("/dashboard");
    } catch (err: any) {
      toast({ title: "Login failed", description: err?.message || "Invalid credentials", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="relative w-full max-w-sm">
        {/* Logo + heading */}
        <div className="text-center mb-8">
          <div
            className="w-44 h-44 mx-auto mb-4 relative"
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
            Welcome Back
          </h1>
          <p style={{ color: "rgba(168,237,255,0.5)", fontSize: "0.875rem" }}>
            Sign in to your URANAZ TRADES account
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: "rgba(5, 18, 32, 0.75)",
            backdropFilter: "blur(24px) saturate(1.5)",
            WebkitBackdropFilter: "blur(24px) saturate(1.5)",
            border: "1px solid rgba(61, 214, 245, 0.20)",
            boxShadow: "0 0 0 1px rgba(61,214,245,0.06) inset, 0 20px 60px rgba(0,0,0,0.5), 0 0 100px rgba(61,214,245,0.05)",
          }}
        >
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel style={{ color: "rgba(168,237,255,0.7)", fontSize: "0.8rem", letterSpacing: "0.05em" }}>
                    Email Address
                  </FormLabel>
                  <FormControl>
                    <Input
                      data-testid="input-email"
                      type="email"
                      placeholder="you@example.com"
                      {...field}
                      style={{
                        background: "rgba(0,20,40,0.6)",
                        border: "1px solid rgba(61,214,245,0.18)",
                        color: "rgba(168,237,255,0.9)",
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel style={{ color: "rgba(168,237,255,0.7)", fontSize: "0.8rem", letterSpacing: "0.05em" }}>
                    Password
                  </FormLabel>
                  <FormControl>
                    <Input
                      data-testid="input-password"
                      type="password"
                      placeholder="Enter your password"
                      {...field}
                      style={{
                        background: "rgba(0,20,40,0.6)",
                        border: "1px solid rgba(61,214,245,0.18)",
                        color: "rgba(168,237,255,0.9)",
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <button
                data-testid="button-submit-login"
                type="submit"
                disabled={login.isPending}
                className="w-full py-2.5 rounded-xl font-semibold transition-all duration-200 disabled:opacity-60 mt-2"
                style={{
                  background: "linear-gradient(135deg, #3DD6F5, #2AB3CF)",
                  color: "#010810",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  boxShadow: "0 0 20px rgba(61,214,245,0.35), 0 4px 16px rgba(0,0,0,0.4)",
                }}
              >
                {login.isPending ? "Signing in..." : "Sign In"}
              </button>
            </form>
          </Form>

          <div className="mt-5 text-center text-sm" style={{ color: "rgba(168,237,255,0.4)" }}>
            Don't have an account?{" "}
            <Link href="/register" style={{ color: "#3DD6F5", fontWeight: 600 }} className="hover:underline">
              Register
            </Link>
          </div>
          <div
            className="mt-3 text-center text-xs rounded-lg p-2"
            style={{
              background: "rgba(61,214,245,0.05)",
              border: "1px solid rgba(61,214,245,0.10)",
              color: "rgba(168,237,255,0.35)",
            }}
          >
            Demo: john@example.com / demo123 &nbsp;|&nbsp; Admin: admin@uranaz.com / admin123
          </div>
        </div>
      </div>
    </div>
  );
}
