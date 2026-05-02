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
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(246,195,67,0.07)_0%,_transparent_60%)] pointer-events-none" />
      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4">
            <span className="text-primary font-bold text-xl">UT</span>
          </div>
          <h1 className="text-2xl font-bold">Welcome Back</h1>
          <p className="text-muted-foreground text-sm mt-1">Sign in to your URANAZ TRADES account</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input data-testid="input-email" type="email" placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input data-testid="input-password" type="password" placeholder="Enter your password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <button
                data-testid="button-submit-login"
                type="submit"
                disabled={login.isPending}
                className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {login.isPending ? "Signing in..." : "Sign In"}
              </button>
            </form>
          </Form>

          <div className="mt-5 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary font-semibold hover:underline">
              Register
            </Link>
          </div>
          <div className="mt-3 text-center text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
            Demo: john@example.com / demo123 &nbsp;|&nbsp; Admin: admin@uranaz.com / admin123
          </div>
        </div>
      </div>
    </div>
  );
}
