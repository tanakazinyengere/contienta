// Creates a Stripe Checkout Session for a credit pack or subscription.
// Verification is done via /pricing?stripe_session_id=... redirect callback (no webhook).
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRICE_IDS: Record<string, string> = {
  credit_5: "price_1TbsLLRhcVsJZDqEmIIjj77c",
  credit_15: "price_1TbsMvRhcVsJZDqEdDq0Wf1T",
  credit_35: "price_1TbsfhRhcVsJZDqEGwDJz1JR",
  credit_80: "price_1TbsgfRhcVsJZDqEghyXRN77",
  credit_unlimited: "price_1TbsiMRhcVsJZDqE1AKSgMlU",
  premium_monthly: "price_1TbsmTRhcVsJZDqEnzFSQpzz",
  premium_yearly: "price_1TbsoQRhcVsJZDqE8fxUtfwM",
  plus_monthly: "price_1TbsrVRhcVsJZDqEMrr7serZ",
  plus_yearly: "price_1Tbst1RhcVsJZDqEvF4lXTPH",
  teams_monthly: "price_1TbsvWRhcVsJZDqEaO7SIUzx",
  teams_yearly: "price_1Tc13RRhcVsJZDqEECr2jFAw",
  enterprise_monthly: "price_1Tc15qRhcVsJZDqE0jbi3NpH",
  enterprise_yearly: "price_1Tc180RhcVsJZDqEuKMMMNia",
  donation: "price_1Tc1BmRhcVsJZDqEbBaKAtr4",
};

const SUBSCRIPTION_KEYS = new Set([
  "premium_monthly", "premium_yearly", "plus_monthly", "plus_yearly",
  "teams_monthly", "teams_yearly", "enterprise_monthly", "enterprise_yearly",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const key = Deno.env.get("STRIPE_SECRET_KEY");
    if (!key) {
      return new Response(JSON.stringify({ error: "STRIPE_SECRET_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { product, returnUrl, email } = await req.json();
    const priceId = PRICE_IDS[product];
    if (!priceId) {
      return new Response(JSON.stringify({ error: "Unknown product" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const stripe = new Stripe(key, { apiVersion: "2024-06-20" });
    const mode = SUBSCRIPTION_KEYS.has(product) ? "subscription" : "payment";
    const base = returnUrl || "https://clippedin.lovable.app/pricing";
    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${base}?stripe_session_id={CHECKOUT_SESSION_ID}&product=${product}`,
      cancel_url: `${base}?canceled=1`,
      customer_email: email || undefined,
      metadata: { product },
      allow_promotion_codes: true,
    });
    return new Response(JSON.stringify({ url: session.url, id: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
