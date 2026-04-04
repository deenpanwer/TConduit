"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Users, ArrowRight, Sparkles, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function CRMHero() {
  return (
    <section className="relative pt-32 pb-20 px-6 overflow-hidden flex flex-col items-center text-center">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] -z-10 opacity-50 dark:opacity-20" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-4xl mx-auto"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 mb-8 group cursor-default">
          <Sparkles size={14} className="text-blue-500 group-hover:animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 font-poppins">Customer Relationship Magic</span>
        </div>

        <h1 className="text-5xl md:text-8xl font-black leading-[0.9] tracking-tighter mb-8 font-poppins selection:bg-blue-500 selection:text-white uppercase italic">
          Keep your <span className="text-blue-500">customers</span> <br className="hidden md:block" />
          close. <span className="text-blue-500">deals</span> closer.
        </h1>

        <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl mx-auto mb-12 leading-relaxed font-sans">
          The easiest way to track leads, get clear forecasts, and close more sales. No messy spreadsheets. No complicated tech-talk. Just results.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-12 py-5 bg-blue-600 text-white font-black text-lg rounded-full hover:scale-105 transition-transform active:scale-95 shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 group"
          >
            Try it for free
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-widest">
            <ShieldCheck size={16} className="text-blue-500" />
            No credit card needed
          </div>
        </div>
      </motion.div>

      {/* Hero Visual: Simplified Pipeline */}
      <div className="mt-20 w-full max-w-5xl relative group">
        <div className="absolute inset-0 bg-blue-500/5 rounded-[2.5rem] -rotate-1 group-hover:rotate-0 transition-transform duration-700 -z-10" />
        <div className="bg-white dark:bg-[#0a0a0a] rounded-[2.5rem] border border-black/5 dark:border-white/10 p-8 shadow-2xl overflow-hidden min-h-[400px]">
           <div className="flex items-center justify-between mb-12">
              <div className="flex gap-4">
                 <div className="h-4 w-32 bg-black/5 dark:bg-white/5 rounded-full" />
                 <div className="h-4 w-20 bg-black/5 dark:bg-white/5 rounded-full" />
              </div>
              <div className="flex gap-2">
                 <div className="size-8 rounded-full bg-blue-500/10" />
                 <div className="size-8 rounded-full bg-purple-500/10" />
              </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: "New Leads", count: 12, color: "blue" },
                { label: "Meeting Scheduled", count: 5, color: "purple" },
                { label: "Closing Soon", count: 3, color: "emerald" }
              ].map((stage, i) => (
                <div key={stage.label} className="p-6 rounded-2xl bg-[#f5f5f7] dark:bg-[#111] border border-black/5 dark:border-white/5">
                   <div className="flex items-center justify-between mb-6">
                      <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">{stage.label}</span>
                      <span className={cn("text-xs font-bold px-2 py-1 rounded-md", `bg-${stage.color}-500/10 text-${stage.color}-500`)}>{stage.count}</span>
                   </div>
                   <div className="space-y-3">
                      {[1, 2].map(j => (
                        <div key={j} className="p-4 rounded-xl bg-white dark:bg-black border border-black/5 dark:border-white/5 shadow-sm">
                           <div className="h-3 w-3/4 bg-black/5 dark:bg-white/5 rounded-full mb-3" />
                           <div className="h-2 w-1/2 bg-black/5 dark:bg-white/5 rounded-full" />
                        </div>
                      ))}
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </section>
  );
}
