import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation, useSearch } from "wouter";
import { useRegister } from "@workspace/api-client-react";
import { setToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, ArrowLeft, ShieldCheck } from "lucide-react";
import { COUNTRIES, COUNTRY_BY_ISO2 } from "@/lib/countries";

function buildSchema(requireReferral: boolean) {
  return z.object({
    name: z.string().min(2, "Full name required"),
    email: z.string().email("Valid email required"),
    countryIso2: z
      .string()
      .min(2, "Country is required")
      .refine((v) => Boolean(COUNTRY_BY_ISO2[v]), { message: "Pick a country from the list" }),
    phoneLocal: z
      .string()
      .trim()
      .regex(/^[0-9 \-]*$/, "Digits only")
      .refine((v) => v.replace(/[^0-9]/g, "").length >= 5, {
        message: "Enter at least 5 digits",
      }),
    password: z.string().min(6, "Min 6 characters"),
    referralCode: requireReferral
      ? z.string().trim().min(1, "Referral code is required")
      : z.string().optional(),
  });
}
type RegisterValues = z.infer<ReturnType<typeof buildSchema>>;

type RegistrationInfo = { userCount: number; isFirstUser: boolean; requiresReferral: boolean };

async function fetchRegistrationInfo(): Promise<RegistrationInfo> {
  const res = await fetch("/api/auth/registration-info");
  if (!res.ok) throw new Error("Failed to load registration info");
  return res.json();
}

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
  const [formData, setFormData] = useState<RegisterValues | null>(null);
  const [regInfo, setRegInfo] = useState<RegistrationInfo | null>(null);

  useEffect(() => {
    fetchRegistrationInfo()
      .then(setRegInfo)
      .catch(() => setRegInfo({ userCount: 1, isFirstUser: false, requiresReferral: true }));
  }, []);

  // Auto-fill referral code from URL ?ref= param
  useEffect(() => {
    if (ref) {
      form.setValue("referralCode", ref, { shouldValidate: true });
    }
  }, [ref]);

  const requireReferral = regInfo?.requiresReferral ?? true;
  const isFirstUser = regInfo?.isFirstUser ?? false;
  const schema = buildSchema(requireReferral);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", countryIso2: "", phoneLocal: "", password: "", referralCode: ref },
  });

  const selectedIso2 = form.watch("countryIso2");
  const selectedCountry = selectedIso2 ? COUNTRY_BY_ISO2[selectedIso2] : undefined;

  // Convert form values into the API-shaped registration payload.
  // The visible "Phone Number" input only collects the local digits — the
  // dial code is locked to the chosen country and prepended on submit.
  function toApiPayload(data: RegisterValues) {
    const c = COUNTRY_BY_ISO2[data.countryIso2];
    const localDigits = data.phoneLocal.replace(/[^0-9]/g, "");
    const phone = c ? `${c.dialCode} ${localDigits}` : localDigits;
    return {
      name: data.name,
      email: data.email,
      phone,
      country: c?.name ?? "",
      password: data.password,
      referralCode: data.referralCode,
    };
  }

  const handleFormSubmit = async (data: RegisterValues) => {
    try {
      const payload = toApiPayload(data);
      const { registrationOtp } = await checkOtpRequired();
      if (registrationOtp) {
        setSending(true);
        try {
          await sendOtp(payload.email);
          setFormData(data);
          setStep("otp");
          toast({ title: "OTP sent!", description: `Check your email ${payload.email}` });
        } catch (err: any) {
          toast({ title: "Failed to send OTP", description: err?.message, variant: "destructive" });
        } finally {
          setSending(false);
        }
      } else {
        const res = await registerMutation.mutateAsync({ data: payload as any });
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
      const payload = toApiPayload(formData);
      const res = await registerMutation.mutateAsync({ data: { ...payload, otp } as any });
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
            {step === "otp" ? "Verify Email" : "Create Account"}
          </h1>
          <p style={{ color: "rgba(168,237,255,0.5)", fontSize: "0.875rem" }}>
            {step === "otp" ? `We sent a code to ${formData?.email}` : "Join URANUS TRADES and start earning"}
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
                {isFirstUser && (
                  <div
                    data-testid="banner-first-admin"
                    className="flex items-start gap-3 p-3 rounded-xl"
                    style={{
                      background: "rgba(61,214,245,0.08)",
                      border: "1px solid rgba(61,214,245,0.25)",
                    }}
                  >
                    <ShieldCheck size={18} style={{ color: TEAL, flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <div className="text-xs font-semibold" style={{ color: TEAL, letterSpacing: "0.04em" }}>
                        FIRST ACCOUNT — ADMIN ACCESS
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: "rgba(168,237,255,0.65)" }}>
                        You are the first user on this platform. This account will be created as the
                        admin and a referral code is not required.
                      </p>
                    </div>
                  </div>
                )}
                {/* Name */}
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel style={LABEL_STYLE}>Full Name</FormLabel>
                    <FormControl>
                      <Input data-testid="input-name" type="text" placeholder="Your full name" {...field} style={INPUT_STYLE} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Email */}
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel style={LABEL_STYLE}>Email Address</FormLabel>
                    <FormControl>
                      <Input data-testid="input-email" type="email" placeholder="you@example.com" {...field} style={INPUT_STYLE} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Country */}
                <FormField control={form.control} name="countryIso2" render={({ field }) => (
                  <FormItem>
                    <FormLabel style={LABEL_STYLE}>Country</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger
                          data-testid="select-country"
                          className="w-full h-9 rounded-md px-3"
                          style={INPUT_STYLE}
                        >
                          <SelectValue placeholder="Select your country" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent
                        className="max-h-72"
                        style={{
                          background: "rgba(5,18,32,0.97)",
                          border: "1px solid rgba(61,214,245,0.25)",
                          color: "rgba(168,237,255,0.9)",
                          backdropFilter: "blur(24px)",
                        }}
                      >
                        {COUNTRIES.map((c) => (
                          <SelectItem
                            key={c.iso2}
                            value={c.iso2}
                            data-testid={`option-country-${c.iso2}`}
                            className="cursor-pointer"
                          >
                            <span className="inline-flex items-center gap-2">
                              <span>{c.name}</span>
                              <span style={{ color: "rgba(168,237,255,0.45)", fontSize: "0.75rem" }}>
                                ({c.dialCode})
                              </span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Phone (with locked country dial-code prefix) */}
                <FormField control={form.control} name="phoneLocal" render={({ field }) => (
                  <FormItem>
                    <FormLabel style={LABEL_STYLE}>Phone Number</FormLabel>
                    <FormControl>
                      <div
                        className="flex items-stretch rounded-md overflow-hidden"
                        style={{
                          background: INPUT_STYLE.background,
                          border: INPUT_STYLE.border,
                        }}
                      >
                        <div
                          data-testid="text-dial-code"
                          aria-label="Country dial code"
                          className="flex items-center px-3 text-sm select-none"
                          style={{
                            background: "rgba(61,214,245,0.10)",
                            color: selectedCountry ? TEAL : "rgba(168,237,255,0.4)",
                            borderRight: "1px solid rgba(61,214,245,0.18)",
                            fontWeight: 600,
                            minWidth: 64,
                            justifyContent: "center",
                          }}
                          title={selectedCountry ? `${selectedCountry.name} dial code` : "Select a country first"}
                        >
                          {selectedCountry?.dialCode ?? "+—"}
                        </div>
                        <input
                          data-testid="input-phone"
                          type="tel"
                          inputMode="numeric"
                          autoComplete="tel-national"
                          placeholder={selectedCountry ? "8123 4567" : "Select country first"}
                          disabled={!selectedCountry}
                          value={field.value}
                          onChange={(e) =>
                            field.onChange(e.target.value.replace(/[^0-9 \-]/g, ""))
                          }
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                          className="flex-1 bg-transparent px-3 text-sm focus:outline-none disabled:opacity-60"
                          style={{ color: "rgba(168,237,255,0.9)" }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Password */}
                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel style={LABEL_STYLE}>Password</FormLabel>
                    <FormControl>
                      <Input data-testid="input-password" type="password" placeholder="Min 6 characters" {...field} style={INPUT_STYLE} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Referral (hidden for first user) */}
                {!isFirstUser && (
                  <FormField control={form.control} name="referralCode" render={({ field }) => (
                    <FormItem>
                      <FormLabel style={LABEL_STYLE}>
                        {requireReferral ? "Referral Code" : "Referral Code (Optional)"}
                        {ref && <span className="ml-2 text-xs" style={{ color: "#3DD6F5" }}>✓ Auto-filled</span>}
                      </FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-referral"
                          type="text"
                          placeholder="Enter referral code"
                          readOnly={!!ref}
                          {...field}
                          style={{
                            ...INPUT_STYLE,
                            ...(ref ? { opacity: 0.75, cursor: "not-allowed", borderColor: "rgba(61,214,245,0.35)" } : {}),
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}
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
