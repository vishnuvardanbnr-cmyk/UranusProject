import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Terms() {
  return (
    <div className="px-4 py-6 max-w-2xl mx-auto pb-24 md:pb-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center">
          <ArrowLeft size={16} />
        </Link>
        <h1 className="text-xl font-bold">Terms & Conditions</h1>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 prose prose-invert prose-sm max-w-none space-y-5">
        <p className="text-muted-foreground text-xs">Last updated: January 2025</p>

        {[
          {
            title: "1. Acceptance of Terms",
            content: "By accessing or using the URANAZ TRADES platform, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services."
          },
          {
            title: "2. Investment Risk Disclosure",
            content: "All investments carry risk. Past performance does not guarantee future results. The daily returns stated (0.6%–0.8%) are targets based on our trading strategies but are not guaranteed. URANAZ TRADES operates across real estate, stocks, forex, and cryptocurrency markets, all of which are subject to market volatility."
          },
          {
            title: "3. Eligibility",
            content: "You must be at least 18 years of age to use this platform. By registering, you represent that you are of legal age in your jurisdiction and have the legal capacity to enter into this agreement."
          },
          {
            title: "4. Investment Plans",
            content: "Investments must be in multiples of $100 USDT. Minimum investment is $100 and maximum is $1,500 per plan. A minimum of 50% of your deposit must be in HYPERCOIN. Returns are distributed every weekday (5 business days per week). Investment duration depends on your plan tier."
          },
          {
            title: "5. Referral & Commission Program",
            content: "URANAZ TRADES operates a multi-level referral system. A 5% spot referral commission is paid on the investment amount of your direct referrals. Level commissions (1–8) are paid on return amounts as specified in the commission schedule. Level unlocking is based on your total earnings milestones."
          },
          {
            title: "6. HYPERCOIN Requirement",
            content: "All deposits must include a minimum of 50% in HYPERCOIN. URANAZ TRADES is not responsible for the value fluctuation of HYPERCOIN. Users are responsible for understanding the risks associated with HYPERCOIN."
          },
          {
            title: "7. Withdrawals",
            content: "Withdrawal requests are processed within 24–48 business hours. Minimum withdrawal amount is $10 USDT. Withdrawals are processed to the BEP20 wallet address provided in your profile. URANAZ TRADES is not responsible for errors in wallet addresses provided by users."
          },
          {
            title: "8. Account Security",
            content: "You are responsible for maintaining the confidentiality of your account credentials. You must notify us immediately of any unauthorized use of your account. URANAZ TRADES is not liable for any losses resulting from unauthorized account access."
          },
          {
            title: "9. Rank & Reward Program",
            content: "Rank rewards (smartphones, laptops, motor bikes, Apple products, and electric cars) are awarded to qualifying users based on achieving specific rank criteria. URANAZ TRADES reserves the right to modify reward specifications at any time."
          },
          {
            title: "10. Termination",
            content: "URANAZ TRADES reserves the right to suspend or terminate any account that violates these terms, engages in fraudulent activity, or otherwise harms the platform or its users."
          },
          {
            title: "11. Limitation of Liability",
            content: "URANAZ TRADES shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the platform, including but not limited to loss of profits, loss of data, or business interruption."
          },
          {
            title: "12. Contact",
            content: "For any questions regarding these Terms, please contact our support team at support@uranaz.com."
          },
        ].map(section => (
          <div key={section.title} className="border-b border-border pb-4 last:border-0">
            <h3 className="font-semibold text-foreground mb-2">{section.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{section.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
