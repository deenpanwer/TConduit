// src/lib/hiringAssistant.ts

import * as z from 'zod';

// Schema for the initial role suggestion
export const InitialRoleSuggestionSchema = z.object({
  title: z.string().describe('The AI-generated job title.'),
  final_query: z.string().describe('A concise keyword or phrase for semantic search.'),
});

// Schema for the clarifying question
export const ClarifyingQuestionSchema = z.object({
  question: z.string().describe('A single, concise question to clarify the user\'s needs.'),
});

// Schema for the refined role
export const RefinedRoleSchema = z.object({
  title: z.string().describe('The updated, more accurate job title.'),
  final_query: z.string().describe('The updated, more accurate final query for semantic search.'),
});

// Schema for candidate analysis
export const HiringAssistantOutputSchema = z.object({
  analysis: z.string().describe('Detailed analysis of the candidate.'),
  score: z.number().min(0).max(100).describe('Overall score for the candidate.'),
  verdict: z.string().describe('Final hiring recommendation.'),
});

export type InitialRoleSuggestion = z.infer<typeof InitialRoleSuggestionSchema>;
export type ClarifyingQuestion = z.infer<typeof ClarifyingQuestionSchema>;
export type RefinedRole = z.infer<typeof RefinedRoleSchema>;
export type HiringAssistantData = z.infer<typeof HiringAssistantOutputSchema>;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function callGeminiWithFallback(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set. Please set it in your environment variables.');
  }

  const models = ["gemini-2.5-flash-lite", "gemini-2.5-flash"];
  let lastError = null;

  for (const model of models) {
    try {
      const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Empty response");
      
      return text;
    } catch (e: any) {
      lastError = e;
      console.warn(`[AI] ${model} failed in hiringAssistant: ${e.message}`);
    }
  }

  throw new Error(`All Gemini models failed in hiringAssistant. Last error: ${lastError?.message}`);
}

async function callGeminiStructured<T>(prompt: string, schema: z.ZodSchema<T>): Promise<T> {
  const jsonString = await callGeminiWithFallback(prompt);
  try {
    const parsedData = JSON.parse(jsonString);
    return schema.parse(parsedData);
  } catch (e) {
    // Fallback: simple cleaning if JSON block is wrapped in markdown
    const cleaned = jsonString.replace(/```json|```/g, "").trim();
    return schema.parse(JSON.parse(cleaned));
  }
}

export async function getInitialRoleSuggestion(userQuery: string): Promise<InitialRoleSuggestion> {
  const prompt = `
    You are a hiring assistant AI. A user has given you a query about a role they want to fill.
    Your task is to suggest a professional job title for this role and a short, semantic search query.
    Respond with a JSON object containing "title" and "final_query".
    The title should be a standard, recognizable job title.
    The final_query should be 2-4 words that capture the essence of the role for a database search.

    User Query: "${userQuery}"

    Example Response for "I need someone to make cool videos for my tiktok":
    {
      "title": "Social Media Video Editor",
      "final_query": "social media video editor"
    }
  `;
  return callGeminiStructured(prompt, InitialRoleSuggestionSchema);
}

export async function getClarifyingQuestion(userQuery: string, rejectedTitle: string): Promise<ClarifyingQuestion> {
  const prompt = `
    You are a hiring assistant AI. A user told you what they were looking for, and you suggested a job title, but you were wrong.
    Original user query: "${userQuery}"
    Your incorrect suggestion: "${rejectedTitle}"

    Your task is to ask ONE clarifying question to better understand what the user is looking for.
    The question should be simple and open-ended.
    Respond with a JSON object containing a single key "question".

    Example for rejected title "Social Media Manager":
    {
      "question": "Could you tell me more about the key responsibilities of this role?"
    }
  `;
  return callGeminiStructured(prompt, ClarifyingQuestionSchema);
}

export async function getRefinedRole(userQuery: string, rejectedTitle: string, userAnswer: string): Promise<RefinedRole> {
  const prompt = `
    You are a hiring assistant AI. You are in a conversation to refine a job role.
    1. The user's original request was: "${userQuery}"
    2. You suggested: "${rejectedTitle}", which was incorrect.
    3. You asked a clarifying question, and the user replied: "${userAnswer}"

    Your task is to generate a new, more accurate job title and a corresponding semantic search query based on this new information.
    Respond with a JSON object containing "title" and "final_query".

    Example conversation:
    - userQuery: "I want to hire someone to manage our online presence."
    - rejectedTitle: "Social Media Manager"
    - userAnswer: "No, I need someone more focused on writing blog posts and newsletters, not just social media."

    Example Response:
    {
      "title": "Content Marketing Manager",
      "final_query": "content marketing manager"
    }
  `;
  return callGeminiStructured(prompt, RefinedRoleSchema);
}

export async function analyzeCandidate(candidateData: any): Promise<HiringAssistantData> {
  const prompt = `Analyze this technical candidate profile and provide a detailed analysis, score, and verdict.
    Candidate JSON: ${JSON.stringify(candidateData)}
    
    Return a JSON response with 'analysis', 'score', and 'verdict' fields.`;

  return callGeminiStructured(prompt, HiringAssistantOutputSchema);
}
