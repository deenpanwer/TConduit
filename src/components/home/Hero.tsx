"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Sparkles, ArrowRight, Zap, Rocket, Star } from "lucide-react";

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
        {/* Heading */}
        <h1 className="text-[clamp(2.5rem,8vw,6rem)] font-black leading-[0.95] tracking-tighter mb-10 uppercase italic">
          Software that <br className="hidden md:block" />
          <span className="text-primary tracking-[-0.05em]">replaces all software </span>
          <span className="text-red-500 tracking-[-0.02em]">
            at 1/100th <span className="text-black dark:text-white">of a price</span>
          </span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-3xl mx-auto mb-12 leading-loose tracking-wide px-4">
          You'll find out who wasn't working when a client leaves, a project fails, or your best person quits in frustration. By then it's already <span className="text-red-600 font-bold">cost you.</span>
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <Link
            href="/ems/signup"
            className="w-full sm:w-auto px-10 py-4 bg-black dark:bg-white text-white dark:text-black font-bold text-lg rounded-full hover:scale-105 transition-all active:scale-95 shadow-xl shadow-primary/10 flex items-center justify-center gap-2 group"
          >
            Start now - It's free
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="https://calendly.com/kaayfkhan/discovery-call"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-10 py-4 font-bold text-lg rounded-full border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-all flex items-center justify-center"
          >
            Meet an advisor
          </Link>
        </div>

        {/* Feature Rating Badge */}
        <div className="flex flex-col items-center gap-2 max-w-sm mx-auto mb-20">
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-[#FFB800] text-[#FFB800]" />
            ))}
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            500+ reviews from
            <span className="flex gap-2">
              <img src="/feature/ratings1.png" alt="Partner Logos" className="h-6 w-auto dark:invert" />
            </span>
          </p>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-70">
          {[
            { icon: <Zap size={16} />, text: "7 Days Free Trial" },
            { icon: <Sparkles size={16} />, text: "AI-Native features" },
            { icon: <Rocket size={16} />, text: "No Training Required" }
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-primary">{item.icon}</span>
              <span className="text-xs font-black tracking-widest uppercase italic">{item.text}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* --- HERO VISUAL --- */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 1 }}
        className="mt-24 relative z-10 w-full max-w-6xl px-4"
      >
        <div className="relative aspect-[16/9] rounded-[2.5rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-white/10">
          <Image
            src="/trac-ai-traconomics-business-dashboard-trac-diary.png"
            alt="Trac AI Platform Dashboard"
            fill
            className="object-cover"
            priority
          />
          {/* Subtle overlay to help it blend with dark theme */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
        </div>
      </motion.div>
    </section>
  );
}
