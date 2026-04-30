import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-10">
      <div className="glass rounded-3xl p-8 max-w-3xl border border-border shadow-2xl">
        <div className="space-y-4 text-center">
          <h1 className="text-3xl font-extrabold font-display">Terms and Conditions</h1>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            ClippedIn is an independent professional assistance tool. We are not affiliated with LinkedIn and we do not have any control over your LinkedIn account or third-party restrictions.
          </p>
        </div>

        <div className="space-y-4 mt-8 text-sm leading-7 text-muted-foreground">
          <h2 className="text-lg font-bold text-foreground">Terms of Service</h2>
          <p>
            No refunds on digital assets. Once a purchase is completed through Revolut Secure Checkout, the transaction is final.
          </p>
          <p>
            ClippedIn is an independent professional tool for personal branding assistance; we are not liable for LinkedIn account restrictions, policy changes, or platform-specific fluctuations.
          </p>
          <p>
            By using ClippedIn, you agree to use this service responsibly for professional development and acknowledge that outcomes depend on individual effort and platform policies.
          </p>
          <p>
            Your Revolut email should match your ClippedIn login for instant plan synchronization and premium activation.
          </p>

          <h2 className="text-lg font-bold text-foreground mt-6">Privacy Policy</h2>
          <p>
            We collect LinkedIn profile URLs solely for analysis purposes to provide personalized authority-building recommendations. URLs are processed temporarily and not stored permanently.
          </p>
          <p>
            Payment processing is handled securely through Revolut. We do not store payment information on our servers.
          </p>
          <p>
            Cookies are used for interactive UI features and user session management. You can control cookie preferences through your browser settings.
          </p>
          <p>
            All data processing complies with standard privacy regulations. Your information is used only to provide the service and improve user experience.
          </p>
        </div>

        <div className="mt-8 text-center">
          <Button onClick={() => navigate("/")} className="rounded-2xl bg-primary hover:bg-primary/90">
            Back to ClippedIn
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Terms;
