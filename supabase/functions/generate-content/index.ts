import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const InputSchema = z.object({
  prompt: z.string().min(1).max(5000),
  postLength: z.enum(["short", "medium", "long"]),
  vibe: z.string().optional().default("Professional"),
  batchSize: z.number().min(1).max(50).optional().default(5),
  framework: z.string().optional(),
  think: z.boolean().optional().default(false),
  attachments: z.array(z.object({ name: z.string(), dataUrl: z.string() })).optional().default([]),
});

const SYSTEM_PROMPT = `You are a world-class LinkedIn content strategist. Create high-performing posts that drive engagement, build authority, and generate leads.

POST LENGTH (STRICT):
- short: < 400 chars
- medium: 800–1200 chars
- long: 2000–2800 chars
- HARD LIMIT: never exceed 2950 chars total

FORMATTING:
- Double line breaks between paragraphs
- Hook = 7–10 words, max 80 chars
- End with a specific question CTA
- 6–8 hashtags, 1–3 emojis used sparingly as functional anchors only
- Use arrows (→), checkmarks (✓), or bullets (•) for lists

FRAMEWORKS (rotate, no repeats in same batch):
- SLAY (Story → Lesson → Action → You)
- BAB (Before → After → Bridge)
- PAS (Problem → Agitate → Solution)
- Hook → Context → Tension → Pivot → Payoff
- Contrarian Take

Respond with JSON: { posts: [...] }. Each post = different structural style.`;

const THINK_PROMPT = `You are a sharp content strategist. Before writing posts, decide if the user's brief has enough specifics to write *original* content (not generic).

Ask for clarification ONLY if BOTH are true:
1. The brief is one short phrase with no specifics (no audience, no angle, no story, no result, no number)
2. The brief would force generic advice

Otherwise, do NOT clarify — just write.

If you DO ask, respond with JSON: { "clarify": "<one warm sentence asking the ONE missing detail>" }
If you have enough, respond with JSON: { "ok": true }`;

async function checkClarify(prompt: string, attachments: any[], apiKey: string): Promise<string | null> {
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: THINK_PROMPT },
        { role: "user", content: `Brief: "${prompt}"\nAttachments provided: ${attachments.length}` },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!r.ok) return null;
  const d = await r.json();
  try {
    const parsed = JSON.parse(d.choices?.[0]?.message?.content || "{}");
    return parsed.clarify || null;
  } catch { return null; }
}

async function generateBatch(prompt: string, postLength: string, vibe: string, count: number, attachments: any[], apiKey: string): Promise<any[]> {
  const lengthGuide = {
    short: "< 400 chars. Punchy and provocative.",
    medium: "800–1200 chars. Narrative + advice.",
    long: "2000–2800 chars. Deep storytelling or guides.",
  }[postLength];

  const userText = `Create exactly ${count} LinkedIn posts based on: "${prompt}"

Vibes (mix freely): ${vibe}
Length: ${postLength} — ${lengthGuide}
${attachments.length ? `User attached ${attachments.length} pictures for context — incorporate visual themes you see.` : ""}

Each post = a DIFFERENT framework. Include 6–8 hashtags per post and 3 image search terms.

JSON ONLY:
{
  "posts": [
    { "type": "Framework", "hook": "...", "body": "...", "cta": "...", "hashtags": ["#a","#b","#c","#d","#e","#f"], "imageSearchTerms": ["t1","t2","t3"] }
  ]
}`;

  const userContent: any[] = [{ type: "text", text: userText }];
  for (const a of attachments.slice(0, 3)) {
    userContent.push({ type: "image_url", image_url: { url: a.dataUrl } });
  }

  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: attachments.length ? userContent : userText },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!r.ok) {
    const t = await r.text();
    throw new Error(`AI gateway [${r.status}]: ${t.slice(0, 200)}`);
  }
  const d = await r.json();
  let content = d.choices?.[0]?.message?.content || "";
  const m = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (m) content = m[1];
  const parsed = JSON.parse(content.trim());
  return parsed.posts || [];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const parsed = InputSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { prompt, postLength, vibe, batchSize, think, attachments } = parsed.data;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    if (think) {
      const clarify = await checkClarify(prompt, attachments, LOVABLE_API_KEY);
      if (clarify) {
        return new Response(JSON.stringify({ clarify }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Chunk large batches in parallel
    const CHUNK = 10;
    let posts: any[] = [];
    if (batchSize <= CHUNK) {
      posts = await generateBatch(prompt, postLength, vibe, batchSize, attachments, LOVABLE_API_KEY);
    } else {
      const chunks: number[] = [];
      let remaining = batchSize;
      while (remaining > 0) { chunks.push(Math.min(remaining, CHUNK)); remaining -= CHUNK; }
      const results = await Promise.all(chunks.map(c => generateBatch(prompt, postLength, vibe, c, attachments, LOVABLE_API_KEY)));
      posts = results.flat();
    }

    return new Response(JSON.stringify({ posts }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("generate-content error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
