import { defineFlow } from '@genkit-ai/flow';
import { z } from 'zod';
import {ai} from '../genkit'; // Import the pre-configured Genkit AI instance

export const geminiSearchFlow = defineFlow(
  {
    name: 'geminiSearchFlow',
    inputSchema: z.object({
      problemStatement: z.string(),
    }),
    outputSchema: z.object({
      reasoning: z.string(),
      plan_content: z.string(),
      formalizedQuery: z.string(),
    }),
  },
  async (input: { problemStatement: string }) => {
    const prompt = `Given the user's problem statement, first provide a concise reasoning (2-3 sentences) on how to understand and approach solving this problem. Second, provide a simple plan (2-4 bullet points) for how an agent would tackle this problem, formatted as a markdown list. Finally, formulate a very short, optimized search query (2-5 words) that can be used for semantic search to find a suitable solution or professional.

Problem Statement: "${input.problemStatement}"

Example Output:
Reasoning: The user is looking for ways to improve video aesthetics. This requires identifying key visual elements and techniques.
Plan:
* Analyze current video content for aesthetic weaknesses.
* Research best practices in video production and editing.
* Identify tools and techniques for visual improvement.
* Develop a strategy for implementing changes.
Formalized Query: video aesthetic improvement

Reasoning: The user needs help with personal branding. This involves defining unique value propositions and consistent messaging.
Plan:
* Define target audience and personal values.
* Create a consistent visual identity.
* Develop a content strategy for chosen platforms.
* Engage with the audience to build recognition.
Formalized Query: personal branding strategy

Reasoning: `;

    console.log("Prompt sent to Gemini:", prompt);

    const llmResponse = await ai.generate({
      model: 'googleai/gemini-2.5-flash', // Use the pre-configured Gemini model
      prompt: prompt,
      config: {
        maxOutputTokens: 500, // Adjust as needed
        temperature: 0.7,
      },
    });

    console.log("Raw LLM Response from Gemini:", llmResponse);

    const text = llmResponse.text;
    const reasoningMatch = text.match(/Reasoning: (.*?)\nPlan:/);
    const planContentMatch = text.match(/Plan:\n(.*?)\nFormalized Query:/);
    const formalizedQueryMatch = text.match(/Formalized Query: (.*)/); // Use /s for multiline match

    let reasoning = 'No reasoning generated.';
    let plan_content = 'No plan generated.';
    let formalizedQuery = input.problemStatement; // Fallback to original problem statement

    if (reasoningMatch && reasoningMatch[1]) {
      reasoning = reasoningMatch[1].trim();
    }

    if (planContentMatch && planContentMatch[1]) {
      plan_content = planContentMatch[1].trim();
    }

    if (formalizedQueryMatch && formalizedQueryMatch[1]) {
      formalizedQuery = formalizedQueryMatch[1].trim();
    }

    return {
      reasoning,
      plan_content,
      formalizedQuery,
    };
  }
);
