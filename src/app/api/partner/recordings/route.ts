import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const partnerSlug = searchParams.get("slug");
  const recordingId = searchParams.get("recordingId");

  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;
  // Fallback to your actual Project ID if missing in .env for testing
  const projectId = process.env.POSTHOG_PROJECT_ID || "191081"; 

  if (!apiKey) {
    console.error("CRITICAL: POSTHOG_PERSONAL_API_KEY is missing in .env");
    return NextResponse.json({ error: "Server configuration error: Missing API Key" }, { status: 500 });
  }
  
  if (!projectId) {
    console.error("CRITICAL: POSTHOG_PROJECT_ID is missing in .env and no fallback provided");
    return NextResponse.json({ error: "Server configuration error: Missing Project ID" }, { status: 500 });
  }

  // --- PATH 1: Get share link for a specific recording ---
  if (recordingId) {
    try {
      const shareUrl = `https://us.posthog.com/api/projects/${projectId}/session_recordings/${recordingId}/sharing?personal_api_key=${apiKey}`;
      
      const requestOptions = {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: true }),
        cache: 'no-store' as RequestCache
      };

      console.log("Attempting to enable sharing for:", recordingId);

      // Attempt 1: PATCH (Official modern standard)
      let shareRes = await fetch(shareUrl, { ...requestOptions, method: "PATCH" });

      // Attempt 2: POST fallback (Common for many environments)
      if (!shareRes.ok) {
        console.log("PATCH failed, trying POST fallback...");
        shareRes = await fetch(shareUrl, { ...requestOptions, method: "POST" });
      }

      const responseText = await shareRes.text();
      
      if (!shareRes.ok) {
        console.error("PostHog API Rejection:", shareRes.status, responseText);
        return NextResponse.json({ 
          error: "PostHog permission denied", 
          details: responseText,
          status: shareRes.status 
        }, { status: shareRes.status });
      }

      const shareData = JSON.parse(responseText);
      
      // Handle all possible token field names
      const token = shareData.accessToken || shareData.access_token || shareData.token;

      if (token) {
        return NextResponse.json({ 
          embedUrl: `https://us.posthog.com/embedded/${token}` 
        });
      } else {
        console.error("No token in PostHog response:", shareData);
        return NextResponse.json({ error: "Token missing from response", raw: shareData }, { status: 500 });
      }
    } catch (err: any) {
      console.error("Internal API error:", err);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  // --- PATH 2: List recordings for a partner ---
  if (!partnerSlug) {
    return NextResponse.json({ error: "Partner slug is required" }, { status: 400 });
  }

  try {
    // PostHog standard for recordings is the 'properties' parameter
    const propertyFilter = JSON.stringify([
      { key: "partner_slug", value: partnerSlug, operator: "exact", type: "person" }
    ]);
    
    const url = `https://us.posthog.com/api/projects/${projectId}/session_recordings?properties=${encodeURIComponent(propertyFilter)}`;
    
    console.log("PostHog Request (Filtered):", url);

    let response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ 
        error: "PostHog API Error", 
        status: response.status,
        details: errText 
      }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("API Route Crash:", error);
    return NextResponse.json({ error: "Internal Server Error", message: error.message }, { status: 500 });
  }
}

  

  