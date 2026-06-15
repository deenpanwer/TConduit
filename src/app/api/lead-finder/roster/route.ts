import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("orgId");
    if (!orgId) {
      return NextResponse.json({ error: "Missing orgId" }, { status: 400, headers: corsHeaders });
    }

    const admin = getFirebaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Firebase Admin not initialized" }, { status: 500, headers: corsHeaders });
    }

    const bucket = admin.storage().bucket();
    const file = bucket.file(`organizations/${orgId}/lead-finder/roster.json`);

    const [exists] = await file.exists();
    if (!exists) {
      return NextResponse.json([], { headers: corsHeaders });
    }

    const [content] = await file.download();
    const data = JSON.parse(content.toString("utf-8"));
    return NextResponse.json(data, { headers: corsHeaders });
  } catch (error: any) {
    console.error("[Roster API GET Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(req: Request) {
  try {
    const { orgId, leads } = await req.json();
    if (!orgId) {
      return NextResponse.json({ error: "Missing orgId" }, { status: 400, headers: corsHeaders });
    }

    const admin = getFirebaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Firebase Admin not initialized" }, { status: 500, headers: corsHeaders });
    }

    const bucket = admin.storage().bucket();
    const file = bucket.file(`organizations/${orgId}/lead-finder/roster.json`);

    await file.save(JSON.stringify(leads), {
      metadata: {
        contentType: "application/json",
      },
    });

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error: any) {
    console.error("[Roster API POST Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
