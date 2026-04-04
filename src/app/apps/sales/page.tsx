"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
  Briefcase, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  ChevronLeft, 
  Target, 
  TrendingUp, 
  Users, 
  MousePointer2,
  Zap,
  BarChart2,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/home/Navbar";
import { Footer } from "@/components/home/Footer";

const FEATURES = [
  {
    title: "Instant Quotes.",
    description: "Create professional sales quotes in seconds. Trac AI handles the formatting and calculations for you.",
    icon: FileText,
    color: "blue"
  },
  {
    title: "Automated Follow-ups.",
    description: "Never let a lead go cold. Trac AI sends perfectly-timed nudges to keep your prospects engaged.",
    icon: Zap,
    color: "orange"
  },
  {
    title: "Contract Magic.",
    description: "Get contracts signed faster with built-in digital signatures. Secure, legal, and lightning fast.",
    icon: ShieldCheck,
    color: "emerald"
  },
  {
    title: "Deep Analytics.",
    description: "Understand your sales funnel like never before. Spot bottlenecks and optimize for conversion.",
    icon: BarChart2,
    color: "purple"
  }
];

export default function SalesPage() {
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
    <main className="min-h-screen bg-white dark:bg-[#050505] text-black dark:text-white font-sans selection:bg-blue-500 selection:text-white overflow-x-hidden">
      <Navbar />

      <section className="relative pt-40 pb-20 px-6 overflow-hidden flex flex-col items-center text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] -z-10 opacity-50 dark:opacity-20" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/5 border border-blue-500/20 mb-8">
            <Briefcase size={14} className="text-blue-500" />
            <span className="text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Revenue Acceleration</span>
          </div>

          <h1 className="text-5xl md:text-8xl font-black leading-[0.9] tracking-tighter mb-8 uppercase italic">
            Sales that <br />
            <span className="text-blue-500 underline underline-offset-8 decoration-blue-500/20">close themselves.</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl mx-auto mb-12 leading-relaxed">
            The smartest way to sell. Trac AI automates the boring stuff so you can focus on building relationships and winning deals.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-12 py-5 bg-blue-600 text-white font-black text-lg rounded-full hover:scale-105 transition-transform shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3"
            >
              Get Started
              <ArrowRight size={20} />
            </Link>
          </div>
        </motion.div>

        <div className="mt-20 w-full max-w-5xl relative group">
          <div className="absolute inset-0 bg-blue-500/5 rounded-[2.5rem] -rotate-1 group-hover:rotate-0 transition-transform duration-700 -z-10" />
          <div className="bg-white dark:bg-[#0a0a0a] rounded-[2.5rem] border border-black/5 dark:border-white/10 p-8 shadow-2xl overflow-hidden min-h-[400px] relative text-left">
             
             <div className="flex items-center justify-between mb-12 border-b border-black/5 pb-6">
                <div className="flex gap-4">
                   <div className="h-4 w-32 bg-black/5 dark:bg-white/5 rounded-full" />
                   <div className="h-4 w-20 bg-black/5 dark:bg-white/5 rounded-full" />
                </div>
                <div className="size-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                   <TrendingUp size={18} className="text-blue-500" />
                </div>
             </div>
             
             <div className="space-y-8 max-w-lg mx-auto py-10">
                <div className="text-center">
                   <div className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-2">Total Deal Value</div>
                   <div className="text-6xl font-black font-poppins text-blue-500">$124,500</div>
                </div>
                <div className="flex gap-4">
                   <div className="h-2 flex-1 bg-blue-500 rounded-full" />
                   <div className="h-2 flex-1 bg-blue-500/20 rounded-full" />
                   <div className="h-2 flex-1 bg-blue-500/20 rounded-full" />
                </div>
             </div>

             <motion.div 
               animate={{ x: mousePos.x, y: mousePos.y }}
               transition={{ duration: 2, ease: "easeInOut" }}
               className="absolute z-50 pointer-events-none"
             >
                <MousePointer2 size={24} className="text-blue-500 fill-blue-500" />
                <div className="absolute top-full left-full mt-2 bg-blue-600 text-white text-[10px] font-black px-2 py-1 rounded shadow-lg whitespace-nowrap">
                   Close Deal
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

      <section className="py-40 bg-blue-600 text-white text-center px-6 overflow-hidden relative">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[600px] bg-blue-400/20 rounded-full blur-[120px] -z-10" />
         <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-8xl font-black uppercase italic tracking-tighter leading-[0.9] mb-12">
               Win more <br /> customers today.
            </h2>
            <Link href="/dashboard" className="inline-flex items-center gap-4 px-12 py-5 bg-white text-blue-600 font-black text-lg rounded-full hover:scale-105 transition-transform">
               Go to Dashboard <ArrowRight size={20} />
            </Link>
         </div>
      </section>

      <Footer />
    </main>
  );
}
