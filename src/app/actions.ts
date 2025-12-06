
'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { runFlow } from '@genkit-ai/flow';
import { geminiSearchFlow } from '@/ai/flows/gemini-search-flow';

// Initialize Google Generative AI
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set in environment variables.");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

export async function embedText(text: string): Promise<number[] | null> {
  try {
    const result = await embeddingModel.embedContent(text);
    const embedding = result.embedding.values;
    return embedding;
  } catch (error) {
    console.error("Error generating embedding with Google Gemini:", error);
    return null;
  }
}

export async function processQueryWithGemini(problemStatement: string) {
  try {
    // Use runFlow to execute the Genkit flow
    const result = await runFlow(geminiSearchFlow, { problemStatement });
    return result;
  } catch (error) {
    console.error("Error processing query with Gemini flow:", error);
    throw error;
  }
}
