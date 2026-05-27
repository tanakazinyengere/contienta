// Analyse a LinkedIn SSI screenshot. v4: requires profile URL context,
// avoids generic "complete your profile" filler.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `You are an OCR + LinkedIn SSI coach. The screenshot is from linkedin.com/sales/ssi.

CRITICAL EXTRACTION RULES:
- Read printed numbers EXACTLY. Do NOT estimate, infer, or round.
- Each pillar max = 25. Overall SSI max = 100.
- Legible number → "confidence": "high".
- Partially obscured → score: null, confidence: "low".
- Not visible at all → score: null, confidence: "unreadable".

COACHING RULES — be specific, not generic:
- NEVER give the bland "complete your profile" / "add a photo" advice unless the screenshot literally shows missing fields.
- Use the user's actual SSI pillar weak points: lowest pillar gets concrete actions tied to that pillar.
- Suggestions must be specific to the pillar:
  * Professional Brand → headline rewrites, About reframing, featured-section ideas, post cadence
  * Find People → search filter tactics, alumni queries, recommended connections per week
  * Engage Insights → comment strategy on specific creator types, post-share ratio, save-worthy formats
  * Build Relationships → InMail templates, follow-up cadence, decision-maker outreach
- Each suggestion = ONE concrete action a smart user could do in 5 minutes today.

Respond ONLY with valid JSON in this exact shape:
{
  "profileHandle": "<visible name or 'you'>",
  "overallScore": <0-100 or null>,
  "overallConfidence": "high"|"low"|"unreadable",
  "pillars": {
    "professionalBrand": { "score": <0-25 or null>, "confidence": "high"|"low"|"unreadable", "details": "<friendly diagnosis>", "suggestions": ["<specific action>","...","..."] },
    "findPeople":        { "score": <0-25 or null>, "confidence": "high"|"low"|"unreadable", "details": "...", "suggestions": ["...","...","..."] },
    "engageInsights":    { "score": <0-25 or null>, "confidence": "high"|"low"|"unreadable", "details": "...", "suggestions": ["...","...","..."] },
    "buildRelationships":{ "score": <0-25 or null>, "confidence": "high"|"low"|"unreadable", "details": "...", "suggestions": ["...","...","..."] }
  },
  "overallSuggestions": ["<specific>","...","..."],
  "quickWins": ["<under-5-min action>","...","..."],
  "kindWords": ["<genuine compliment grounded in their actual scores>","...","..."]
}`;

async function callAI(dataUrl: string, profileUrl: string | undefined, key: string, model: string) {
  const userText = profileUrl
    ? `Read the visible SSI numbers exactly. Their LinkedIn profile is ${profileUrl} — use that handle when relevant. Coach with concrete tactics tied to their lowest pillars. Return null for anything not legible.`
    : `Read the visible SSI numbers exactly and coach concretely. Return null for anything not legible.`;
  return await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      max_tokens: 2500,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: [
          { type: "text", text: userText },
          { type: "image_url", image_url: { url: dataUrl } },
        ] },
      ],
      response_format: { type: "json_object" },
    }),
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { imageBase64, profileUrl } = await req.json();
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return new Response(JSON.stringify({ error: "imageBase64 is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const dataUrl = imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`;

    let aiResponse = await callAI(dataUrl, profileUrl, LOVABLE_API_KEY, "google/gemini-2.5-flash");
    if (!aiResponse.ok && aiResponse.status >= 500) {
      await new Promise(r => setTimeout(r, 600));
      aiResponse = await callAI(dataUrl, profileUrl, LOVABLE_API_KEY, "google/gemini-2.5-flash");
    }

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      const status = aiResponse.status === 429 || aiResponse.status === 402 ? aiResponse.status : 500;
      return new Response(
        JSON.stringify({ error: `Vision AI returned ${aiResponse.status}: ${errText.slice(0, 200)}` }),
        { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content ?? "";
    const m = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (m) content = m[1];

    let parsed;
    try { parsed = JSON.parse(content.trim()); }
    catch {
      const proResp = await callAI(dataUrl, profileUrl, LOVABLE_API_KEY, "google/gemini-2.5-pro");
      if (!proResp.ok) throw new Error(`Fallback model failed: ${proResp.status}`);
      const proData = await proResp.json();
      let pc = proData.choices?.[0]?.message?.content ?? "";
      const pm = pc.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (pm) pc = pm[1];
      parsed = JSON.parse(pc.trim());
    }

    return new Response(JSON.stringify(parsed), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("analyze-ssi-screenshot error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
