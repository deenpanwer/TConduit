// src/app/api/hiring/question/route.ts

import { NextResponse } from 'next/server';
import { getClarifyingQuestion } from '@/lib/hiringAssistant';
import * as z from 'zod';

const InputSchema = z.object({
  userQuery: z.string(),
  rejectedTitle: z.string(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userQuery, rejectedTitle } = InputSchema.parse(body);

    const question = await getClarifyingQuestion(userQuery, rejectedTitle);

    return NextResponse.json(question);
  } catch (error) {
    let errorMessage = 'An unknown error occurred.';
    if (error instanceof z.ZodError) {
      errorMessage = `Invalid input: ${error.message}`;
      return new NextResponse(JSON.stringify({ error: errorMessage }), { status: 400 });
    }
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    console.error('Error in question API route:', error);
    return new NextResponse(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
}
