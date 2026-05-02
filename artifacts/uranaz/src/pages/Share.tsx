import { useGetReferralLink } from "@workspace/api-client-react";
import { Copy, Share2, Users, DollarSign, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Share() {
  const { data: referral, isLoading } = useGetReferralLink();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    if (!referral?.referralLink) return;
    await navigator.clipboard.writeText(referral.referralLink);
    setCopied(true);
    toast({ title: "Copied!", description: "Referral link copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const copyCode = async () => {
    if (!referral?.referralCode) return;
    await navigator.clipboard.writeText(referral.referralCode);
    toast({ title: "Copied!", description: "Referral code copied" });
  };

  if (isLoading) {
    return (
      <div className="px-4 py-6 max-w-2xl mx-auto space-y-4 pb-24 md:pb-6">
        {[1,2,3].map(i => <div key={i} className="bg-card border border-border rounded-xl h-24 animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-6 pb-24 md:pb-6">
      <h1 className="text-xl font-bold">Share & Earn</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-primary" />
            <span className="text-xs text-muted-foreground">Total Referrals</span>
          </div>
          <div className="text-2xl font-bold" data-testid="text-referral-count">{referral?.totalReferrals ?? 0}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={16} className="text-primary" />
            <span className="text-xs text-muted-foreground">Spot Commission</span>
          </div>
          <div className="text-2xl font-bold">${referral?.spotCommissionEarned?.toFixed(2) ?? "0.00"}</div>
        </div>
      </div>

      {/* Referral Code */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold mb-3">Your Referral Code</h2>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-background border border-border rounded-xl px-4 py-3 font-mono font-bold text-primary text-center tracking-widest text-lg" data-testid="text-referral-code">
            {referral?.referralCode ?? "—"}
          </div>
          <button
            data-testid="button-copy-code"
            onClick={copyCode}
            className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
          >
            <Copy size={18} />
          </button>
        </div>
      </div>

      {/* Referral Link */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold mb-3">Your Referral Link</h2>
        <div className="bg-background border border-border rounded-xl px-4 py-3 text-xs text-muted-foreground break-all mb-3" data-testid="text-referral-link">
          {referral?.referralLink ?? "—"}
        </div>
        <button
          data-testid="button-copy-link"
          onClick={copyLink}
          className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
            copied ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400" : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          {copied ? <><CheckCircle size={16} /> Copied!</> : <><Copy size={16} /> Copy Referral Link</>}
        </button>
      </div>

      {/* How it works */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold mb-4">How Referral Works</h2>
        <div className="space-y-4">
          {[
            { step: 1, title: "Share your link", desc: "Send your referral link to friends and family" },
            { step: 2, title: "They register & invest", desc: "Your referral signs up and makes an investment" },
            { step: 3, title: "Earn 5% instantly", desc: "Receive 5% spot commission on their investment amount" },
            { step: 4, title: "Level commissions", desc: "Earn from up to 8 levels of your network over time" },
          ].map(item => (
            <div key={item.step} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                {item.step}
              </div>
              <div>
                <div className="text-sm font-medium">{item.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Commission rates */}
      <div className="bg-gradient-to-br from-primary/10 to-amber-700/5 border border-primary/20 rounded-xl p-5">
        <h2 className="text-sm font-semibold mb-3">Commission Rates</h2>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Spot Referral Commission</span>
            <span className="text-primary font-bold">5%</span>
          </div>
          {[
            { level: "Level 1", rate: "20%", days: "80 days" },
            { level: "Level 2", rate: "10%", days: "80 days" },
            { level: "Level 3", rate: "10%", days: "60 days" },
            { level: "Levels 4–8", rate: "4% each", days: "60 days" },
          ].map(item => (
            <div key={item.level} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{item.level}</span>
              <span className="font-semibold">{item.rate} <span className="text-muted-foreground text-xs">({item.days})</span></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
