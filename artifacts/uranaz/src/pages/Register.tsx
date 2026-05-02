import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation, useSearch } from "wouter";
import { useRegister } from "@workspace/api-client-react";
import { setToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Mail, ArrowLeft } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Full name required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(7, "Phone required"),
  password: z.string().min(6, "Min 6 characters"),
  referralCode: z.string().optional(),
});

interface Props { onLogin: (user: any) => void; }

const TEAL = "#3DD6F5";
const LABEL_STYLE = { color: "rgba(168,237,255,0.7)", fontSize: "0.8rem", letterSpacing: "0.05em" };
const INPUT_STYLE = { background: "rgba(0,20,40,0.6)", border: "1px solid rgba(61,214,245,0.18)", color: "rgba(168,237,255,0.9)" };

async function checkOtpRequired(): Promise<{ registrationOtp: boolean; withdrawalOtp: boolean }> {
  const res = await fetch("/api/auth/otp-required");
  if (!res.ok) return { registrationOtp: false, withdrawalOtp: false };
  return res.json();
}

async function sendOtp(email: string): Promise<void> {
  const res = await fetch("/api/auth/send-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, purpose: "registration" }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to send OTP");
  }
}

export default function Register({ onLogin }: Props) {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const ref = params.get("ref") || "";
  const registerMutation = useRegister();
  const { toast } = useToast();

  const [step, setStep] = useState<"form" | "otp">("form");
  const [otp, setOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState<z.infer<typeof schema> | null>(null);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", phone: "", password: "", referralCode: ref },
  });

  const handleFormSubmit = async (data: z.infer<typeof schema>) => {
    try {
      const { registrationOtp } = await checkOtpRequired();
      if (registrationOtp) {
        setSending(true);
        try {
          await sendOtp(data.email);
          setFormData(data);
          setStep("otp");
          toast({ title: "OTP sent!", description: `Check your email ${data.email}` });
        } catch (err: any) {
          toast({ title: "Failed to send OTP", description: err?.message, variant: "destructive" });
        } finally {
          setSending(false);
        }
      } else {
        const res = await registerMutation.mutateAsync({ data });
        setToken(res.token);
        onLogin(res.user);
        setLocation("/profile-setup");
      }
    } catch (err: any) {
      toast({ title: "Registration failed", description: err?.message || "Please try again", variant: "destructive" });
    }
  };

  const handleOtpSubmit = async () => {
    if (!formData) return;
    if (otp.length !== 6) {
      toast({ title: "Enter the 6-digit OTP", variant: "destructive" });
      return;
    }
    try {
      const res = await registerMutation.mutateAsync({ data: { ...formData, otp } as any });
      setToken(res.token);
      onLogin(res.user);
      setLocation("/profile-setup");
    } catch (err: any) {
      toast({ title: "Registration failed", description: err?.message || "Invalid OTP", variant: "destructive" });
    }
  };

  const handleResend = async () => {
    if (!formData) return;
    setSending(true);
    try {
      await sendOtp(formData.email);
      toast({ title: "OTP resent!", description: "Check your inbox" });
    } catch (err: any) {
      toast({ title: "Failed to resend", description: err?.message, variant: "destructive" });
    } finally {
      setSending(false);
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
            {step === "otp" ? "Verify Email" : "Create Account"}
          </h1>
          <p style={{ color: "rgba(168,237,255,0.5)", fontSize: "0.875rem" }}>
            {step === "otp" ? `We sent a code to ${formData?.email}` : "Join URANAZ TRADES and start earning"}
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
          {step === "form" ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
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
                  disabled={registerMutation.isPending || sending}
                  className="w-full py-2.5 rounded-xl font-semibold transition-all duration-200 disabled:opacity-60 mt-2"
                  style={{
                    background: "linear-gradient(135deg, #3DD6F5, #2AB3CF)",
                    color: "#010810",
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    boxShadow: "0 0 20px rgba(61,214,245,0.35), 0 4px 16px rgba(0,0,0,0.4)",
                  }}
                >
                  {sending ? "Sending OTP..." : registerMutation.isPending ? "Creating account..." : "Create Account"}
                </button>
              </form>
            </Form>
          ) : (
            <div className="space-y-5">
              <div
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "rgba(61,214,245,0.06)", border: "1px solid rgba(61,214,245,0.14)" }}
              >
                <Mail size={18} style={{ color: TEAL, flexShrink: 0 }} />
                <p className="text-xs" style={{ color: "rgba(168,237,255,0.6)" }}>
                  Enter the 6-digit code sent to <span style={{ color: TEAL }}>{formData?.email}</span>
                </p>
              </div>

              <div>
                <label className="text-xs font-medium block mb-2" style={LABEL_STYLE}>Verification Code</label>
                <input
                  data-testid="input-otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className="w-full rounded-xl px-3 py-3 text-center text-2xl font-bold tracking-[0.4em] focus:outline-none"
                  style={{
                    background: "rgba(0,20,40,0.7)",
                    border: "1px solid rgba(61,214,245,0.25)",
                    color: TEAL,
                    letterSpacing: "0.4em",
                  }}
                />
              </div>

              <button
                data-testid="button-verify-otp"
                onClick={handleOtpSubmit}
                disabled={registerMutation.isPending || otp.length !== 6}
                className="w-full py-2.5 rounded-xl font-bold transition-all disabled:opacity-60"
                style={{
                  background: "linear-gradient(135deg, #3DD6F5, #2AB3CF)",
                  color: "#010810",
                  letterSpacing: "0.04em",
                  boxShadow: "0 0 20px rgba(61,214,245,0.35)",
                }}
              >
                {registerMutation.isPending ? "Verifying..." : "Verify & Create Account"}
              </button>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => { setStep("form"); setOtp(""); }}
                  className="flex items-center gap-1.5 text-xs"
                  style={{ color: "rgba(168,237,255,0.4)" }}
                >
                  <ArrowLeft size={12} /> Back
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={sending}
                  className="text-xs font-medium"
                  style={{ color: TEAL }}
                >
                  {sending ? "Sending..." : "Resend code"}
                </button>
              </div>
            </div>
          )}

          {step === "form" && (
            <>
              <div className="mt-5 text-center text-sm" style={{ color: "rgba(168,237,255,0.4)" }}>
                Already have an account?{" "}
                <Link href="/login" style={{ color: TEAL, fontWeight: 600 }} className="hover:underline">Sign In</Link>
              </div>
              <div className="mt-3 text-xs text-center" style={{ color: "rgba(168,237,255,0.3)" }}>
                By registering, you agree to our{" "}
                <Link href="/terms" style={{ color: TEAL }} className="hover:underline">Terms</Link> and{" "}
                <Link href="/privacy" style={{ color: TEAL }} className="hover:underline">Privacy Policy</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
