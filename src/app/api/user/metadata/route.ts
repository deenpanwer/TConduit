import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Fetch from a reliable provider that allows server-side requests
    const res = await fetch('https://ipapi.co/json/', {
        cache: 'no-store'
    });
    const data = await res.json();
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch metadata" }, { status: 500 });
  }
}
