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
});

export type PlanData = z.infer<typeof GeneratePlanOutputSchema>;

export async function generatePlan(userQuery: string): Promise<PlanData> {
  // IMPORTANT: Replace 'YOUR_GEMINI_API_KEY' with your actual Gemini API Key
  // You should store this securely, e.g., in an environment variable (process.env.GEMINI_API_KEY) 
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set. Please set it in your environment variables.');
  }

  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`; 

  const prompt = `You are an AI assistant specialized in generating freelancer acquisition plans. Based on the user's query, your task is to identify the type of freelancer they need and provide an action plan for leveraging digital search and scraping to find, vet, and qualify that freelancer.

    Your response should be structured in JSON with four main fields: 'title', 'description', 'keySteps' (an array of strings), and 'rawReasoning'.
    
    For 'rawReasoning': Provide a brief, 2-3 sentence reasoning process. Each sentence should represent a line of thought and be separated by a newline character '\\n\\n'. Focus on how you interpreted the user's request to identify the freelancer's role and the strategy of using digital search/scraping to find them.
    
    For 'title': Provide a very concise title for the freelancer acquisition plan.
    
    For 'description': Provide a brief, 1-2 sentence summary of the plan for finding and vetting freelancers.
    
    For 'keySteps': Provide 5-7 actionable steps for identifying, searching for, and evaluating the desired freelancer.

    User Query: ${userQuery}

    Example JSON Response:
    {
      "rawReasoning": "The user is looking to hire a 'video editor'.\\n\\nI will identify key criteria and leverage digital search to discover suitable freelancers.\\n\\nThe plan focuses on effective search and qualification of candidates.",
      "title": "Find & Qualify a Video Editor",
      "description": "A focused plan to define search parameters, conduct digital discovery, and vet top video editing freelancers.",
      "keySteps": [
        "Interpret user query to define specific freelancer skills and experience.",
        "Establish detailed search criteria for web scraping and digital platforms.",
        "Execute targeted digital searches on freelance platforms and professional networks.",
        "Collect and analyze potential freelancer profiles based on defined criteria.",
        "Review portfolios and verify past project experience of shortlisted candidates.",
        "Prepare a summary of top qualified freelancers for user review."
      ]
    }`;

  const requestBody = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    generationConfig: {
      responseMimeType: "application/json", // Request JSON format
    },
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', errorData);
      throw new Error(`Gemini API request failed: ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const responseData = await response.json();
    
    // The response structure might vary slightly, so we need to parse it carefully.
    // Assuming the JSON is directly in text field of the first part.
    const jsonString = responseData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!jsonString) {
      throw new Error('Could not find JSON content in Gemini API response.');
    }

    const parsedData = JSON.parse(jsonString);

    // Validate the parsed data against the schema
    const result = GeneratePlanOutputSchema.parse(parsedData);
    
    return result;

  } catch (error) {
    console.error('Error generating plan:', error);
    throw error;
  }
}
