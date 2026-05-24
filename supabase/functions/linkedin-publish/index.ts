// Modular LinkedIn publisher.
// Exports `publishSsiReportToLinkedIn(accessToken, text, imageUrl?)` and serves an HTTP endpoint.
// Uses the 3-step UGC asset upload + ugcPosts publish flow.
// Reference: https://learn.microsoft.com/linkedin/marketing/integrations/community-management/shares/ugc-post-api

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LI_BASE = "https://api.linkedin.com/v2";

async function getAuthorUrn(accessToken: string): Promise<string> {
  // /v2/userinfo returns { sub: "<member id>" } for OpenID-scoped tokens.
  const r = await fetch(`https://api.linkedin.com/v2/userinfo`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!r.ok) throw new Error(`LinkedIn userinfo failed: ${r.status} ${await r.text()}`);
  const j = await r.json();
  if (!j.sub) throw new Error("LinkedIn token missing 'sub' — request 'openid profile' scopes");
  return `urn:li:person:${j.sub}`;
}

async function registerUpload(accessToken: string, authorUrn: string) {
  const r = await fetch(`${LI_BASE}/assets?action=registerUpload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      registerUploadRequest: {
        recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
        owner: authorUrn,
        serviceRelationships: [
          { relationshipType: "OWNER", identifier: "urn:li:userGeneratedContent" },
        ],
      },
    }),
  });
  if (!r.ok) throw new Error(`registerUpload failed: ${r.status} ${await r.text()}`);
  return r.json();
}

async function uploadBinary(uploadUrl: string, imageUrl: string, accessToken: string) {
  const imgResp = await fetch(imageUrl);
  if (!imgResp.ok) throw new Error(`Failed to fetch image from ${imageUrl}`);
  const blob = await imgResp.arrayBuffer();
  const put = await fetch(uploadUrl, {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: blob,
  });
  if (!put.ok) throw new Error(`Binary upload failed: ${put.status}`);
}

async function createPost(
  accessToken: string,
  authorUrn: string,
  text: string,
  mediaUrn?: string,
) {
  const body: any = {
    author: authorUrn,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text },
        shareMediaCategory: mediaUrn ? "IMAGE" : "NONE",
        ...(mediaUrn && {
          media: [{ status: "READY", media: mediaUrn, title: { text: "" }, description: { text: "" } }],
        }),
      },
    },
    visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
  };
  const r = await fetch(`${LI_BASE}/ugcPosts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`createPost failed: ${r.status} ${await r.text()}`);
  return r.headers.get("x-restli-id") || r.headers.get("X-RestLi-Id") || "";
}

/** Modular helper. Drop into any route. */
export async function publishSsiReportToLinkedIn(
  accessToken: string,
  text: string,
  imageUrl?: string,
): Promise<{ postId: string }> {
  if (!accessToken) throw new Error("accessToken required");
  if (!text || !text.trim()) throw new Error("text required");

  const authorUrn = await getAuthorUrn(accessToken);
  let mediaUrn: string | undefined;
  if (imageUrl) {
    const reg = await registerUpload(accessToken, authorUrn);
    const uploadInfo = reg?.value?.uploadMechanism?.["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"];
    const uploadUrl = uploadInfo?.uploadUrl;
    mediaUrn = reg?.value?.asset;
    if (!uploadUrl || !mediaUrn) throw new Error("registerUpload missing uploadUrl/asset");
    await uploadBinary(uploadUrl, imageUrl, accessToken);
  }
  const postId = await createPost(accessToken, authorUrn, text, mediaUrn);
  return { postId };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { accessToken, text, imageUrl } = await req.json();
    const result = await publishSsiReportToLinkedIn(accessToken, text, imageUrl);
    return new Response(JSON.stringify(result), {
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
