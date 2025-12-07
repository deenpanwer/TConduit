// src/app/api/generate-plan/route.ts

import { generatePlan, GeneratePlanInputSchema } from '@/lib/generatePlan';
import { NextResponse } from 'next/server';
import * as z from 'zod';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userQuery } = GeneratePlanInputSchema.parse(body);

    const planData = await generatePlan(userQuery);

    return NextResponse.json(planData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request body', details: error.errors }, { status: 400 });
    }
    console.error('Error in /api/generate-plan:', error);
    return NextResponse.json({ error: 'Failed to generate plan', details: (error as Error).message }, { status: 500 });
  }
}
