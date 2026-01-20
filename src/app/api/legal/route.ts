import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const doc = searchParams.get("doc");

  if (!doc) {
    return new NextResponse("Missing doc parameter", { status: 400 });
  }

  // Security: Prevent directory traversal
  const safeDoc = doc.replace(/[^a-zA-Z0-9_-]/g, "");
  
  // Define possible paths
  const legalPath = path.join(process.cwd(), "src", "lib", "legal", `${safeDoc}.md`);
  const onboardingPath = path.join(process.cwd(), "src", "lib", "onboarding", `${safeDoc}.md`);
  
  // Helper to handle hyphen/underscore mismatch
  const findFile = (basePath: string, filename: string) => {
      if (fs.existsSync(basePath)) return basePath;
      
      const altName = filename.includes('-') ? filename.replace(/-/g, '_') : filename.replace(/_/g, '-');
      const altPath = path.join(path.dirname(basePath), `${altName}.md`);
      
      if (fs.existsSync(altPath)) return altPath;
      return null;
  };

  const foundPath = findFile(legalPath, safeDoc) || findFile(onboardingPath, safeDoc);

  // Try PDF if markdown not found
  let isPdf = false;
  let finalPath = foundPath;
  
  if (!finalPath) {
      const pdfPath = path.join(process.cwd(), "src", "lib", "onboarding", `${safeDoc}.pdf`);
      if (fs.existsSync(pdfPath)) {
          finalPath = pdfPath;
          isPdf = true;
      }
  }

  try {
    if (finalPath) {
      const fileBuffer = fs.readFileSync(finalPath);
      const contentType = isPdf ? "application/pdf" : "text/markdown";
      
      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": contentType,
        },
      });
    } else {
        // Fallback for demo placeholders if file doesn't exist
        return new NextResponse(`# ${safeDoc}\n\nContent not found.`, { status: 404 });
    }
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
