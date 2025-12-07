'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';

// --- Gemini API Key Initialization ---
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('GEMINI_API_KEY is not set. Please set this environment variable.');
}
const genAI = new GoogleGenerativeAI(apiKey);

/**
 * Generates a text embedding for the given input string using Google's text-embedding-004 model.
 * This embedding can then be used for semantic search or other NLP tasks.
 * @param text The input string to embed.
 * @returns A Promise that resolves to an array of numbers representing the embedding, or null if an error occurs.
 */
export async function embedText(text: string): Promise<number[] | null> {
  try {
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004'});
    const result = await model.embedContent(text);

    return result.embedding.values;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return null;
  }
}
