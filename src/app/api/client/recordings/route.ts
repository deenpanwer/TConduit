import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientEmail = searchParams.get("email");
  const recordingId = searchParams.get("recordingId");

  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;
  const projectId = process.env.POSTHOG_PROJECT_ID || "191081";

  if (!apiKey) {
    console.error("CRITICAL: POSTHOG_PERSONAL_API_KEY is missing in .env");
    return NextResponse.json({ error: "Server configuration error: Missing API Key" }, { status: 500 });
  }

  // --- PATH 1: Get sharing embed URL for a specific recording ID ---
  if (recordingId) {
    try {
      const shareUrl = `https://us.posthog.com/api/projects/${projectId}/session_recordings/${recordingId}/sharing?personal_api_key=${apiKey}`;
      const requestOptions = {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: true }),
        cache: 'no-store' as RequestCache
      };

      let shareRes = await fetch(shareUrl, { ...requestOptions, method: "PATCH" });
      if (!shareRes.ok) {
        shareRes = await fetch(shareUrl, { ...requestOptions, method: "POST" });
      }

      const responseText = await shareRes.text();
      if (!shareRes.ok) {
        console.error("PostHog API Error:", shareRes.status, responseText);
        return NextResponse.json({ error: "PostHog permission denied", details: responseText }, { status: shareRes.status });
      }

      const shareData = JSON.parse(responseText);
      const token = shareData.accessToken || shareData.access_token || shareData.token;

      if (token) {
        return NextResponse.json({ embedUrl: `https://us.posthog.com/embedded/${token}` });
      } else {
        return NextResponse.json({ error: "Token missing from response" }, { status: 500 });
      }
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  // --- PATH 2: List session recordings filtered by client email ---
  if (!clientEmail) {
    return NextResponse.json({ error: "Client email is required" }, { status: 400 });
  }

  try {
    const propertyFilter = JSON.stringify([
      { key: "client_email", value: clientEmail.trim().toLowerCase(), operator: "exact", type: "person" }
    ]);

    const url = `https://us.posthog.com/api/projects/${projectId}/session_recordings?properties=${encodeURIComponent(propertyFilter)}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: "PostHog API Error", status: response.status, details: errText }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
