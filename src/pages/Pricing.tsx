import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import Footer from "@/components/Footer";

type Billing = "monthly" | "yearly";
type Audience = "individual" | "business";

interface Plan {
  key: string;
  name: string;
  monthly: string;
  yearly: string;
  description: string;
  features: string[];
  cta: string;
  audience: Audience;
  popular?: boolean;
}

const PLANS: Plan[] = [
  { key: "free",       name: "Free",       monthly: "$0",    yearly: "$0",     description: "Get started with the essentials.", features: ["50 monthly credits", "10 daily credits (5 days)", "1 workspace", "Basic SSI analysis"], cta: "Current plan",   audience: "individual" },
  { key: "premium",    name: "Premium",    monthly: "$9.99", yearly: "$99.86", description: "For rising professionals.",        features: ["150 monthly credits", "15 daily credits (10 days)", "Up to 2 workspaces", "Full SSI audit", "7-day free trial"], cta: "Coming soon",    audience: "individual" },
  { key: "plus",       name: "Plus",       monthly: "$23.89", yearly: "$239.00", description: "For high-velocity creators.",     features: ["300 monthly credits", "20 daily credits (15 days)", "Up to 5 workspaces", "Reef scheduling", "Custom domain"], cta: "Coming soon",    audience: "individual" },
  { key: "teams",      name: "Teams",      monthly: "$56.84", yearly: "$568.00", description: "For small teams.",                features: ["500 monthly credits", "25 daily credits (20 days)", "Unlimited workspaces", "Priority support", "20-day free trial"], cta: "Contact sales",  audience: "business" },
  { key: "enterprise", name: "Enterprise", monthly: "$89.90", yearly: "$899.00", description: "For high-stakes brands.",         features: ["Unlimited credits", "25 days/month active", "Unlimited members", "Predictive analytics", "Admin support"],  cta: "Contact sales",  audience: "business", popular: true },
];

const COMING_SOON = "Live payments are coming soon — join the waitlist on the dashboard to be notified.";

const Pricing = () => {
  const navigate = useNavigate();
  const [billing, setBilling] = useState<Billing>(() => (localStorage.getItem("pricing-billing") as Billing) || "monthly");
  const [audience, setAudience] = useState<Audience>(() => (localStorage.getItem("pricing-audience") as Audience) || "individual");

  useEffect(() => { localStorage.setItem("pricing-billing", billing); }, [billing]);
  useEffect(() => { localStorage.setItem("pricing-audience", audience); }, [audience]);

  const visiblePlans = PLANS.filter(p => p.audience === audience);

  const handleCTA = (plan: Plan) => {
    if (plan.cta === "Current plan") { navigate("/app"); return; }
    if (plan.cta === "Contact sales") { navigate("/contact"); return; }
    toast.info(COMING_SOON);
  };

  return (
    <TooltipProvider>
      <SEO title="Pricing" description="Simple, transparent pricing for ClippedIn. Free forever — upgrade when you're ready to grow." canonical="https://clippedin.lovable.app/pricing" />
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 px-4 sm:px-8 py-8 max-w-6xl mx-auto w-full space-y-8">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5 press-effect"><ArrowLeft className="w-4 h-4" /> Back</Button>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3">
            <h1 className="text-fluid-2xl font-extrabold font-display text-gradient">Plans &amp; Pricing</h1>
            <p className="text-fluid-sm text-muted-foreground">Build your LinkedIn authority. Pick a plan when you're ready.</p>
          </motion.div>

          {/* Toggles */}
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

          {/* Cards */}
          <div className="flex flex-wrap justify-center gap-6">
            {visiblePlans.map((plan, i) => {
              const price = billing === "monthly" ? plan.monthly : plan.yearly;
              const subPrice = billing === "yearly" && plan.yearly !== "$0" ? `(~$${(parseFloat(plan.yearly.replace("$", "")) / 12).toFixed(2)}/mo)` : null;
              return (
                <motion.div
                  key={plan.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={`relative w-[320px] glass rounded-3xl p-6 flex flex-col gap-5 hover:-translate-y-1 hover:shadow-2xl transition-all ${plan.popular ? "ring-2 ring-primary/60" : ""}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 right-4 px-3 py-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />Most popular
                    </div>
                  )}
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold font-display text-foreground">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground">{plan.description}</p>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-foreground">{price}</span>
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
                        {plan.cta}
                      </Button>
                    </TooltipTrigger>
                    {plan.cta === "Coming soon" && <TooltipContent>{COMING_SOON}</TooltipContent>}
                  </Tooltip>
                </motion.div>
              );
            })}
          </div>

          <p className="text-center text-[11px] text-muted-foreground max-w-xl mx-auto">
            All prices in USD. Live payments will be processed via our trusted partner once activated. Until then, all upgrade buttons add you to the early-access waitlist.
          </p>
        </div>
        <Footer />
      </div>
    </TooltipProvider>
  );
};

export default Pricing;
