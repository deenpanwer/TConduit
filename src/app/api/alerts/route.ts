import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { query, email, searchId, count } = await req.json();

    if (count > 0) {
      return NextResponse.json({ success: true, message: "Skipping alert, results found" });
    }

    // Hardcoded keys for testing/immediate use
    const userKey = "u21f2x6cp9uomnjpvg6zf8t6iv26ku";
    const apiToken = "ao4g8q7qfyhu3n1xzur1nxp378ztas";

    const title = "New User Query Alert";
    const message = `Query: "${query}"\nUser: ${email}\nSearch ID: ${searchId}`;

    // Pushover API requires application/x-www-form-urlencoded
    const params = new URLSearchParams();
    params.append('token', apiToken);
    params.append('user', userKey);
    params.append('title', title);
    params.append('message', message);

    console.log("Sending Pushover Alert for new user query...");

    const response = await fetch('https://api.pushover.net/1/messages.json', {
      method: 'POST',
      body: params,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Pushover API Error Response:", errorText);
      throw new Error(`Pushover API responded with ${response.status}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Alert API Error:", error);
    return NextResponse.json({ error: 'Failed to send alert' }, { status: 500 });
  }
}
