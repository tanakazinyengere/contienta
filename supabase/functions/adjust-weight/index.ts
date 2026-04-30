import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const InputSchema = z.object({
  hook: z.string(),
  body: z.string(),
  cta: z.string(),
  direction: z.enum(["increase", "decrease"]),
});

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const raw = await req.json();
    const parsed = InputSchema.safeParse(raw);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { hook, body, cta, direction } = parsed.data;
    const ClippedIn_API_KEY = Deno.env.get("ClippedIn_API_KEY");
    if (!ClippedIn_API_KEY) throw new Error("ClippedIn_API_KEY is not configured");

    const prompt = direction === "increase"
      ? `Expand this LinkedIn post to be longer and more detailed (add more examples, data, storytelling). Stay under 3000 characters total. Keep the same tone and style. Return ONLY the expanded version.`
      : `Condense this LinkedIn post to be shorter and punchier. Remove filler, keep only the strongest points. Return ONLY the condensed version.`;

    const aiResponse = await fetch("https://ai.gateway.ClippedIn.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ClippedIn_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You adjust LinkedIn post weight/length. Return ONLY valid JSON with hook, body, cta fields. No markdown." },
          { role: "user", content: `${prompt}\n\nCurrent post:\nHook: ${hook}\nBody: ${body}\nCTA: ${cta}\n\nRespond with JSON: {"hook":"...","body":"...","cta":"..."}` },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error(`AI gateway error [${aiResponse.status}]: ${errText}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;
    if (!content) throw new Error("No content in AI response");

    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1];

    const result = JSON.parse(jsonStr.trim());

    return new Response(JSON.stringify(result), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Weight adjust error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

