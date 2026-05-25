import PolicyLayout from "@/components/PolicyLayout";
const Cookies = () => (
  <PolicyLayout title="Cookie Policy" description="What cookies and similar technologies ClippedIn uses, and your choices." canonical="https://clippedin.lovable.app/cookies">
    <section><h2 className="text-foreground font-bold text-base">What are cookies?</h2><p>Small pieces of data stored in your browser to remember preferences and keep you signed in.</p></section>
    <section><h2 className="text-foreground font-bold text-base">Cookies we use</h2><ul className="list-disc pl-5 space-y-1"><li><b>Essential</b> (always on): authentication session, CSRF protection, security tokens.</li><li><b>Preferences</b>: pricing toggle (monthly/annual), theme, cookie consent state.</li><li><b>Analytics</b> (only after you accept): anonymous usage metrics to improve the product.</li></ul></section>
    <section><h2 className="text-foreground font-bold text-base">Your choice</h2><p>Use the cookie banner to accept or reject non-essential cookies. You can change your mind any time by clearing your browser's local storage and reloading.</p></section>
    <section><h2 className="text-foreground font-bold text-base">Third-party cookies</h2><p>Google OAuth may set cookies on its own domain when you sign in with Google. See Google's policy for details.</p></section>
  </PolicyLayout>
);
export default Cookies;
