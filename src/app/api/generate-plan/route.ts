// src/app/api/generate-plan/route.ts

import { generatePlan, GeneratePlanInputSchema } from '@/lib/generatePlan';
import { NextResponse } from 'next/server';
import * as z from 'zod';
import { initLogger } from 'braintrust';

const logger = initLogger({
  projectName: process.env.BRAINTRUST_PROJECT_NAME || 'tracai',
  apiKey: process.env.BRAINTRUST_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userQuery } = GeneratePlanInputSchema.parse(body);

    const planData = await generatePlan(userQuery);

    // Log to Braintrust for AI Observability
    try {
      await logger.log({
        input: { userQuery },
        output: planData,
        metadata: {
          model: 'ministral-3b-2512',
          platform: 'website',
          action: 'generate_plan'
        }
      });
    } catch (braintrustError) {
      console.error("Error logging to Braintrust:", braintrustError);
    }

    return NextResponse.json(planData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request body', details: error.errors }, { status: 400 });
    }
    console.error('Error in /api/generate-plan:', error);
    return NextResponse.json({ error: 'Failed to generate plan', details: (error as Error).message }, { status: 500 });
  }
}
