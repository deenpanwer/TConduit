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
        <h1 className="text-[clamp(2.5rem,6vw,5rem)] font-black leading-[1.05] tracking-tighter mb-8 max-w-4xl mx-auto uppercase italic">
          Finally know in your team <br className="hidden md:block" />
          <span className="text-primary tracking-[-0.05em]">who's working</span> and who isn't.
        </h1>

        <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl mx-auto mb-10 leading-relaxed px-4">
          One login. Every tool your team needs. You see exactly who's doing what — live, without asking.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col items-center justify-center gap-3 mb-12">
          <Link
            href="/demo"
            className="w-full sm:w-auto px-12 py-5 bg-black dark:bg-white text-white dark:text-black font-bold text-xl rounded-full hover:scale-105 transition-all active:scale-95 shadow-xl shadow-primary/10 flex items-center justify-center gap-3 group"
          >
            Take a 1-Minute Demo
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="text-sm font-medium text-muted-foreground tracking-wide">
            No prep. No install. 60 seconds.
          </p>
        </div>

        {/* Social Proof Block */}
        <div className="flex flex-col items-center gap-6 max-w-2xl mx-auto mb-20">
          <div className="text-center space-y-3">
            <p className="text-lg font-bold">
              <span className="text-primary text-2xl font-black">42%</span> average increase in measured output within 30 days
            </p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-sm text-muted-foreground italic">
              <p>"Found our bottleneck in 48 hours." - 35-person SaaS</p>
              <p className="hidden md:block">•</p>
              <p>"Saved us from a bad hire." - 50-person Agency</p>
            </div>
          </div>
          
          <div className="h-px w-24 bg-black/10 dark:bg-white/10"></div>

          {/* Feature Rating Badge */}
          <div className="flex flex-col items-center gap-2">
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
