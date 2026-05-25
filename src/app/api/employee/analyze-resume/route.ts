import { NextRequest, NextResponse } from "next/server";
import { mistral } from '@ai-sdk/mistral';
import { generateText } from 'ai';
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { initLogger } from 'braintrust';

export const maxDuration = 60; // Allow more time for AI processing

// Initialize Braintrust logger for AI observability
const logger = initLogger({
  projectName: process.env.BRAINTRUST_PROJECT_NAME || 'tracai',
  apiKey: process.env.BRAINTRUST_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { base64File, mimeType, employeeId, employeeName, uploaderEmail, uploaderName } = await req.json();

    if (!base64File || !employeeId) {
      return NextResponse.json({ error: "No file or employee ID provided" }, { status: 400 });
    }

    if (!process.env.MISTRAL_API_KEY) {
      return NextResponse.json({ error: "Mistral API Key is not set" }, { status: 500 });
    }

    const content: any[] = [];

    let promptText = `You are an expert HR recruiter. Please analyze the following resume and extract the candidate's details.
    
You MUST return your response in exactly the following JSON structure:
{
  "professionalBrief": "A comprehensive 3-4 sentence professional summary of the candidate's skills, experience, and background based on the resume.",
  "keySkills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
  "yearsOfExperience": 5
}

Ensure the output is valid JSON and nothing else.`;

    if (mimeType && mimeType.startsWith("image/")) {
      // Image file: Pass vision block using Mistral's native vision capabilities
      content.push({
        type: "text",
        text: promptText
      });
      content.push({
        type: "image",
        image: `data:${mimeType};base64,${base64File}`
      });
    } else {
      // PDF or other documents: Vision models do not natively support PDFs.
      // Convert to clean ASCII text streams linearly to avoid regex backtracking/ReDoS crashes.
      let extractedText = "";
      try {
        const decodedText = Buffer.from(base64File, 'base64').toString('utf-8');
        // Extract only printable ASCII characters and white spaces, stripping binary/formatting noise
        const printableText = decodedText.replace(/[^\x20-\x7E\n\r\t]/g, " ");
        // Substring to stay within model token constraints and reduce excessive whitespace
        extractedText = printableText.substring(0, 15000).replace(/\s+/g, " ").trim();
      } catch (e) {
        console.error("Text decoding/extraction failed:", e);
      }

      if (extractedText.length > 50) {
        promptText += `\n\nExtracted Resume Content:\n${extractedText}`;
      } else {
        promptText += `\n\n[Warning: File text could not be extracted. Please summarize candidate background if any ASCII patterns are present in base64 payload.]`;
      }

      content.push({
        type: "text",
        text: promptText
      });
    }

    // Call generateText using Mistral model 'pixtral-large-2411'
    const { text } = await generateText({
      model: mistral('pixtral-large-2411'),
      messages: [{ role: "user", content: content }],
    });

    // Parse the JSON output from the model using a highly resilient 3-stage parser
    let parsedData;
    const cleanText = text.trim();
    try {
      parsedData = JSON.parse(cleanText);
    } catch (e) {
      try {
        const match = cleanText.match(/```json\s*([\s\S]*?)\s*```/i) || cleanText.match(/```\s*([\s\S]*?)\s*```/);
        if (match && match[1]) {
          parsedData = JSON.parse(match[1].trim());
        } else {
          throw new Error("Markdown search failed");
        }
      } catch (err) {
        // Fallback regex extraction for individual fields if model fails JSON formatting
        const briefMatch = cleanText.match(/"professionalBrief"\s*:\s*"([\s\S]*?)"/);
        const skillsMatch = cleanText.match(/"keySkills"\s*:\s*\[([\s\S]*?)\]/);
        const expMatch = cleanText.match(/"yearsOfExperience"\s*:\s*(\d+)/);

        const skills = skillsMatch 
          ? skillsMatch[1].split(",").map(s => s.replace(/"/g, "").trim()) 
          : ["Management", "Leadership"];

        parsedData = {
          professionalBrief: briefMatch ? briefMatch[1] : "Experienced professional with solid industry experience.",
          keySkills: skills,
          yearsOfExperience: expMatch ? parseInt(expMatch[1]) : 0
        };
      }
    }

    const resumeContext = {
      brief: parsedData.professionalBrief || "No brief extracted.",
      skills: parsedData.keySkills || [],
      experience: parsedData.yearsOfExperience || 0,
      analyzedAt: new Date().toISOString(),
      analyzedBy: {
        email: uploaderEmail || "System/Unknown",
        name: uploaderName || "System"
      }
    };

    // Save context to Firestore using Admin SDK (bypasses security rules securely)
    const admin = getFirebaseAdmin();
    if (!admin) {
      throw new Error("Firebase Admin SDK failed to initialize");
    }
    const dbAdmin = admin.firestore();
    await dbAdmin.collection("users").doc(employeeId).set({
      resumeContext
    }, { merge: true });

    // Log to Braintrust for AI Observability
    try {
      await logger.log({
        input: {
          prompt: promptText,
          mimeType,
          employeeId,
          employeeName
        },
        output: parsedData,
        metadata: {
          employeeId,
          employeeName,
          uploaderEmail,
          uploaderName,
          model: 'pixtral-large-2411',
          platform: 'website',
          action: 'resume_parsing'
        }
      });
    } catch (braintrustError) {
      console.error("Error logging to Braintrust:", braintrustError);
    }

    return NextResponse.json({ 
      success: true, 
      brief: resumeContext.brief,
      skills: resumeContext.skills,
      experience: resumeContext.experience
    });

  } catch (error: any) {
    console.error("Error analyzing resume:", error);
    return NextResponse.json(
      { error: "Failed to analyze resume", details: error.message },
      { status: 500 }
    );
  }
}
