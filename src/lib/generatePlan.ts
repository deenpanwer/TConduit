// src/lib/generatePlan.ts

import * as z from 'zod';

// Define the input schema for the plan generation function
export const GeneratePlanInputSchema = z.object({
  userQuery: z.string().describe('The user\'s request for a plan.'),
});

// Define the output schema for the plan generation function
export const GeneratePlanOutputSchema = z.object({
  title: z.string().describe('A concise title for the generated plan.'),
  description: z.string().describe('A brief description of the plan.'),
  keySteps: z.array(z.string()).describe('An array of actionable steps in the plan.'),
  rawReasoning: z.string().describe('The AI\'s detailed reasoning process.'),
  final_query: z.string().describe('A concise keyword or phrase for semantic search based on the user query.'),
});

export type PlanData = z.infer<typeof GeneratePlanOutputSchema>;

async function callGeminiWithFallback(prompt: string): Promise<string> {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
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
      console.warn(`[AI] ${model} failed in generatePlan: ${e.message}`);
    }
  }

  throw new Error(`All models failed in generatePlan. ${lastError?.message}`);
}

export async function generatePlan(userQuery: string): Promise<PlanData> {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set.');
  }

  const prompt = `You are a hiring agent AI. Your goal is to understand a user's hiring need and formulate a profile of the ideal candidate. This profile will be used to find the best talent. The user can then review and edit this profile.

    Based on the user's query, generate a JSON response with five fields: 'title', 'description', 'keySteps', 'rawReasoning', and 'final_query'.
    
    The tone of your response should be consultative and suggestive, as if you are proposing a candidate profile. Frame it as "Based on what you've said, here's the type of person I think we should look for."
    
    For 'rawReasoning': In 2-3 short sentences separated by '\\n\\n', explain your thought process. How did you interpret the user's informal request and translate it into a professional job profile? 
    
    For 'title': Create a clear and professional job title for the ideal candidate. For example, "Senior Product Designer" or "Growth-Oriented Marketing Lead".
    
    For 'description': Write a 1-2 sentence summary of this ideal candidate. What are their core responsibilities and qualifications? This should read like a summary of a job description.
    
    For 'keySteps': Reframe this as "Key Qualifications". List 1-2 essential skills, experiences, or qualifications we should look for in this candidate. These should be specific and verifiable (e.g., "Proven experience with React and TypeScript," not "Good at coding") and super short.

    For 'final_query': Provide a concise 2-4 word keyword phrase representing the core of the candidate profile. This will be used for a semantic search. For example, if the user wants someone to "make my website look better," a good final_query would be "UI/UX web designer".

    User Query: ${userQuery}

    Example JSON Response:
    {
      "rawReasoning": "The user's request for 'reels that look like competitors' suggests a need for high-quality video production.\\n\\nThis implies a need for a professional with strong editing skills and an eye for modern social media trends.\\n\\nI've formulated a profile for a 'Professional Video Editor' to target this specific skillset.",
      "title": "Ideal Hire: Professional Video Editor",
      "description": "A creative professional specializing in short-form video content for social media, with a proven ability to create engaging and polished reels that drive engagement.",
      "keySteps": [
        "Demonstrated expertise in Adobe Premiere Pro and After Effects.",
        "A portfolio of recent work on Instagram Reels or TikTok.",
        "If you feel this is right, click 'Start Hiring' to proceed or use the edit icon to refine the plan."
      ],
      "final_query": "professional video editor for social media"
    }`;

  try {
    const jsonString = await callGeminiWithFallback(prompt);
    const parsedData = JSON.parse(jsonString);
    const result = GeneratePlanOutputSchema.parse(parsedData);
    return result;
  } catch (error) {
    console.error('Error generating plan:', error);
    throw error;
  }
}