// Edge function: analyze a LinkedIn SSI screenshot using vision AI.
// v2: stricter extraction — never estimates. Returns null + low confidence when unsure.
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

    const SYSTEM = `You are an OCR + LinkedIn SSI coach. The screenshot is from linkedin.com/sales/ssi.

CRITICAL EXTRACTION RULES:
- Read the printed numbers EXACTLY. Do not estimate, do not infer, do not round.
- Each pillar has a maximum of 25. Overall SSI maximum is 100.
- If a number is clearly legible, set "confidence": "high".
- If a number is partially obscured or ambiguous, return null for "score" and "confidence": "low".
- If you cannot see that pillar at all in this screenshot, return null for "score" and "confidence": "unreadable".
- Never invent a score to "look helpful". Null is correct when uncertain.

Respond ONLY with valid JSON in this exact shape:
{
  "profileHandle": "<the user name visible on screen, or 'you'>",
  "overallScore": <number 0-100 or null>,
  "overallConfidence": "high" | "low" | "unreadable",
  "pillars": {
    "professionalBrand": { "score": <0-25 or null>, "confidence": "high"|"low"|"unreadable", "details": "<friendly note>", "suggestions": ["<actionable tip with example>", "...", "..."] },
    "findPeople":        { "score": <0-25 or null>, "confidence": "high"|"low"|"unreadable", "details": "...", "suggestions": ["...","...","..."] },
    "engageInsights":    { "score": <0-25 or null>, "confidence": "high"|"low"|"unreadable", "details": "...", "suggestions": ["...","...","..."] },
    "buildRelationships":{ "score": <0-25 or null>, "confidence": "high"|"low"|"unreadable", "details": "...", "suggestions": ["...","...","..."] }
  },
  "overallSuggestions": ["...","...","..."],
  "quickWins": ["<under-5-min action>","...","..."],
  "kindWords": ["<genuine compliment>","...","..."]
}`;

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          messages: [
            { role: "system", content: SYSTEM },
            {
              role: "user",
              content: [
                { type: "text", text: "Read the visible SSI numbers exactly and coach me. Return null for anything you can't read clearly." },
                { type: "image_url", image_url: { url: dataUrl } },
              ],
            },
          ],
          response_format: { type: "json_object" },
        }),
      },
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      const status = aiResponse.status === 429 || aiResponse.status === 402 ? aiResponse.status : 500;
      return new Response(
        JSON.stringify({ error: `AI vision failed: ${errText.slice(0, 300)}` }),
        { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content ?? "";
    const m = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (m) content = m[1];

    let parsed;
    try {
      parsed = JSON.parse(content.trim());
    } catch {
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
