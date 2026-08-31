import React from "react";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/home/Navbar";
import { Hero } from "@/components/home/Hero";
import { AppGrid } from "@/components/home/AppGrid";
import { ValueProps } from "@/components/home/ValueProps";

const Testimonials = dynamic(() => import("@/components/home/Testimonials").then((mod) => mod.Testimonials));
const ContactForm = dynamic(() => import("@/components/home/ContactForm").then((mod) => mod.ContactForm));
const Footer = dynamic(() => import("@/components/home/Footer").then((mod) => mod.Footer));

const RatedG2Section = dynamic(() => import("@/components/home/RatedG2Section").then((mod) => mod.RatedG2Section));
const UnifiedProductGrid = dynamic(() => import("@/components/home/UnifiedProductGrid").then((mod) => mod.UnifiedProductGrid));
const CopilotRoiSection = dynamic(() => import("@/components/home/CopilotRoiSection").then((mod) => mod.CopilotRoiSection));
const EmployeeRoiSection = dynamic(() => import("@/components/home/EmployeeRoiSection").then((mod) => mod.EmployeeRoiSection));
const ConsolidationStatsSection = dynamic(() => import("@/components/home/ConsolidationStatsSection").then((mod) => mod.ConsolidationStatsSection));

export default function LandingPage() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "TRAC AI LLC",
    "alternateName": ["TRAC AI", "Trac AI"],
    "url": "https://www.heytracai.com",
    "logo": "https://www.heytracai.com/trac-ai-logo.png",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Albuquerque",
      "addressRegion": "NM",
      "postalCode": "87113",
      "addressCountry": "US"
    },
    "brand": {
      "@type": "Brand",
      "name": "TRAC AI",
      "logo": "https://www.heytracai.com/trac-ai-logo.png"
    },
    "sameAs": [
      "https://github.com/deenpanwer/TConduit",
      "https://apps.microsoft.com/detail/9nx8z15j752f"
    ]
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "TRAC AI",
    "alternateName": "Trac AI",
    "url": "https://www.heytracai.com"
  };

  const reviewSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "TRAC AI",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Windows, macOS, Web, Linux, iOS, Android",
    "url": "https://www.heytracai.com",
    "image": "https://www.heytracai.com/trac-ai-logo.png",
    "description": "TRAC AI is the unified business operating system combining CRM, POS, ATS, team chats, shifts, employee time tracking, and accounting in one platform.",
    "brand": {
      "@type": "Brand",
      "name": "TRAC AI",
      "logo": "https://www.heytracai.com/trac-ai-logo.png"
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "priceValidUntil": "2028-12-31"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "128",
      "ratingCount": "128",
      "bestRating": "5",
      "worstRating": "1"
    },
    "review": [
      {
        "@type": "Review",
        "author": {
          "@type": "Person",
          "name": "Sarah Chen"
        },
        "datePublished": "2026-05-10",
        "reviewBody": "Switching to Trac was the best decision we made for our sales team. We replaced three different tools and saved thousands a month.",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5",
          "bestRating": "5",
          "worstRating": "1"
        },
        "publisher": {
          "@type": "Organization",
          "name": "G2 Crowd"
        }
      },
      {
        "@type": "Review",
        "author": {
          "@type": "Person",
          "name": "Marcus Thorne"
        },
        "datePublished": "2026-05-02",
        "reviewBody": "The hiring tool is like magic. We found two top-tier engineers in less than a week using the AI search.",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5",
          "bestRating": "5",
          "worstRating": "1"
        },
        "publisher": {
          "@type": "Organization",
          "name": "G2 Crowd"
        }
      },
      {
        "@type": "Review",
        "author": {
          "@type": "Person",
          "name": "Alex Rivera"
        },
        "datePublished": "2026-04-28",
        "reviewBody": "Everything just works. No more integration headaches. No more manual data entry. Just pure productivity.",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5",
          "bestRating": "5",
          "worstRating": "1"
        },
        "publisher": {
          "@type": "Organization",
          "name": "G2 Crowd"
        }
      }
    ]
  };

  return (
    <main className="min-h-screen bg-white dark:bg-[#050505] text-black dark:text-white font-sans selection:bg-primary selection:text-white">
      {/* Inject Structured SEO Schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewSchema) }}
      />

      <Navbar />
      <Hero />
      {/* <AppGrid /> */}
      <UnifiedProductGrid />
      <ValueProps />
      <CopilotRoiSection />
      <RatedG2Section />
      <EmployeeRoiSection />
      <ConsolidationStatsSection />
      <Testimonials />
      <ContactForm />
      <Footer />
    </main>
  );
}
