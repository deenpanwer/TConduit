import { NextResponse } from 'next/server';
import { generateOrgIntelligence } from "@/lib/reports/intel-generator";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get('orgId');
  const dateStr = searchParams.get('date') || undefined;

  if (!orgId) {
    return NextResponse.json({ error: 'Missing Org ID' }, { status: 400 });
  }

  try {
    const intel = await generateOrgIntelligence(orgId, dateStr);
    return NextResponse.json({ success: true, intel });
  } catch (error: any) {
    console.error("Report Generation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}