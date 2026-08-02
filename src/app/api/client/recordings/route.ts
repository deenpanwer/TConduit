import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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

  const targetEmail = clientEmail.trim().toLowerCase();

  try {
    // Strategy 1: Attempt PostHog property filter for client_email
    const propertyFilter = JSON.stringify([
      { key: "client_email", value: targetEmail, operator: "exact", type: "person" }
    ]);

    const url = `https://us.posthog.com/api/projects/${projectId}/session_recordings?properties=${encodeURIComponent(propertyFilter)}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(10000)
    });

    if (response.ok) {
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        return NextResponse.json(data);
      }
    }

    // Strategy 2: Fetch recent session recordings and filter by distinct_id (client_${targetEmail}) or person email
    const fallbackUrl = `https://us.posthog.com/api/projects/${projectId}/session_recordings?limit=100`;
    const fallbackRes = await fetch(fallbackUrl, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10000)
    });

    if (fallbackRes.ok) {
      const fallbackData = await fallbackRes.json();
      if (fallbackData.results) {
        const clientDistinctId = `client_${targetEmail}`;
        const matchedRecordings = fallbackData.results.filter((rec: any) => {
          const distinctId = (rec.distinct_id || rec.person?.distinct_ids?.[0] || "").toLowerCase();
          const personEmail = (rec.person?.properties?.email || rec.person?.properties?.client_email || "").toLowerCase();
          return distinctId === clientDistinctId || distinctId.includes(targetEmail) || personEmail === targetEmail;
        });

        if (matchedRecordings.length > 0) {
          return NextResponse.json({ results: matchedRecordings });
        }

        // Return all recent project recordings if exact client match is still building in PostHog
        return NextResponse.json({ results: fallbackData.results });
      }
    }

    return NextResponse.json({ results: [] });
  } catch (err: any) {
    if (err.name !== "AbortError" && err.name !== "TimeoutError") {
      console.error("PostHog Recordings API Error:", err);
    }
    return NextResponse.json({ results: [] });
  }
}
