import React from "react";
import { Navbar } from "@/components/home/Navbar";
import { CRMFeaturesList } from "@/components/apps/crm/CRMFeaturesList";
import { Footer } from "@/components/home/Footer";
import { Testimonials } from "@/components/home/Testimonials";
import Link from "next/link";
import { ArrowRight, Sparkles, Zap, ChevronLeft } from "lucide-react";

export default function CRMFeaturesPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-[#050505] text-black dark:text-white font-sans selection:bg-blue-500 selection:text-white overflow-x-hidden">
      <Navbar />
      
      {/* Small Hero / Breadcrumb */}
      <section className="pt-40 pb-20 px-6 bg-[#f5f5f7] dark:bg-[#0a0a0a] border-b border-black/5 dark:border-white/10 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-500/10 rounded-full blur-[80px] -z-10 opacity-50 dark:opacity-20" />
        
        <div className="max-w-7xl mx-auto">
           <Link href="/apps/crm" className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest text-muted-foreground hover:text-blue-500 transition-colors mb-12">
             <ChevronLeft size={16} /> Back to CRM Overview
           </Link>
           
           <h1 className="text-4xl md:text-8xl font-black font-poppins tracking-tighter uppercase italic leading-[0.9] mb-8">Every feature you <br /> need to <span className="text-blue-500 underline underline-offset-8 decoration-blue-500/20">succeed.</span></h1>
           
           <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl leading-relaxed">
             The most comprehensive CRM, built to be simple and effective. No hidden costs. No complicated setup.
           </p>
        </div>
      </section>

      <CRMFeaturesList />

      {/* Bottom CTA */}
      <section className="py-40 bg-black text-white border-t border-white/10 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-500/20 rounded-full blur-[100px] -z-10" />
        <div className="max-w-4xl mx-auto px-6 text-center">
           <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-8">
             <Zap size={14} className="text-blue-400" />
             <span className="text-xs font-black uppercase tracking-widest">Get Started</span>
           </div>
           <h2 className="text-4xl md:text-8xl font-black font-poppins tracking-tighter mb-12 uppercase italic leading-[0.9]">Ready to see it <br /> in action?</h2>
           <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
              <Link href="/signup" className="px-12 py-5 bg-white text-black font-black text-lg rounded-full hover:scale-105 transition-transform">Start now - It's free</Link>
              <Link href="/demo" className="text-white font-black text-lg uppercase tracking-widest flex items-center gap-2 hover:opacity-80 transition-opacity">Schedule a demo <ArrowRight size={20} /></Link>
           </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
