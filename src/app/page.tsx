import React from "react";
import { Navbar } from "@/components/home/Navbar";
import { Hero } from "@/components/home/Hero";
import { AppGrid } from "@/components/home/AppGrid";
import { ValueProps } from "@/components/home/ValueProps";
import { Testimonials } from "@/components/home/Testimonials";
import { ContactForm } from "@/components/home/ContactForm";
import { Footer } from "@/components/home/Footer";

export default function LandingPage() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "TRAC AI (PRIVATE) LIMITED",
    "alternateName": ["TRAC AI", "Traconomics"],
    "url": "https://www.traconomics.com",
    "logo": "https://www.traconomics.com/trac-ai-logo.png",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Karachi",
      "addressCountry": "PK"
    },
    "brand": {
      "@type": "Brand",
      "name": "TRAC AI",
      "logo": "https://www.traconomics.com/trac-ai-logo.png"
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
    "alternateName": "Traconomics",
    "url": "https://www.traconomics.com"
  };

  return (
    <main className="min-h-screen bg-white dark:bg-[#050505] text-black dark:text-white font-sans selection:bg-primary selection:text-white overflow-x-hidden">
      {/* Inject Structured SEO Schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />

      <Navbar />
      <Hero />
      <AppGrid />
      <ValueProps />
      <Testimonials />
      <ContactForm />
      <Footer />
    </main>
  );
}
