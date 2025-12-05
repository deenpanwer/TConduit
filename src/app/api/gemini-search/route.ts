import { NextRequest, NextResponse } from 'next/server';
import { runFlow } from '@genkit-ai/flow';
import { geminiSearchFlow } from '@/ai/flows/gemini-search-flow'; // Import your flow

export async function POST(req: NextRequest) {
  try {
    const { problemStatement } = await req.json();

    if (!problemStatement) {
      return NextResponse.json({ error: 'Problem statement is required' }, { status: 400 });
    }

    // Run the Genkit flow
    const result = await runFlow(geminiSearchFlow, { problemStatement });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Error running Gemini search flow:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
