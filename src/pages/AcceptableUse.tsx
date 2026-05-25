import PolicyLayout from "@/components/PolicyLayout";
const AcceptableUse = () => (
  <PolicyLayout title="Acceptable Use Policy" description="Rules for using ClippedIn responsibly." canonical="https://clippedin.lovable.app/acceptable-use">
    <section><p>By using ClippedIn, you agree NOT to:</p><ul className="list-disc pl-5 space-y-1 mt-2"><li>Generate content that is illegal, harassing, defamatory, hateful, sexually explicit involving minors, or otherwise violates LinkedIn's or applicable law.</li><li>Attempt to reverse-engineer, scrape, or overload our service.</li><li>Use the service to impersonate others or spread misinformation.</li><li>Resell or sub-license access without written permission.</li><li>Upload screenshots containing other people's private data without consent.</li></ul></section>
    <section><h2 className="text-foreground font-bold text-base">Enforcement</h2><p>Violations may result in content removal, account suspension, or termination without refund. Serious violations may be reported to law enforcement.</p></section>
    <section><h2 className="text-foreground font-bold text-base">Report abuse</h2><p>Email <a href="mailto:tanksnash@gmail.com" className="underline">tanksnash@gmail.com</a>.</p></section>
  </PolicyLayout>
);
export default AcceptableUse;
