import { mistral } from '@ai-sdk/mistral';
import { generateText } from 'ai';
import { initLogger } from 'braintrust';

export const maxDuration = 60;

const logger = initLogger({
  projectName: process.env.BRAINTRUST_PROJECT_NAME || 'tracai',
  apiKey: process.env.BRAINTRUST_API_KEY,
});

/**
 * ORG CONTEXT GENERATION API
 * -------------------------
 * This route fetches an organization's website, extracts clean text,
 * and uses Mistral to generate a deep organizational context for monitoring.
 */

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(JSON.stringify({ error: 'URL is required' }), { status: 400 });
    }

    if (!process.env.MISTRAL_API_KEY) {
      return new Response(JSON.stringify({ error: 'Mistral API Key is not set' }), { status: 500 });
    }

    // 1. Fetch Website Content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch website: ${response.statusText}`);
    }

    const html = await response.text();

    // 2. Clean HTML with Regex (Remove scripts, styles, and tags)
    const cleanText = html
      .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, '')
      .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 10000); // Limit context size for the AI

    // 3. Generate Context using Mistral
    const { text } = await generateText({
      model: mistral('mistral-small-2506'),
      messages: [
        {
          role: 'system',
          content: `You are an expert Organizational Psychologist and Business Analyst for Trac AI.
          Your goal is to analyze the provided website text and create a comprehensive "Organizational Context" document.
          This document will be used by an AI monitoring system to understand the company's mission, values, products, and culture.
          The more detailed the context, the better the AI can monitor employee productivity and alignment.`
        },
        {
          role: 'user',
          content: `Please generate a detailed Organizational Context in Markdown format based on the following website content:
          
          --- WEBSITE CONTENT ---
          ${cleanText}
          --- END CONTENT ---
          
          The output should include:
          1. Company Mission & Vision
          2. Core Products/Services (Detailed)
          3. Ideal Workflow & Professional Tone
          4. Key Values & Culture
          5. Target Audience/Customers
          
          Keep it professional, deep, and structured. Do not mention that you are an AI.`
        }
      ]
    });

    // Log to Braintrust for AI Observability
    try {
      await logger.log({
        input: { url, cleanText },
        output: text,
        metadata: {
          model: 'mistral-small-2506',
          platform: 'website',
          action: 'org_context_generation'
        }
      });
    } catch (braintrustError) {
      console.error("Error logging to Braintrust:", braintrustError);
    }

    return new Response(JSON.stringify({ context: text }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Org Context API Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
