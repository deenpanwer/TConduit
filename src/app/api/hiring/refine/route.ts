// src/app/api/hiring/refine/route.ts

import { NextResponse } from 'next/server';
import { getRefinedRole } from '@/lib/hiringAssistant';
import * as z from 'zod';

const InputSchema = z.object({
  userQuery: z.string(),
  rejectedTitle: z.string(),
  userAnswer: z.string(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userQuery, rejectedTitle, userAnswer } = InputSchema.parse(body);

    const refinedRole = await getRefinedRole(userQuery, rejectedTitle, userAnswer);

    return NextResponse.json(refinedRole);
  } catch (error) {
    let errorMessage = 'An unknown error occurred.';
    if (error instanceof z.ZodError) {
      errorMessage = `Invalid input: ${error.message}`;
      return new NextResponse(JSON.stringify({ error: errorMessage }), { status: 400 });
    }
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    console.error('Error in refine API route:', error);
    return new NextResponse(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
}
