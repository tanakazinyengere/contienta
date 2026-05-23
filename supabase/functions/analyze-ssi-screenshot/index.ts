// Edge function: analyze a LinkedIn SSI screenshot using vision AI.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return new Response(JSON.stringify({ error: "imageBase64 is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const dataUrl = imageBase64.startsWith("data:")
      ? imageBase64
      : `data:image/png;base64,${imageBase64}`;

    const SYSTEM = `You read a screenshot of LinkedIn's Social Selling Index (SSI) page (linkedin.com/sales/ssi) and extract the 4 pillar scores and overall SSI. Then give kind, specific, actionable advice. Respond ONLY with valid JSON in this shape:
{
  "profileHandle": "<screenshot user if visible, else 'you'>",
  "pillars": {
    "professionalBrand": { "score": <0-25>, "details": "<friendly note>", "suggestions": ["<actionable with example>", ...] },
    "findPeople":        { "score": <0-25>, "details": "<friendly note>", "suggestions": ["...", ...] },
    "engageInsights":    { "score": <0-25>, "details": "<friendly note>", "suggestions": ["...", ...] },
    "buildRelationships":{ "score": <0-25>, "details": "<friendly note>", "suggestions": ["...", ...] }
  },
  "overallSuggestions": ["...", "...", "..."],
  "quickWins": ["<under-5-min action>", "...", "..."],
  "kindWords": ["<genuine compliment>", "...", "..."]
}
If a score is illegible, estimate from the visible context but stay close to what's shown.`;

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: SYSTEM },
            {
              role: "user",
              content: [
                { type: "text", text: "Extract my LinkedIn SSI scores and coach me." },
                { type: "image_url", image_url: { url: dataUrl } },
              ],
            },
          ],
        }),
      },
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      return new Response(
        JSON.stringify({ error: `AI vision failed: ${errText}` }),
        { status: aiResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content ?? "";
    const m = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (m) content = m[1];

    let parsed;
    try {
      parsed = JSON.parse(content.trim());
    } catch (e) {
      throw new Error(`AI returned non-JSON: ${content.slice(0, 200)}`);
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("analyze-ssi-screenshot error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
