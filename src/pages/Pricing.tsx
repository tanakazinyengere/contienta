import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Check, Sparkles, Coins, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

type Billing = "monthly" | "yearly";
type Audience = "individual" | "business";

interface Plan {
  key: string;
  name: string;
  monthly: number;
  yearly: number;
  description: string;
  features: string[];
  cta: string;
  audience: Audience;
  popular?: boolean;
  trial?: number;
}

// Prices per Payment SPECS v25.0 (EUR). Stripe for credits + subscriptions; Revolut donations only.
const PLANS: Plan[] = [
  { key: "free", name: "Free", monthly: 0, yearly: 0, description: "Get started with the essentials.",
    features: ["50 credits / month", "10 daily credits · 5 active days", "1 workspace", "Basic SSI analysis"],
    cta: "Current plan", audience: "individual" },
  { key: "premium", name: "Premium", monthly: 9.99, yearly: 95.00, description: "For rising professionals.", trial: 7,
    features: ["150 credits / month", "15 daily credits · 10 active days", "Up to 2 workspaces", "Full SSI audit", "7-day free trial"],
    cta: "Upgrade", audience: "individual" },
  { key: "plus", name: "Plus", monthly: 16.00, yearly: 160.00, description: "For high-velocity creators.",
    features: ["300 credits / month", "20 daily credits · 15 active days", "Up to 5 workspaces", "Reef scheduling", "Custom domain", "First month free"],
    cta: "Upgrade", audience: "individual" },
  { key: "teams", name: "Teams", monthly: 52.00, yearly: 520.00, description: "For small teams.", trial: 20,
    features: ["500 credits / month", "25 daily credits · 20 active days", "Unlimited workspaces", "Priority support", "20-day free trial"],
    cta: "Upgrade", audience: "business" },
  { key: "enterprise", name: "Enterprise", monthly: 90.00, yearly: 890.00, description: "For high-stakes brands.",
    features: ["Unlimited credits", "25 active days / month", "Unlimited members", "Predictive analytics", "Dedicated admin support"],
    cta: "Upgrade", audience: "business", popular: true },
];

const TOKEN_PACKS = [
  { credits: 5, price: 0.99, product: "credit_5" },
  { credits: 15, price: 2.49, product: "credit_15" },
  { credits: 35, price: 4.99, product: "credit_35" },
  { credits: 80, price: 9.99, product: "credit_80" },
  { credits: "Unlimited · 3 months", price: 69.00, product: "credit_unlimited" },
];

const DONATION_LINK = "https://checkout.revolut.com/pay/6000dfb4-0ad8-4eb3-b430-e312c15701d7";
const fmt = (n: number) => n === 0 ? "€0" : `€${n.toFixed(2)}`;

async function startStripeCheckout(product: string) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) { toast.error("Please sign in to purchase."); return; }
  const { data: { user } } = await supabase.auth.getUser();
  try {
    const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ product, email: user?.email, returnUrl: `${window.location.origin}/pricing` }),
    });
    const data = await resp.json();
    if (data?.url) window.location.href = data.url;
    else toast.error(data?.error || "Stripe is not configured yet. Please contact support.");
  } catch {
    toast.error("Checkout failed. Try again shortly.");
  }
}

const Pricing = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [billing, setBilling] = useState<Billing>(() => (localStorage.getItem("pricing-billing") as Billing) || "monthly");
  const [audience, setAudience] = useState<Audience>(() => (localStorage.getItem("pricing-audience") as Audience) || "individual");

  useEffect(() => { localStorage.setItem("pricing-billing", billing); }, [billing]);
  useEffect(() => { localStorage.setItem("pricing-audience", audience); }, [audience]);

  // Redirect callback verification (no webhooks)
  useEffect(() => {
    const sid = params.get("stripe_session_id");
    if (!sid) return;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      try {
        const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ sessionId: sid }),
        });
        const data = await resp.json();
        if (data?.ok) {
          if (data.granted?.credits) toast.success(`+${data.granted.credits} credits added`);
          if (data.granted?.tier) toast.success(`Plan upgraded to ${data.granted.tier}`);
        }
      } catch {/* ignore */}
      // Clean URL
      const next = new URLSearchParams(params);
      next.delete("stripe_session_id");
      next.delete("product");
      setParams(next, { replace: true });
    })();
  }, [params, setParams]);

  const visiblePlans = PLANS.filter(p => p.audience === audience);

  const handleCTA = (plan: Plan) => {
    if (plan.cta === "Current plan") { navigate("/app"); return; }
    const product = `${plan.key}_${billing}`;
    startStripeCheckout(product);
  };

  return (
    <TooltipProvider>
      <SEO title="Pricing — ClippedIn" description="Simple, transparent pricing in EUR. Subscriptions, credit top-ups, and donations." canonical="https://clippedin.lovable.app/pricing" />
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 px-4 sm:px-8 py-8 max-w-6xl mx-auto w-full space-y-10">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5 press-effect"><ArrowLeft className="w-4 h-4" /> Back</Button>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3">
            <h1 className="text-fluid-2xl font-extrabold font-display text-gradient">Plans &amp; Pricing</h1>
            <p className="text-fluid-sm text-muted-foreground">Build your LinkedIn authority. All prices in EUR. Secure checkout by Stripe.</p>
          </motion.div>

          <div className="flex flex-col items-center gap-3">
            <div className="inline-flex glass rounded-full p-1">
              {(["individual", "business"] as Audience[]).map(a => (
                <button key={a} onClick={() => setAudience(a)} className={`px-4 py-1.5 text-xs font-semibold rounded-full press-effect transition-colors ${audience === a ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                  {a === "individual" ? "Individual" : "Business"}
                </button>
              ))}
            </div>
            <div className="inline-flex glass rounded-full p-1">
              {(["monthly", "yearly"] as Billing[]).map(b => (
                <button key={b} onClick={() => setBilling(b)} className={`px-4 py-1.5 text-xs font-semibold rounded-full press-effect transition-colors ${billing === b ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                  {b === "monthly" ? "Monthly" : "Annual · save ~17%"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-6">
            {visiblePlans.map((plan, i) => {
              const price = billing === "monthly" ? plan.monthly : plan.yearly;
              const subPrice = billing === "yearly" && plan.yearly > 0 ? `~${fmt(plan.yearly / 12)}/mo` : null;
              return (
                <motion.div key={plan.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className={`relative w-[320px] glass rounded-3xl p-6 flex flex-col gap-5 hover:-translate-y-1 hover:shadow-2xl transition-all ${plan.popular ? "ring-2 ring-primary/60" : ""}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 right-4 px-3 py-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />Most popular
                    </div>
                  )}
                  {plan.trial && (
                    <div className="absolute -top-3 left-4 px-3 py-1 bg-secondary text-foreground text-[10px] font-bold rounded-full uppercase tracking-wider">
                      {plan.trial}-day trial
                    </div>
                  )}
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold font-display text-foreground">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground">{plan.description}</p>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-foreground">{fmt(price)}</span>
                      <span className="text-xs text-muted-foreground">/{billing === "monthly" ? "mo" : "yr"}</span>
                    </div>
                    {subPrice && <p className="text-[11px] text-muted-foreground mt-0.5">{subPrice}</p>}
                  </div>
                  <ul className="space-y-2 flex-1">
                    {plan.features.map((f, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Check className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={() => handleCTA(plan)} className="w-full h-12 rounded-full font-semibold press-effect" variant={plan.popular ? "default" : "outline"}>
                        {plan.cta === "Current plan" ? "Current plan" : "Subscribe via Stripe"}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Secure Stripe Checkout · cancel anytime</TooltipContent>
                  </Tooltip>
                </motion.div>
              );
            })}
          </div>

          <section className="space-y-4">
            <div className="text-center space-y-1">
              <h2 className="text-fluid-xl font-bold font-display flex items-center justify-center gap-2"><Coins className="w-5 h-5 text-primary" /> Top-up credits</h2>
              <p className="text-xs text-muted-foreground">One-time purchases via Stripe.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 max-w-5xl mx-auto">
              {TOKEN_PACKS.map((pack, i) => (
                <button key={i} onClick={() => startStripeCheckout(pack.product)}
                  className="glass rounded-2xl p-4 flex flex-col items-center gap-1 hover:-translate-y-0.5 hover:shadow-xl transition-all press-effect">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">Pack</span>
                  <span className="text-sm font-bold text-foreground text-center">{typeof pack.credits === "number" ? `${pack.credits} credits` : pack.credits}</span>
                  <span className="text-lg font-extrabold text-primary">{fmt(pack.price)}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="text-center space-y-3 max-w-xl mx-auto">
            <h2 className="text-fluid-lg font-bold font-display flex items-center justify-center gap-2"><Heart className="w-4 h-4 text-primary" /> Support the build</h2>
            <p className="text-xs text-muted-foreground">ClippedIn is built by an indie team. Donations stay on Revolut and go straight to roadmap work.</p>
            <Button asChild variant="outline" className="rounded-full press-effect">
              <a href={DONATION_LINK} target="_blank" rel="noopener noreferrer">Donate via Revolut</a>
            </Button>
          </section>

          <p className="text-center text-[11px] text-muted-foreground max-w-xl mx-auto">
            Subscriptions and credit top-ups process securely on Stripe. Donations remain on Revolut by design. No webhooks — purchases verify on redirect.
          </p>
        </div>
        <Footer />
      </div>
    </TooltipProvider>
  );
};

export default Pricing;
