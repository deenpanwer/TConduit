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
    "name": "TRAC AI (PRIVATE) LIMITED",
    "alternateName": ["TRAC AI", "Trac AI"],
    "url": "https://www.heytracai.com",
    "logo": "https://www.heytracai.com/trac-ai-logo.png",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Karachi",
      "addressCountry": "PK"
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
    "@type": "Product",
    "name": "TRAC AI Business Operating System",
    "image": "https://www.heytracai.com/trac-ai-logo.png",
    "description": "The first truly integrated business operating system. Designed for professionals, powered by AI, combining CRM, POS, ATS, chats, shifts, time tracking, and accounting.",
    "brand": {
      "@type": "Brand",
      "name": "TRAC AI"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "500",
      "bestRating": "5",
      "worstRating": "1"
    },
    "review": [
      {
        "@type": "Review",
        "author": {
          "@type": "Person",
          "name": "Elian Vance"
        },
        "datePublished": "2026-05-10",
        "reviewBody": "Operating a distribution fleet in Karachi while syncing with a remote invoicing team was a nightmare of spreadsheet transfers. With TRAC AI, our POS, Inventory, and Accounts are completely unified. It just works.",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5",
          "bestRating": "5",
          "worstRating": "1"
        },
        "publisher": {
          "@type": "Organization",
          "name": "TRAC AI (PRIVATE) LIMITED"
        }
      },
      {
        "@type": "Review",
        "author": {
          "@type": "Person",
          "name": "Soraya Kincaid"
        },
        "datePublished": "2026-05-02",
        "reviewBody": "The integrated ATS coupled with custom contracts cut our hiring onboarding time in half. No more jumping between DocuSign, Slack, and separate CRM software. TRAC AI solved our workflow fragmentation.",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5",
          "bestRating": "5",
          "worstRating": "1"
        },
        "publisher": {
          "@type": "Organization",
          "name": "TRAC AI (PRIVATE) LIMITED"
        }
      },
      {
        "@type": "Review",
        "author": {
          "@type": "Person",
          "name": "Thane Sterling"
        },
        "datePublished": "2026-04-28",
        "reviewBody": "We track shifts and machine manufacturing cycles. TRAC AI is the only tool that actually combines manufacturing material bills with standard POS registers and daily accounting. It replaced three separate subscriptions.",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5",
          "bestRating": "5",
          "worstRating": "1"
        },
        "publisher": {
          "@type": "Organization",
          "name": "TRAC AI (PRIVATE) LIMITED"
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
