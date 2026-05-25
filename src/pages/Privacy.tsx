import PolicyLayout from "@/components/PolicyLayout";

const Privacy = () => (
  <PolicyLayout title="Privacy Policy" description="How ClippedIn (Snashco LLC) collects, uses, and protects your data." canonical="https://clippedin.lovable.app/privacy">
    <section><h2 className="text-foreground font-bold text-base">1. Who we are</h2><p>ClippedIn is operated by Snashco LLC ("we", "us"), a limited liability company based in Bulawayo, Zimbabwe. For any privacy question, contact <a href="mailto:tanksnash@gmail.com" className="underline">tanksnash@gmail.com</a>.</p></section>
    <section><h2 className="text-foreground font-bold text-base">2. Data we collect</h2><ul className="list-disc pl-5 space-y-1"><li>Account data: email, display name, and OAuth profile data if you sign in with Google.</li><li>LinkedIn screenshots you upload to the Profile Tester (processed in memory; not retained on our servers).</li><li>Content you create in the Engine and Reef (stored against your account).</li><li>Basic technical logs (IP, browser, timestamps) for security and abuse prevention.</li></ul></section>
    <section><h2 className="text-foreground font-bold text-base">3. How we use it</h2><p>To provide and improve the service, generate AI suggestions, secure your account, and comply with legal obligations. We do not sell your personal data.</p></section>
    <section><h2 className="text-foreground font-bold text-base">4. Legal bases (GDPR)</h2><p>Performance of contract, legitimate interests, your consent (for optional analytics), and legal obligation.</p></section>
    <section><h2 className="text-foreground font-bold text-base">5. Your rights</h2><p>Access, rectification, erasure, restriction, portability, objection. To exercise any right, email <a href="mailto:tanksnash@gmail.com" className="underline">tanksnash@gmail.com</a>. We respond within 30 days. EU/UK residents may complain to their local data-protection authority. California (CCPA) residents have additional rights to opt out of "sale" of data — we don't sell data.</p></section>
    <section><h2 className="text-foreground font-bold text-base">6. Retention</h2><p>Account data: kept until you delete your account. Generated content: kept until you delete it. Screenshots: never stored after analysis.</p></section>
    <section><h2 className="text-foreground font-bold text-base">7. Sub-processors</h2><p>We use trusted infrastructure providers (Lovable Cloud / Supabase for storage and auth, Lovable AI Gateway for AI inference). They are bound by data-protection agreements.</p></section>
    <section><h2 className="text-foreground font-bold text-base">8. Children</h2><p>Service is not directed at children under 13 (COPPA). If you believe a child has registered, contact us and we'll remove the account.</p></section>
    <section><h2 className="text-foreground font-bold text-base">9. Changes</h2><p>We'll notify users of material changes via in-app banner or email.</p></section>
  </PolicyLayout>
);
export default Privacy;
