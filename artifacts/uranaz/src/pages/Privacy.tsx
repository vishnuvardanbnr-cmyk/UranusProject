import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Privacy() {
  return (
    <div className="px-4 py-6 max-w-2xl mx-auto pb-24 md:pb-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center">
          <ArrowLeft size={16} />
        </Link>
        <h1 className="text-xl font-bold">Privacy Policy</h1>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <p className="text-muted-foreground text-xs">Last updated: January 2025</p>

        {[
          {
            title: "1. Information We Collect",
            content: "We collect information you provide directly to us, such as your name, email address, phone number, country of residence, government ID number, and cryptocurrency wallet addresses. We also collect transaction data, investment history, and referral information."
          },
          {
            title: "2. How We Use Your Information",
            content: "We use the information we collect to: process your investments and withdrawals; communicate with you about your account; provide customer support; detect and prevent fraud; comply with legal obligations; and improve our platform."
          },
          {
            title: "3. Information Sharing",
            content: "We do not sell, trade, or otherwise transfer your personal information to outside parties except as necessary to operate our platform (e.g., payment processors), comply with law, or protect our rights. Referral relationships within the platform are visible to your upline for commission calculation purposes."
          },
          {
            title: "4. Data Security",
            content: "We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure."
          },
          {
            title: "5. Cryptocurrency & Blockchain",
            content: "By nature of blockchain technology, certain transaction data may be publicly visible. Your wallet addresses used for deposits and withdrawals may be recorded on public blockchains. URANAZ TRADES is not responsible for the public nature of blockchain records."
          },
          {
            title: "6. Cookies",
            content: "We use cookies and similar tracking technologies to improve your experience, analyze platform usage, and maintain your session. You can control cookie settings through your browser, though some features may not function properly without cookies."
          },
          {
            title: "7. Your Rights",
            content: "You have the right to access, correct, or delete your personal information. You may request a copy of your data or request deletion by contacting us at privacy@uranaz.com. Certain data may be retained as required by law."
          },
          {
            title: "8. Data Retention",
            content: "We retain your personal information for as long as your account is active or as needed to provide services, comply with legal obligations, resolve disputes, and enforce our agreements. Investment and transaction records may be retained for up to 7 years."
          },
          {
            title: "9. International Transfers",
            content: "URANAZ TRADES operates internationally. Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for such transfers."
          },
          {
            title: "10. Contact Us",
            content: "If you have questions about this Privacy Policy or our data practices, please contact us at privacy@uranaz.com or through our support channels."
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
