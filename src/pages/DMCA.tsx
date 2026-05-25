import PolicyLayout from "@/components/PolicyLayout";
const DMCA = () => (
  <PolicyLayout title="DMCA & Copyright" description="How to file a copyright infringement notice with ClippedIn." canonical="https://clippedin.lovable.app/dmca">
    <section><p>Snashco LLC respects intellectual property rights. If you believe content on ClippedIn infringes your copyright, send a DMCA notice to <a href="mailto:tanksnash@gmail.com" className="underline">tanksnash@gmail.com</a> with:</p><ul className="list-disc pl-5 space-y-1 mt-2"><li>Identification of the copyrighted work.</li><li>Location of the allegedly infringing material on our service.</li><li>Your contact details (name, address, phone, email).</li><li>A statement of good-faith belief and accuracy under penalty of perjury.</li><li>Your physical or electronic signature.</li></ul></section>
    <section><h2 className="text-foreground font-bold text-base">Counter-notice</h2><p>If your content was removed and you believe it was a mistake, you may file a counter-notice using the same email.</p></section>
    <section><h2 className="text-foreground font-bold text-base">Repeat infringers</h2><p>Accounts found to be repeat infringers will be terminated.</p></section>
  </PolicyLayout>
);
export default DMCA;
