
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GeminiSearchOutputSchema = z.object({
  reasoning: z.string().describe('A concise reasoning (2-3 sentences) on how to understand and approach solving the user\'s problem.'),
  plan: z.array(z.string()).describe('A simple plan with 2-4 steps for how an agent would tackle this problem.'),
  formalizedQuery: z.string().describe('A very short, optimized search query (2-5 words) for semantic search.'),
});

export const geminiSearchFlow = ai.defineFlow(
  {
    name: 'geminiSearchFlow',
    inputSchema: z.object({
      problemStatement: z.string(),
    }),
    outputSchema: GeminiSearchOutputSchema,
  },
  async (input) => {
    const prompt = await ai.definePrompt(
        {
            name: "geminiSearchPrompt",
            input: {
                schema: z.object({
                    problemStatement: z.string(),
                }),
            },
            output: {
                schema: GeminiSearchOutputSchema,
            },
            prompt: `Given the user's problem statement, first provide a concise reasoning (2-3 sentences) on how to understand and approach solving this problem. Second, provide a simple plan (2-4 bullet points) for how an agent would tackle this problem. Finally, formulate a very short, optimized search query (2-5 words) that can be used for semantic search to find a suitable solution or professional.

Problem Statement: "${input.problemStatement}"`,
        }
    )

    const llmResponse = await prompt(input);
    const output = llmResponse.output();

    if (!output) {
      throw new Error("Failed to get structured output from the model.");
    }
    
    // The output is already a structured JSON object, so we can directly return it.
    // The plan is already an array of strings from the Zod schema.
    return {
        reasoning: output.reasoning,
        plan_content: output.plan, // Pass the array directly
        formalizedQuery: output.formalizedQuery
    };
  }
);
