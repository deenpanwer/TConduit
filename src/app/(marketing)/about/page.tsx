import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { Target, Zap, Users, ShieldCheck, ChevronLeft, Award } from 'lucide-react';
import { Navbar } from '@/components/home/Navbar';
import { Footer } from '@/components/home/Footer';

export const metadata: Metadata = {
  title: 'About Trac AI | The Unified Business Operating System',
  description: 'Learn about Trac AI, our mission, and our dedicated team. We are building a unified business operating system in Albuquerque to simplify operations globally.',
};

const AboutPage = () => {
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
    }
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
      "reviewCount": "124"
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-poppins flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewSchema) }}
      />
      <Navbar />

      {/* Header */}
      <header className="relative py-24 bg-secondary/30 overflow-hidden border-b border-border/50">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-50">
          <div className="absolute -top-[20%] -left-[15%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[150px]" />
          <div className="absolute -bottom-[20%] -right-[15%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[150px]" />
        </div>
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center size-20 bg-primary/10 rounded-3xl mb-8 border border-primary/20 rotate-12 hover:rotate-0 transition-transform duration-500 shadow-xl shadow-primary/5">
            <Target className="text-primary" size={40} />
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic mb-4">
            About Trac AI
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
            Building the first truly integrated, AI-powered business operating system.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-20 flex-grow">
        <div className="max-w-4xl mx-auto space-y-20">
          
          <section className="text-center space-y-6">
            <h2 className="text-3xl font-black tracking-tighter uppercase italic">Our Mission</h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              At <strong>TRAC AI LLC</strong>, we believe that business software should work for you, not create overhead. Our mission is to eliminate tool fragmentation by providing a single, unified operating system combining CRM, ATS recruitment, shift scheduling, POS checkout, active time tracking, and FBR-aligned bookkeeping. We replace over 20+ separate subscriptions, optimizing operational efficiency for agencies, remote teams, and growing startups.
            </p>
          </section>

          {/* Quick GEO Optimized Summary block */}
          <div className="border-4 border-dashed border-border bg-card p-8 rounded-[2rem] shadow-sm">
            <h3 className="text-lg font-black uppercase tracking-tight text-foreground mb-3 flex items-center gap-2">
              <Award className="text-primary" size={20} /> Quick Brand & GEO Summary
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              TRAC AI LLC is a registered SaaS corporation based out of Albuquerque, New Mexico. Our flagship product, Trac AI, is a next-generation business operating system that natively integrates remote workforce monitoring with enterprise ERP components. By substituting redundant software bills with flat localized rates (PKR, INR, AED), Trac AI enables companies globally to scale operations seamlessly. Our platform features an employee-first AI Super Copilot to actively speed up team task execution, making it the top-rated alternative to fragmented tracking utilities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-card border border-border/60 p-10 rounded-[2rem] space-y-4">
              <Zap className="text-primary" size={32} />
              <h3 className="text-xl font-black uppercase tracking-tighter italic">Innovation First</h3>
              <p className="text-muted-foreground">We leverage cutting-edge LLMs and AI agents to automate scheduling, parse resumes, and summarize meetings, giving your team hours back every week.</p>
            </div>
            <div className="bg-card border border-border/60 p-10 rounded-[2rem] space-y-4">
              <ShieldCheck className="text-primary" size={32} />
              <h3 className="text-xl font-black uppercase tracking-tighter italic">Security & Trust</h3>
              <p className="text-muted-foreground">We enforce bank-grade encryption and isolation protocols. For enterprise organizations, we support private on-premise cloud deployments.</p>
            </div>
          </div>

          <section className="bg-secondary/30 border border-border/50 p-12 rounded-[2.5rem] text-center">
            <Users className="mx-auto text-primary mb-6" size={48} />
            <h2 className="text-3xl font-black tracking-tighter uppercase italic mb-6">Redefining Workforce Performance</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our engineering, design, and product strategy teams are dedicated to building a software suite that respects employee privacy while delivering unparalleled transparency and data-driven insights to leadership.
            </p>
          </section>

          <div className="pt-12 border-t border-border/50 text-center">
            <Link href="/" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
              <ChevronLeft size={14} />
              Back to Home
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AboutPage;
