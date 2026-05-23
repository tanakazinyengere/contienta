import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { pricingPlans } from "@/lib/pricingPlans";
import { toast } from "sonner";

const GOD_MODE_EMAIL = "tanakazinyengere2@gmail.com";

const Admin = () => {
  const profile = useUserProfile();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({ users: 0, premium: 0, saved: 0, donations: 0, conversionRate: 0 });
  const [grantEmail, setGrantEmail] = useState("");
  const [grantDuration, setGrantDuration] = useState<"5h" | "10h" | "24h" | "permanent">("permanent");
  const [paymentLinks, setPaymentLinks] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const isAdmin = profile.email === GOD_MODE_EMAIL;

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const [{ count: users }, { count: premium }, { count: saved }] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_pro", true),
        supabase.from("saved_posts").select("id", { count: "exact", head: true }),
      ]);
      const conversionRate = users > 0 ? Math.round((premium / users) * 100) : 0;
      setMetrics({ users: users ?? 0, premium: premium ?? 0, saved: saved ?? 0, donations: 0, conversionRate });
    } catch (error) {
      console.error(error);
      toast.error("Failed to load admin metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchMetrics();

    const saved = localStorage.getItem("clippedin-payment-links");
    const defaults = pricingPlans.reduce((acc, plan) => {
      acc[plan.name] = plan.checkoutUrl || "";
      return acc;
    }, {} as Record<string, string>);
    setPaymentLinks(saved ? JSON.parse(saved) : defaults);
  }, [isAdmin]);

  const updatePaymentLink = (planName: string, url: string) => {
    setPaymentLinks((prev) => ({ ...prev, [planName]: url }));
  };

  const handleSavePaymentLinks = () => {
    localStorage.setItem("clippedin-payment-links", JSON.stringify(paymentLinks));
    toast.success("Payment links saved.");
  };

  const handleGrantPremium = async () => {
    if (!grantEmail.trim()) {
      toast.error("Enter an email to grant premium access.");
      return;
    }
    setSaving(true);
    try {
      // Look up user_id from display_name match (email column not exposed); fallback: requires admin to know user id.
      // Simpler approach: update by display_name if matches; otherwise toast a friendly notice.
      const { data: matches, error: lookupError } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .ilike("display_name", `%${grantEmail.trim()}%`)
        .limit(1);
      if (lookupError) throw lookupError;
      if (!matches || matches.length === 0) {
        toast.error("No matching user found. Try the user's display name.");
        return;
      }
      const { error } = await supabase
        .from("profiles")
        .update({ is_pro: true })
        .eq("user_id", matches[0].user_id);
      if (error) throw error;
      toast.success("Pro access granted.");
      setGrantEmail("");
      fetchMetrics();
    } catch (err) {
      console.error(err);
      toast.error("Failed to grant Pro");
    } finally {
      setSaving(false);
    }
  };

  if (!profile.isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <div className="glass rounded-3xl p-8 max-w-xl text-center">
          <h1 className="text-2xl font-bold text-foreground">Admin console</h1>
          <p className="mt-4 text-sm text-muted-foreground">Please sign in with the admin email to access premium controls.</p>
          <div className="mt-6">
            <Button onClick={() => navigate("/login")} className="rounded-2xl bg-primary hover:bg-primary/90">
              Sign in
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <div className="glass rounded-3xl p-8 max-w-xl text-center">
          <h1 className="text-2xl font-bold text-foreground">Unauthorized</h1>
          <p className="mt-4 text-sm text-muted-foreground">
            You do not have access to the ClippedIn admin dashboard.
          </p>
          <div className="mt-6">
            <Button onClick={() => navigate("/")} className="rounded-2xl bg-primary hover:bg-primary/90">
              Return home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="glass rounded-3xl border border-border p-8 shadow-xl">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <h1 className="text-3xl font-extrabold font-display text-foreground">Admin Control</h1>
            <p className="text-sm text-muted-foreground">
              Manual premium sync, user metrics, and credit override controls for the ClippedIn authority platform.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-8">
            <div className="glass rounded-3xl p-5 space-y-2 border border-border">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Total users</p>
              <p className="text-3xl font-bold text-foreground">{loading ? "..." : metrics.users}</p>
            </div>
            <div className="glass rounded-3xl p-5 space-y-2 border border-border">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Premium activations</p>
              <p className="text-3xl font-bold text-foreground">{loading ? "..." : metrics.premium}</p>
            </div>
            <div className="glass rounded-3xl p-5 space-y-2 border border-border">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Conversion rate</p>
              <p className="text-3xl font-bold text-foreground">{loading ? "..." : `${metrics.conversionRate}%`}</p>
            </div>
            <div className="glass rounded-3xl p-5 space-y-2 border border-border">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Saved narratives</p>
              <p className="text-3xl font-bold text-foreground">{loading ? "..." : metrics.saved}</p>
            </div>
          </div>

          <div className="mt-10 glass rounded-3xl border border-border p-6">
            <h2 className="text-lg font-bold text-foreground">Authorize Premium Access</h2>
            <p className="text-sm text-muted-foreground">Grant premium status to users for testing, support, or manual activation.</p>
            <div className="mt-4 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  value={grantEmail}
                  onChange={(e) => setGrantEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="flex-1 rounded-2xl border border-border bg-secondary px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <select
                  value={grantDuration}
                  onChange={(e) => setGrantDuration(e.target.value as any)}
                  className="rounded-2xl border border-border bg-secondary px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="5h">5 Hours</option>
                  <option value="10h">10 Hours</option>
                  <option value="24h">24 Hours</option>
                  <option value="permanent">Permanent</option>
                </select>
                <Button onClick={handleGrantPremium} disabled={saving} className="rounded-2xl bg-primary hover:bg-primary/90">
                  {saving ? "Granting..." : "Grant Access"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Note: Duration-based access requires additional backend implementation. Currently grants permanent access.
              </p>
            </div>
          </div>

          <div className="mt-8 glass rounded-3xl border border-border p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">Payment Link Management</h2>
                <p className="text-sm text-muted-foreground">Update the Revolut checkout URLs used by your paid tiers in GodMode.</p>
              </div>
              <Button onClick={handleSavePaymentLinks} className="rounded-2xl bg-primary hover:bg-primary/90">
                Save links
              </Button>
            </div>
            <div className="space-y-5">
              {pricingPlans.filter((plan) => plan.name !== "BASIC").map((plan) => (
                <div key={plan.name} className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{plan.displayName}</p>
                      <p className="text-xs text-muted-foreground">{plan.price} • {plan.description}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(paymentLinks[plan.name] || plan.checkoutUrl, "_blank")}
                      className="rounded-2xl"
                    >
                      Open link
                    </Button>
                  </div>
                  <input
                    value={paymentLinks[plan.name] || ""}
                    onChange={(e) => updatePaymentLink(plan.name, e.target.value)}
                    placeholder="Revolut checkout link"
                    className="w-full rounded-2xl border border-border bg-secondary px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
