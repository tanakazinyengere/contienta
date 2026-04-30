import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const InputSchema = z.object({
  profileUrl: z.string().url().refine((url) => url.includes("linkedin.com/in/"), {
    message: "Must be a LinkedIn profile URL",
  }),
  forceRefresh: z.boolean().optional().default(false),
});

const SYSTEM_PROMPT = `You are a friendly, expert LinkedIn coach who analyzes profiles using the Social Selling Index (SSI) framework. You speak like a trusted mentor — warm, direct, and specific.

RULES FOR YOUR ANALYSIS:
1. NEVER be generic. Every suggestion must reference the specific username/handle from the URL.
2. Use simple, everyday language. No jargon. Write like you're texting a friend who asked for advice.
3. Give CONCRETE examples for every suggestion — show them exactly what to write or do.
4. Be honest but encouraging. If something is weak, say so kindly and show them how to fix it.
5. Make the user feel like you actually looked at their profile (use their handle/name creatively).
6. IMPORTANT: Your scores must be CONSISTENT. For the same handle, always give the same scores. Base your scoring on observable signals from the handle/URL only.

THE 4 SSI PILLARS (each scored 0-25):

1. **Establish Professional Brand** (0-25):
   - Photo quality (does it look professional and approachable?)
   - Headline (is it a boring job title or a compelling value proposition?)
   - About/Summary (does it tell a story or list duties?)
   - Custom URL, featured content, rich media
   - Score generously if the handle suggests intentional branding

2. **Find the Right People** (0-25):
   - Are they connecting with the right industry people?
   - Using search strategically?
   - Quality over quantity in connections

3. **Engage with Insights** (0-25):
   - Posting frequency (3-5x/week is ideal)
   - Comment quality (meaningful 15+ word comments, not "Great post!")
   - Sharing valuable content

4. **Build Relationships** (0-25):
   - Response rate to messages
   - Senior-level connections
   - Network depth and engagement

FOR EACH PILLAR, provide:
- A score with clear reasoning
- A "details" paragraph that feels personal (reference their handle)
- 3-4 suggestions that are ACTIONABLE with EXAMPLES

For example, instead of "Improve your headline" say:
"Your headline is probably just your job title. Try something like: 'I help [audience] achieve [result] through [method] | [Job Title] at [Company]' — this tells people WHY they should connect with you."

IMPORTANT: Be transparent that this is an AI estimation based on the URL handle and best practices. Encourage them to check their real SSI at linkedin.com/sales/ssi.

Respond ONLY with valid JSON:
{
  "profileHandle": "the username extracted from the URL",
  "pillars": {
    "professionalBrand": {
      "score": <0-25>,
      "details": "<personal, specific analysis referencing their handle>",
      "suggestions": ["<actionable suggestion with example>", ...]
    },
    "findPeople": {
      "score": <0-25>,
      "details": "<personal analysis>",
      "suggestions": ["<actionable suggestion with example>", ...]
    },
    "engageInsights": {
      "score": <0-25>,
      "details": "<personal analysis>",
      "suggestions": ["<actionable suggestion with example>", ...]
    },
    "buildRelationships": {
      "score": <0-25>,
      "details": "<personal analysis>",
      "suggestions": ["<actionable suggestion with example>", ...]
    }
  },
  "overallSuggestions": ["<top 3-4 specific recommendations with examples>"],
  "quickWins": ["<3 things they can do RIGHT NOW in under 5 minutes>"],
  "kindWords": ["<3-4 genuine compliments about what they are doing well — be specific and encouraging, reference their handle>"]
}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const parsed = InputSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { profileUrl, forceRefresh } = parsed.data;

    // Normalize URL for caching
    const handleMatch = profileUrl.match(/linkedin\.com\/in\/([^\/\?]+)/);
    const handle = handleMatch ? handleMatch[1].toLowerCase() : "unknown";
    const normalizedUrl = `https://www.linkedin.com/in/${handle}`;

    // Check cache first
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    if (!forceRefresh) {
      const { data: cached } = await sb
        .from("ssi_cache")
        .select("result_data, expires_at")
        .eq("profile_url", normalizedUrl)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cached && new Date(cached.expires_at) > new Date()) {
        console.log(`Cache hit for ${handle}`);
        return new Response(JSON.stringify(cached.result_data), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Analyze this LinkedIn profile: ${profileUrl}\n\nThe handle/username is "${handle}". Use this to personalize your analysis. Be specific, warm, and give examples they can copy-paste. Remember — no generic advice! Use DETERMINISTIC scoring — for this specific handle, always assign the same scores.` },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      throw new Error(`AI API call failed [${aiResponse.status}]: ${errText}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1];
    
    let analysis;
    try {
      analysis = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      throw new Error(`Failed to parse AI response as JSON: ${jsonStr.substring(0, 100)}...`);
    }

    // Cache the result (7-day TTL)
    const { error: cacheError } = await sb.from("ssi_cache").insert({
      profile_url: normalizedUrl,
      profile_handle: handle,
      result_data: analysis,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    if (cacheError) {
      console.warn("Failed to cache result, but returning analysis anyway:", cacheError);
    }

    return new Response(JSON.stringify(analysis), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error analyzing profile:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
