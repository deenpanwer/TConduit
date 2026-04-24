import { mistral } from '@ai-sdk/mistral';
import { generateText } from 'ai';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { text, context, mode } = await req.json();

    if (!process.env.MISTRAL_API_KEY) {
      return new Response(JSON.stringify({ error: 'Mistral API Key is not set' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const systemPrompt = `
      CONTEXT: You are the AI Engine for "Trac AI", a category-defining talent platform.
      OBJECTIVE: Convert unstructured user input (voice transcripts or bulk text) into a structured, production-grade Task object.
      
      TASK SCHEMA:
      {
        "title": "Stark, high-impact title (max 60 chars)",
        "description": "Professional, detailed description following the 'Modern Founder' aesthetic - minimalist but high density.",
        "subtasks": [{"id": "uuid", "title": "Atomic action item", "description": "Single-line high-density context", "completed": false}],
        "priority": "low" | "medium" | "high" | "critical",
        "tags": ["relevant", "contextual", "tags"],
        "leaderPoints": 10-100,
        "deadlineHours": 1-168
      }

      CRITICAL RULES:
      1. IGNORE numerical scores.
      2. If the user input is vague, use the provided CONTEXT to infer missing details.
      3. Output ONLY valid JSON. No markdown formatting.
      4. Ensure subtasks are actionable and atomic.
      5. Every subtask MUST have a single-line high-density note in its "description" field. The number of subtasks should be NATURALLY DYNAMIC—if a task is simple, return 1-2 subtasks; if it's complex, return 5-8. Never force a fixed count.
      6. Assign leaderPoints based on complexity (simple=10, hard=50, massive=100).
      7. Assign deadlineHours based on estimated effort (1, 2, 4, 8, 24, 48, etc).
    `;

    let userPrompt = "";

    if (mode === 'enhance') {
      userPrompt = `
        ENHANCE MODE:
        User provided: "${text}"
        Current Context: ${JSON.stringify(context || {})}
        
        Refine the title, expand the description into a professional brief, and generate a dynamic set of atomic subtasks (as many or as few as logically needed for 100% completion), each with a high-density contextual note.
      `;
    } else if (mode === 'bulk') {
      userPrompt = `
        BULK PARSING MODE:
        Extract the following unstructured dump into a structured task:
        "${text}"
      `;
    } else if (mode === 'suggest_subtask') {
      userPrompt = `
        SUGGEST SUBTASK MODE:
        Task Title: "${context?.title}"
        Task Description: "${context?.description}"
        Existing Subtasks: ${JSON.stringify(context?.subtasks || [])}

        Based on the above, suggest ONE additional high-impact, atomic subtask that would be logical to include.
        Return ONLY the JSON for the subtask: {"title": "...", "description": "..."}
      `;
    }

    const { text: responseText } = await generateText({
      model: mistral('ministral-3b-2512'),
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
    });

    // Extract JSON (handling potential markdown code blocks)
    const jsonString = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const result = JSON.parse(jsonString);

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Enhance API Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process task magic', details: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}