"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Sparkles, ArrowRight, Zap, Rocket } from "lucide-react";

export function Hero() {
  return (
    <section className="relative w-full pt-32 pb-20 px-6 overflow-hidden min-h-screen flex flex-col items-center bg-white dark:bg-black">
      
      {/* --- HIGH-VISIBILITY GRID SYSTEM --- */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Increased opacity for clearer grid visibility */}
        <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808033_1px,transparent_1px),linear-gradient(to_bottom,#80808033_1px,transparent_1px)] bg-[size:45px_45px]" />
        
        {/* Adjusted mask so the grid stays visible longer towards the bottom */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-transparent to-white dark:to-black" />
        <div className="absolute inset-0 z-0 [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_40%,transparent_100%)]" />

        {/* Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-primary/15 blur-[120px] rounded-full opacity-60" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-6xl mx-auto relative z-10 text-center"
      >
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 backdrop-blur-md mb-10 group cursor-default">
          <Sparkles size={14} className="text-primary group-hover:animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">The Operating System for Business</span>
        </div>

        {/* Heading */}
        <h1 className="text-[clamp(3rem,10vw,8rem)] font-black leading-[0.85] tracking-tighter mb-10 uppercase italic">
          Software that <br className="hidden md:block" />
          <span className="text-primary tracking-[-0.05em]">replaces all software.</span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-2xl mx-auto mb-12 leading-relaxed">
          Stop paying for 20 different apps. Trac AI gives you everything your business needs in one place. It just works.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-10 py-4 bg-black dark:bg-white text-white dark:text-black font-bold text-lg rounded-full hover:scale-105 transition-all active:scale-95 shadow-xl shadow-primary/10 flex items-center justify-center gap-2 group"
          >
            Start now - It's free
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/demo"
            className="w-full sm:w-auto px-10 py-4 font-bold text-lg rounded-full border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-all flex items-center justify-center"
          >
            Meet an advisor
          </Link>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-70">
          {[
            { icon: <Zap size={16} />, text: "Fastest implementation" },
            { icon: <Sparkles size={16} />, text: "AI-Native features" },
            { icon: <Rocket size={16} />, text: "Enterprise Scale" }
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-primary">{item.icon}</span>
              <span className="text-xs font-black tracking-widest uppercase italic">{item.text}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* --- HERO VISUAL (MOCKUP WITH STACKED IMAGE) --- */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 1 }}
        className="mt-24 relative z-10 w-full max-w-6xl"
      >
        <div className="relative aspect-[16/10] rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-950 overflow-hidden shadow-2xl flex flex-col">
          
          {/* 1. Header Bar: Fixed height, no overlap */}
          <div className="h-11 shrink-0 bg-zinc-100/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-black/5 dark:border-white/5 flex items-center px-6 gap-2 z-20">
             <div className="size-3 rounded-full bg-red-400/40" />
             <div className="size-3 rounded-full bg-yellow-400/40" />
             <div className="size-3 rounded-full bg-green-400/40" />
          </div>
          
          {/* 2. Content Area: Image fits exactly below the header */}
          <div className="relative flex-grow w-full">
            <Image
              src="/diary/demo1.png"
              alt="Trac AI Platform Demo"
              fill
              className="object-cover object-top"
              priority
            />
            {/* Glossy overlay effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none z-10" />
          </div>

          {/* Inner bezel highlight */}
          <div className="absolute inset-0 border border-white/5 rounded-3xl pointer-events-none z-30" />
        </div>
      </motion.div>
    </section>
  );
}
