"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Sparkles, ArrowRight, Zap, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

export function Hero() {
  return (
    <section className="relative pt-40 pb-32 px-6 overflow-hidden min-h-[90vh] flex flex-col items-center justify-center text-center">
      {/* Background elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100vh] bg-gradient-to-b from-primary/5 via-transparent to-transparent -z-10 blur-3xl opacity-50 dark:opacity-20" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-black/10 dark:via-white/20 to-transparent -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-6xl mx-auto"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/[0.03] dark:bg-white/[0.05] border border-black/5 dark:border-white/10 backdrop-blur-md mb-8 group cursor-default">
          <Sparkles size={14} className="text-primary group-hover:animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">The Operating System for Business</span>
        </div>

        <h1 className="text-[clamp(2.5rem,8vw,7rem)] font-black leading-[0.9] tracking-tighter mb-10 font-poppins selection:bg-primary selection:text-white uppercase italic">
          Software that <br className="hidden md:block" />
          <span className="text-primary">replaces all software.</span>
        </h1>

        <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-3xl mx-auto mb-12 leading-relaxed font-sans">
          Stop paying for 20 different apps. Trac AI gives you everything your business needs in one place. It just works.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-12 py-5 bg-black dark:bg-white text-white dark:text-black font-black text-lg rounded-full hover:scale-105 transition-transform active:scale-95 shadow-2xl shadow-primary/20 flex items-center justify-center gap-3 group"
          >
            Start now - It's free
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/demo"
            className="w-full sm:w-auto px-12 py-5 font-black text-lg rounded-full border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center justify-center gap-3 group"
          >
            Meet an advisor
          </Link>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-center gap-12 grayscale opacity-40 group hover:grayscale-0 hover:opacity-100 transition-all duration-700">
          <div className="flex items-center gap-3">
            <Zap className="size-5" />
            <span className="font-poppins font-black text-xl tracking-tighter uppercase italic">Fastest implementation</span>
          </div>
          <div className="flex items-center gap-3">
            <Sparkles className="size-5" />
            <span className="font-poppins font-black text-xl tracking-tighter uppercase italic">AI-Native features</span>
          </div>
          <div className="flex items-center gap-3">
            <Rocket className="size-5" />
            <span className="font-poppins font-black text-xl tracking-tighter uppercase italic">Enterprise Scale</span>
          </div>
        </div>
      </motion.div>

      {/* Hero Visual - Animated Shimmering Grid */}
      <div className="mt-32 relative w-full max-w-[1200px] aspect-video rounded-t-3xl border-t border-x border-black/10 dark:border-white/10 overflow-hidden shadow-[0_-40px_100px_-20px_rgba(0,0,0,0.1)] dark:shadow-[0_-40px_100px_-20px_rgba(255,255,255,0.05)]">
        <div className="absolute inset-0 bg-white dark:bg-[#050505]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
          
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-4/5 h-4/5 bg-primary/10 rounded-full blur-[120px] animate-pulse-slow" />
          
          <div className="relative h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="size-20 bg-black dark:bg-white rounded-3xl flex items-center justify-center shadow-2xl">
                 <span className="text-white dark:text-black font-black text-4xl">T</span>
              </div>
              <div className="flex gap-2">
                 <div className="h-2 w-12 bg-black/10 dark:bg-white/10 rounded-full" />
                 <div className="h-2 w-8 bg-black/10 dark:bg-white/10 rounded-full" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Mock App Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           <div className="w-[90%] h-[90%] border border-black/5 dark:border-white/5 rounded-2xl bg-white/50 dark:bg-black/50 backdrop-blur-sm shadow-inner" />
        </div>
      </div>
    </section>
  );
}
