// Clean helper to push a scheduled LinkedIn post via the Community Management API.
// NOTE: LinkedIn's native scheduling is only available to approved Marketing Developer
// Platform partners. For projects without that approval, store the schedule locally
// and call /linkedin-publish at the scheduled time from a cron worker.
//
// Pure API request structure — no database logic.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LINKEDIN_API = "https://api.linkedin.com/rest/posts";
const LINKEDIN_VERSION = "202405";

interface ScheduleInput {
  accessToken: string;
  authorUrn: string;       // e.g. "urn:li:person:abc" or "urn:li:organization:123"
  text: string;
  scheduledAtMs: number;   // future epoch ms
}

export async function scheduleLinkedInPost(input: ScheduleInput): Promise<{ id: string }> {
  const { accessToken, authorUrn, text, scheduledAtMs } = input;
  if (!accessToken) throw new Error("accessToken required");
  if (!authorUrn) throw new Error("authorUrn required");
  if (!text?.trim()) throw new Error("text required");
  if (!scheduledAtMs || scheduledAtMs <= Date.now()) throw new Error("scheduledAtMs must be in the future");

  const body = {
    author: authorUrn,
    commentary: text,
    visibility: "PUBLIC",
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: "PUBLISHED",
    publishedAt: scheduledAtMs,
    isReshareDisabledByAuthor: false,
  };

  const r = await fetch(LINKEDIN_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "LinkedIn-Version": LINKEDIN_VERSION,
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(body),
  });

  if (!r.ok) {
    const errText = await r.text();
    throw new Error(`LinkedIn schedule failed (${r.status}): ${errText.slice(0, 300)}`);
  }
  const id = r.headers.get("x-restli-id") || r.headers.get("X-RestLi-Id") || "";
  return { id };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const input = await req.json();
    // Credentials come from request body; LINKEDIN_CLIENT_ID/SECRET are available via
    // Deno.env.get(...) for future OAuth refresh flows.
    const out = await scheduleLinkedInPost(input);
    return new Response(JSON.stringify(out), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
