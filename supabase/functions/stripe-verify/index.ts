// Verifies a Stripe Checkout session after redirect and grants credits/upgrades the user.
// No webhooks — caller passes the session_id from the success URL.
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CREDIT_GRANTS: Record<string, number> = {
  credit_5: 5,
  credit_15: 15,
  credit_35: 35,
  credit_80: 80,
  credit_unlimited: 9999,
};

const TIER_GRANTS: Record<string, string> = {
  premium_monthly: "premium",
  premium_yearly: "premium",
  plus_monthly: "plus",
  plus_yearly: "plus",
  teams_monthly: "teams",
  teams_yearly: "teams",
  enterprise_monthly: "enterprise",
  enterprise_yearly: "enterprise",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const key = Deno.env.get("STRIPE_SECRET_KEY");
    if (!key) return new Response(JSON.stringify({ error: "missing key" }), { status: 500, headers: corsHeaders });
    const { sessionId } = await req.json();
    if (!sessionId) return new Response(JSON.stringify({ error: "sessionId required" }), { status: 400, headers: corsHeaders });

    const auth = req.headers.get("Authorization") || "";
    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "unauthenticated" }), { status: 401, headers: corsHeaders });

    const stripe = new Stripe(key, { apiVersion: "2024-06-20" });
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid" && session.status !== "complete") {
      return new Response(JSON.stringify({ ok: false, status: session.status }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const product = (session.metadata?.product as string) || "";

    let granted: { credits?: number; tier?: string } = {};
    if (CREDIT_GRANTS[product]) {
      const add = CREDIT_GRANTS[product];
      const { data: cur } = await supa.from("user_credits").select("bonus_remaining").eq("user_id", user.id).maybeSingle();
      await supa.from("user_credits").upsert({
        user_id: user.id,
        bonus_remaining: (cur?.bonus_remaining || 0) + add,
      }, { onConflict: "user_id" });
      granted.credits = add;
    }
    if (TIER_GRANTS[product]) {
      const tier = TIER_GRANTS[product];
      await supa.from("user_credits").update({ tier }).eq("user_id", user.id);
      await supa.from("profiles").update({ is_pro: true }).eq("user_id", user.id);
      granted.tier = tier;
    }
    await supa.from("notifications").insert({
      user_id: user.id,
      kind: "payment",
      title: granted.tier ? `Welcome to ${granted.tier}` : `+${granted.credits} credits added`,
      body: "Thanks for supporting ClippedIn.",
      link: "/app",
    });
    return new Response(JSON.stringify({ ok: true, granted }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500, headers: corsHeaders });
  }
});
