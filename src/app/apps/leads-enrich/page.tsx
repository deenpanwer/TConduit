"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
  Zap, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  ChevronLeft, 
  Database, 
  Users, 
  MousePointer2,
  Cpu,
  Mail
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/home/Navbar";
import { Footer } from "@/components/home/Footer";

const FEATURES = [
  {
    title: "Instant Profiling.",
    description: "Turn a single email address into a full professional profile. Get job titles, social links, and company data instantly.",
    icon: Users,
    color: "yellow"
  },
  {
    title: "AI Intent Data.",
    description: "Trac AI analyzes your leads to predict their buying intent. Focus on the people ready to close.",
    icon: Sparkles,
    color: "purple"
  },
  {
    title: "Data Refresh.",
    description: "Never work with stale data again. Trac AI automatically updates your lead info in real-time.",
    icon: RefreshCw,
    color: "blue"
  },
  {
    title: "Bulk Enrichment.",
    description: "Upload a list of thousands and watch Trac AI enrich them all in minutes. Scale your outreach effortlessly.",
    icon: Database,
    color: "emerald"
  }
];

function RefreshCw({ size, className }: { size: number, className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  );
}

export default function LeadsEnrichPage() {
  const [mousePos, setMousePos] = useState({ x: 100, y: 100 });

  useEffect(() => {
    const interval = setInterval(() => {
      setMousePos({
        x: Math.random() * 400 + 100,
        y: Math.random() * 200 + 100
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-white dark:bg-[#050505] text-black dark:text-white font-sans selection:bg-yellow-500 selection:text-white overflow-x-hidden">
      <Navbar />

      <section className="relative pt-40 pb-20 px-6 overflow-hidden flex flex-col items-center text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-yellow-500/10 rounded-full blur-[120px] -z-10 opacity-50 dark:opacity-20" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/5 border border-yellow-500/20 mb-8">
            <Zap size={14} className="text-yellow-600" />
            <span className="text-xs font-black uppercase tracking-widest text-yellow-700 dark:text-yellow-400">Data Superpowers</span>
          </div>

          <h1 className="text-5xl md:text-8xl font-black leading-[0.9] tracking-tighter mb-8 uppercase italic">
            Know your leads <br />
            <span className="text-yellow-600 underline underline-offset-8 decoration-yellow-600/20">better than they do.</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl mx-auto mb-12 leading-relaxed">
            The ultimate data enrichment tool. Trac AI turns simple emails into deep business intelligence.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-12 py-5 bg-yellow-600 text-white font-black text-lg rounded-full hover:scale-105 transition-transform shadow-xl shadow-yellow-500/20 flex items-center justify-center gap-3"
            >
              Get Started
              <ArrowRight size={20} />
            </Link>
          </div>
        </motion.div>

        <div className="mt-20 w-full max-w-5xl relative group">
          <div className="absolute inset-0 bg-yellow-500/5 rounded-[2.5rem] -rotate-1 group-hover:rotate-0 transition-transform duration-700 -z-10" />
          <div className="bg-white dark:bg-[#0a0a0a] rounded-[2.5rem] border border-black/5 dark:border-white/10 p-8 shadow-2xl overflow-hidden min-h-[400px] relative">
             
             <div className="flex items-center justify-between mb-12">
                <div className="flex gap-4">
                   <div className="h-4 w-32 bg-black/5 dark:bg-white/5 rounded-full" />
                   <div className="h-4 w-20 bg-black/5 dark:bg-white/5 rounded-full" />
                </div>
                <div className="size-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                   <Cpu size={18} className="text-yellow-600" />
                </div>
             </div>
             
             <div className="flex flex-col md:flex-row gap-12 items-center justify-center">
                <div className="p-8 rounded-3xl bg-[#f5f5f7] dark:bg-[#111] border border-black/5 w-64 text-center">
                   <div className="size-16 rounded-full bg-black/5 dark:bg-white/5 mx-auto mb-4" />
                   <div className="h-3 w-3/4 bg-black/5 dark:bg-white/5 mx-auto rounded-full" />
                </div>
                <ArrowRight size={40} className="text-yellow-600 rotate-90 md:rotate-0" />
                <div className="p-8 rounded-3xl bg-white dark:bg-black border-4 border-yellow-600 w-80">
                   <div className="flex items-center gap-4 mb-6">
                      <div className="size-12 rounded-full bg-yellow-600" />
                      <div className="flex-1">
                         <div className="h-4 w-full bg-black/5 dark:bg-white/5 rounded-full mb-2" />
                         <div className="h-2 w-3/4 bg-black/5 dark:bg-white/5 rounded-full" />
                      </div>
                   </div>
                   <div className="space-y-3">
                      <div className="h-2 w-full bg-black/5 dark:bg-white/5 rounded-full" />
                      <div className="h-2 w-full bg-black/5 dark:bg-white/5 rounded-full" />
                      <div className="h-2 w-1/2 bg-black/5 dark:bg-white/5 rounded-full" />
                   </div>
                </div>
             </div>

             <motion.div 
               animate={{ x: mousePos.x, y: mousePos.y }}
               transition={{ duration: 2, ease: "easeInOut" }}
               className="absolute z-50 pointer-events-none"
             >
                <MousePointer2 size={24} className="text-yellow-600 fill-yellow-600" />
                <div className="absolute top-full left-full mt-2 bg-yellow-600 text-white text-[10px] font-black px-2 py-1 rounded shadow-lg whitespace-nowrap">
                   Enrich Data
                </div>
             </motion.div>
          </div>
        </div>
      </section>

      <section className="py-32 px-6 bg-white dark:bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {FEATURES.map((feature, index) => (
               <motion.div
                 key={feature.title}
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ delay: index * 0.1 }}
                 className="p-12 rounded-[3rem] bg-[#f5f5f7] dark:bg-[#111] border border-black/5 dark:border-white/10 hover:shadow-2xl transition-all duration-500"
               >
                 <div className={cn(
                   "size-16 rounded-2xl flex items-center justify-center mb-10",
                   `bg-${feature.color}-500/10 text-${feature.color}-500`
                 )}>
                   <feature.icon size={32} strokeWidth={2.5} />
                 </div>
                 <h3 className="text-3xl font-black mb-6 uppercase italic tracking-tighter">{feature.title}</h3>
                 <p className="text-lg text-muted-foreground font-medium leading-relaxed">
                   {feature.description}
                 </p>
               </motion.div>
             ))}
          </div>
        </div>
      </section>

      <section className="py-40 bg-yellow-600 text-white text-center px-6 overflow-hidden relative">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[600px] bg-yellow-400/20 rounded-full blur-[120px] -z-10" />
         <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-8xl font-black uppercase italic tracking-tighter leading-[0.9] mb-12">
               Supercharge your <br /> data today.
            </h2>
            <Link href="/dashboard" className="inline-flex items-center gap-4 px-12 py-5 bg-white text-yellow-600 font-black text-lg rounded-full hover:scale-105 transition-transform">
               Go to Dashboard <ArrowRight size={20} />
            </Link>
         </div>
      </section>

      <Footer />
    </main>
  );
}
