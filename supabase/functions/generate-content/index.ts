import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const InputSchema = z.object({
  prompt: z.string().min(1).max(5000),
  postLength: z.enum(["short", "medium", "long"]),
  vibe: z.string().optional().default("Professional"),
  batchSize: z.number().min(1).max(50).optional().default(5),
  framework: z.string().optional(),
});

const SYSTEM_PROMPT = `You are a world-class LinkedIn content strategist. You create high-performing LinkedIn posts that drive engagement, build authority, and generate leads.

POST LENGTH GUIDELINES (STRICT):
- "short": Under 400 chars. Punchy, provocative. One idea, one question.
- "medium": 800-1200 chars. Narrative + advice. Use frameworks like PAS, BAB.
- "long": 2000-2800 chars. Deep-dive guides, personal stories.
- HARD LIMIT: Never exceed 2950 characters (to leave room for metadata).

FORMATTING RULES:
- Character counts include spaces and emojis.
- Double line breaks between sentences for readability
- Hook must be 7-10 words, maximum 80 characters
- End with a specific Call-to-Action question
- ALWAYS include exactly 6-8 hashtags per post
- Use emojis sparingly as functional anchors (1-3 per post)
- Use arrows (→), checkmarks (✓), bullets (•) for lists

FRAMEWORKS TO USE:
- SLAY: Story → Lesson → Action → You
- BAB: Before → After → Bridge
- PAS: Problem → Agitate → Solution
- Hook-Context-Tension-Pivot-Payoff for long posts
- Contrarian Take for short posts

Respond with a JSON object containing a "posts" array. Each post MUST have a different structural style.`;

async function generateBatch(prompt: string, postLength: string, vibe: string, count: number, apiKey: string): Promise<any[]> {
  const lengthGuide = {
    short: "Keep each post under 400 characters. Punchy and provocative.",
    medium: "Each post should be 800-1200 characters. Narrative with advice.",
    long: "Each post should be 2000-2800 characters. Deep storytelling or comprehensive guides.",
  }[postLength];

  const userMessage = `Create exactly ${count} LinkedIn posts based on this input: "${prompt}"

Vibe/Tone: ${vibe}
Length: ${postLength} - ${lengthGuide}

Each post must use a DIFFERENT structural style. Include exactly 6-8 hashtags per post.
Also suggest 3 relevant stock image search terms for each post.

Respond ONLY with valid JSON:
{
  "posts": [
    {
      "type": "Framework Name",
      "hook": "7-10 word attention grabber",
      "body": "The main post content with proper formatting",
      "cta": "Specific call-to-action question",
      "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5", "#tag6"],
      "imageSearchTerms": ["term1", "term2", "term3"]
    }
  ]
}`;

  const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
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
  return result.posts || [];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const parsed = InputSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { prompt, postLength, vibe, batchSize } = parsed.data;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // For large batches, chunk into parallel requests of max 10
    const CHUNK_SIZE = 10;
    let allPosts: any[] = [];

    if (batchSize <= CHUNK_SIZE) {
      allPosts = await generateBatch(prompt, postLength, vibe, batchSize, LOVABLE_API_KEY);
    } else {
      const chunks: number[] = [];
      let remaining = batchSize;
      while (remaining > 0) {
        const size = Math.min(remaining, CHUNK_SIZE);
        chunks.push(size);
        remaining -= size;
      }

      // Run chunks in parallel (max 5 concurrent)
      const results = await Promise.all(
        chunks.map((size) => generateBatch(prompt, postLength, vibe, size, LOVABLE_API_KEY))
      );
      allPosts = results.flat();
    }

    return new Response(JSON.stringify({ posts: allPosts }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Content generation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
