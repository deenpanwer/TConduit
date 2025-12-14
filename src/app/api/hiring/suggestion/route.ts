// src/app/api/hiring/suggestion/route.ts

import { NextResponse } from 'next/server';
import { getInitialRoleSuggestion } from '@/lib/hiringAssistant';
import * as z from 'zod';

const InputSchema = z.object({
  userQuery: z.string(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userQuery } = InputSchema.parse(body);

    const suggestion = await getInitialRoleSuggestion(userQuery);

    return NextResponse.json(suggestion);
  } catch (error) {
    let errorMessage = 'An unknown error occurred.';
    if (error instanceof z.ZodError) {
      errorMessage = `Invalid input: ${error.message}`;
      return new NextResponse(JSON.stringify({ error: errorMessage }), { status: 400 });
    }
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    console.error('Error in suggestion API route:', error);
    return new NextResponse(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
}
