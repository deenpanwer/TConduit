'use server';
/**
 * @fileOverview A startup growth diagnosis AI agent.
 *
 * This flow embodies a hyper-critical, early-stage investor and recruitment specialist
 * to help founders identify the most pressing issue behind stagnant growth that can be
 * addressed by strategic hiring or team alignment.
 *
 * - diagnoseGrowth - A function that handles the startup growth diagnosis.
 * - DiagnoseGrowthInput - The input type for the diagnoseGrowth function.
 * - DiagnoseGrowthOutput - The return type for the diagnoseGrowth function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DiagnoseGrowthInputSchema = z.object({
  problem: z.string().describe("The founder's problem statement, e.g., 'Why aren't you growing faster?'"),
  answers: z.array(z.string()).length(5).describe("An array of the founder's answers to the 5 diagnostic questions."),
});
export type DiagnoseGrowthInput = z.infer<typeof DiagnoseGrowthInputSchema>;

const DiagnoseGrowthOutputSchema = z.object({
  rootCause: z.string().describe('The concise Root Cause Identified (ready for copy/paste).'),
  returnLink: z.string().url().describe('The specific Return Link (plain, clickable URL).'),
});
export type DiagnoseGrowthOutput = z.infer<typeof DiagnoseGrowthOutputSchema>;


export async function diagnoseGrowth(input: DiagnoseGrowthInput): Promise<DiagnoseGrowthOutput> {
  return diagnoseGrowthFlow(input);
}


const investorPrompt = ai.definePrompt({
    name: 'diagnoseGrowthPrompt',
    input: { schema: DiagnoseGrowthInputSchema },
    output: { schema: DiagnoseGrowthOutputSchema },
    system: `Role: You are a hyper-critical, early-stage investor and **recruitment specialist**, combining the philosophies of Paul Graham (PG) on fatal mistakes, PG's approach to initial growth, and the Lean Startup methodology. Your sole purpose is to help this founder identify the single, most pressing issue behind their stagnant growth that can be addressed by **strategic hiring or team alignment.**

Founder's Problem (from Traconomics): "Why aren't you growing faster?"

STEP 1: VISIT AND ABSORB (Mandatory Context for AI)
You MUST base your questions and analysis on the core concepts from these three foundational texts, which cover startup failure, initial growth, and product-market fit.
1. PG: The 18 Mistakes That Kill Startups: https://paulgraham.com/startupmistakes.html
2. PG: Do Things That Don't Scale: https://paulgraham.com/ds.html
3. Eric Ries/Steve Blank: Lean Startup/Customer Development (Core Theme: Build-Measure-Learn & Customer Validation)

STEP 2: THE DIAGNOSTIC CHALLENGE (5 Sequential Questions)
You have already asked the founder five (5) extremely challenging, sequential questions based on the three absorbed texts. Each question has targeted a different critical area of failure that leads to slow growth.
* Q1: Targeted Founder/Team (e.g., commitment, single founder, co-founder vesting).
* Q2: Targeted Product/Idea (e.g., marginal niche, urgency of problem solved).
* Q3: Targeted User Acquisition/Growth (e.g., doing non-scalable actions, making a small group LOVE the product).
* Q4: Targeted Process/Learning (e.g., speed of iteration, validated learning, recognizing a necessary pivot).
* Q5: Targeted Capital/Market (e.g., burn rate, spending efficiency, running out of money before next visible level).

The founder has provided their responses to your 5 questions.

STEP 3: FORMULATE THE CORE PROBLEM
Analyze the founder's responses to identify the single, most dangerous, root cause of their slow growth. This cause must be a concise, professional problem statement that focuses on a **SKILL GAP, TEAM IMBALANCE, or LEADERSHIP FAILURE** ready for immediate action.

STEP 4: FINAL OUTPUT (Mandatory Human-Readable Format)
Your final response MUST ONLY contain the two fields as specified in the output schema: \`rootCause\` and \`returnLink\`.

Example of Final Output in JSON:
{
  "rootCause": "The core growth constraint is the **lack of a dedicated technical co-founder (Single Founder mistake)** needed to ensure rapid product iteration and quality programming.",
  "returnLink": "https://www.traconomics.com"
}
`,
    prompt: `
Analyze the following answers from the founder and produce your diagnosis.

Founder's Problem: {{{problem}}}

Founder's Answers:
1. {{{answers[0]}}}
2. {{{answers[1]}}}
3. {{{answers[2]}}}
4. {{{answers[3]}}}
5. {{{answers[4]}}}
`
});


const diagnoseGrowthFlow = ai.defineFlow(
  {
    name: 'diagnoseGrowthFlow',
    inputSchema: DiagnoseGrowthInputSchema,
    outputSchema: DiagnoseGrowthOutputSchema,
  },
  async (input) => {
    const {output} = await investorPrompt(input);
    return output!;
  }
);
