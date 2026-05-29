import { notFound } from "next/navigation";
import { COMPETITORS_CONFIG } from "@/lib/data/competitor-data";
import { AlternativeContent } from "./alternative-content";

// Define all routes to statically generate during Next.js build
export function generateStaticParams() {
  return Object.keys(COMPETITORS_CONFIG).map((competitor) => ({
    competitor,
  }));
}

// Generate dynamic SEO Metadata
export async function generateMetadata({ params }: { params: Promise<{ competitor: string }> }) {
  const resolvedParams = await params;
  const competitorId = resolvedParams.competitor?.toLowerCase();
  const data = COMPETITORS_CONFIG[competitorId];
  if (!data) return {};

  return {
    title: data.seo.title,
    description: data.seo.description,
    openGraph: {
      title: data.seo.title,
      description: data.seo.description,
      type: "website",
    }
  };
}

// Route handler
export default async function AlternativePage({ params }: { params: Promise<{ competitor: string }> }) {
  const resolvedParams = await params;
  const competitorId = resolvedParams.competitor?.toLowerCase();
  const data = COMPETITORS_CONFIG[competitorId];
  
  if (!data) {
    notFound();
  }

  return <AlternativeContent data={data} />;
}
