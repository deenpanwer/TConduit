"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
  MessageSquare, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  ChevronLeft, 
  Users, 
  Zap, 
  Mic, 
  MousePointer2,
  Video,
  Lock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/home/Navbar";
import { Footer } from "@/components/home/Footer";

const FEATURES = [
  {
    title: "Instant Channels.",
    description: "Organize your team's conversations with unlimited channels for every project and department.",
    icon: Zap,
    color: "sky"
  },
  {
    title: "AI Summaries.",
    description: "Caught in a long meeting? Trac AI summarizes missed messages so you can catch up in seconds.",
    icon: Sparkles,
    color: "purple"
  },
  {
    title: "Integrated Context.",
    description: "Pull in tasks, CRM leads, and sales data directly into your chat. No more switching tabs.",
    icon: MessageSquare,
    color: "emerald"
  },
  {
    title: "Enterprise Security.",
    description: "End-to-end encryption for all your business secrets. Your data belongs to you, always.",
    icon: Lock,
    color: "rose"
  }
];

export default function ChatsPage() {
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
    <main className="min-h-screen bg-white dark:bg-[#050505] text-black dark:text-white font-sans selection:bg-sky-500 selection:text-white overflow-x-hidden">
      <Navbar />

      <section className="relative pt-40 pb-20 px-6 overflow-hidden flex flex-col items-center text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-sky-500/10 rounded-full blur-[120px] -z-10 opacity-50 dark:opacity-20" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-500/5 border border-sky-500/20 mb-8">
            <MessageSquare size={14} className="text-sky-500" />
            <span className="text-xs font-black uppercase tracking-widest text-sky-600 dark:text-sky-400">Team Alignment</span>
          </div>

          <h1 className="text-5xl md:text-8xl font-black leading-[0.9] tracking-tighter mb-8 uppercase italic">
            Chat that keeps <br />
            <span className="text-sky-500 underline underline-offset-8 decoration-sky-500/20">you in the loop.</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl mx-auto mb-12 leading-relaxed">
            The fastest way for your team to talk. Trac AI connects your conversations with your work, all in one place.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-12 py-5 bg-sky-600 text-white font-black text-lg rounded-full hover:scale-105 transition-transform shadow-xl shadow-sky-500/20 flex items-center justify-center gap-3"
            >
              Get Started
              <ArrowRight size={20} />
            </Link>
          </div>
        </motion.div>

        <div className="mt-20 w-full max-w-5xl relative group">
          <div className="absolute inset-0 bg-sky-500/5 rounded-[2.5rem] -rotate-1 group-hover:rotate-0 transition-transform duration-700 -z-10" />
          <div className="bg-white dark:bg-[#0a0a0a] rounded-[2.5rem] border border-black/5 dark:border-white/10 p-8 shadow-2xl overflow-hidden min-h-[400px] relative">
             
             <div className="flex items-center justify-between mb-12">
                <div className="flex gap-4">
                   <div className="h-4 w-32 bg-black/5 dark:bg-white/5 rounded-full" />
                   <div className="h-4 w-20 bg-black/5 dark:bg-white/5 rounded-full" />
                </div>
                <div className="size-10 rounded-full bg-sky-500/10 flex items-center justify-center">
                   <Video size={18} className="text-sky-500" />
                </div>
             </div>
             
             <div className="flex flex-col gap-6 max-w-lg mx-auto">
                <div className="flex items-start gap-4 p-4 rounded-3xl bg-[#f5f5f7] dark:bg-[#111] border border-black/5 self-start">
                   <div className="size-8 rounded-full bg-blue-500" />
                   <div className="h-3 w-40 bg-black/5 dark:bg-white/5 rounded-full mt-2" />
                </div>
                <div className="flex items-start gap-4 p-4 rounded-3xl bg-sky-500 text-white self-end">
                   <div className="h-3 w-32 bg-white/20 rounded-full mt-2" />
                </div>
                <div className="flex items-start gap-4 p-4 rounded-3xl bg-[#f5f5f7] dark:bg-[#111] border border-black/5 self-start">
                   <div className="size-8 rounded-full bg-purple-500" />
                   <div className="h-3 w-48 bg-black/5 dark:bg-white/5 rounded-full mt-2" />
                </div>
             </div>

             <motion.div 
               animate={{ x: mousePos.x, y: mousePos.y }}
               transition={{ duration: 2, ease: "easeInOut" }}
               className="absolute z-50 pointer-events-none"
             >
                <MousePointer2 size={24} className="text-sky-500 fill-sky-500" />
                <div className="absolute top-full left-full mt-2 bg-sky-600 text-white text-[10px] font-black px-2 py-1 rounded shadow-lg whitespace-nowrap">
                   Send Message
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

      <section className="py-40 bg-sky-600 text-white text-center px-6 overflow-hidden relative">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[600px] bg-sky-400/20 rounded-full blur-[120px] -z-10" />
         <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-8xl font-black uppercase italic tracking-tighter leading-[0.9] mb-12">
               Connect with <br /> your team.
            </h2>
            <Link href="/dashboard" className="inline-flex items-center gap-4 px-12 py-5 bg-white text-sky-600 font-black text-lg rounded-full hover:scale-105 transition-transform">
               Go to Dashboard <ArrowRight size={20} />
            </Link>
         </div>
      </section>

      <Footer />
    </main>
  );
}
