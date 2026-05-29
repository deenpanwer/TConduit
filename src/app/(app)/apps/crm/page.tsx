import React from "react";
import { Navbar } from "@/components/home/Navbar";
import { CRMHero } from "@/components/apps/crm/CRMHero";
import { CRMFeaturesGrid } from "@/components/apps/crm/CRMFeaturesGrid";
import { CRMIntegrations } from "@/components/apps/crm/CRMIntegrations";
import { Footer } from "@/components/home/Footer";
import { Testimonials } from "@/components/home/Testimonials";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function CRMPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-[#050505] text-black dark:text-white font-sans selection:bg-blue-500 selection:text-white overflow-x-hidden">
      <Navbar />
      <CRMHero />
      <CRMFeaturesGrid />
      <CRMIntegrations />
      
      {/* Middle CTA */}
      <section className="py-40 bg-blue-600 text-white relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[600px] bg-blue-400/20 rounded-full blur-[120px] -z-10" />
        <div className="max-w-4xl mx-auto px-6 text-center">
           <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-8">
             <Sparkles size={14} />
             <span className="text-xs font-black uppercase tracking-widest">Customer Relationships</span>
           </div>
           <h2 className="text-4xl md:text-8xl font-black font-poppins tracking-tighter mb-12 uppercase italic leading-[0.9]">Start managing <br /> better relationships today.</h2>
           <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
              <Link href="/signup" className="px-12 py-5 bg-white text-blue-600 font-black text-lg rounded-full hover:scale-105 transition-transform">Try it for free</Link>
              <Link href="/apps/crm/features" className="text-white font-black text-lg uppercase tracking-widest flex items-center gap-2 hover:opacity-80 transition-opacity">See all features <ArrowRight size={20} /></Link>
           </div>
        </div>
      </section>

      <Testimonials />
      <Footer />
    </main>
  );
}
