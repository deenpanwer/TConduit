"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Zap, Shield, Globe, Database, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const SECTIONS = [
  {
    title: "AI that does the work for you.",
    description: "Our AI agents handle the boring stuff. From finding new leads to setting up meetings, Trac AI takes care of it so you can focus on growing your business.",
    icon: Sparkles,
    image: "/1.png",
    direction: "ltr",
    accent: "blue"
  },
  {
    title: "Everything in one place. Finally.",
    description: "Stop jumping between different apps. In Trac, everything talks to each other. Your sales leads turn into hired team members with just one click.",
    icon: Zap,
    image: "/diary/1.png",
    direction: "rtl",
    accent: "purple"
  },
  {
    title: "Software that feels like it works.",
    description: "We built Trac to be fast and easy to use. No complicated setup, no tech-speak. Just simple software that helps you get more done.",
    icon: Settings,
    image: "/diary/demo4.png",
    direction: "ltr",
    accent: "emerald"
  }
];

export function ValueProps() {
  return (
    <div className="flex flex-col">
      {SECTIONS.map((section, index) => (
        <section 
          key={section.title}
          className={cn(
            "py-32 md:py-60 px-6",
            index % 2 === 0 ? "bg-white dark:bg-black" : "bg-[#f5f5f7] dark:bg-[#0a0a0a]"
          )}
        >
          <div className={cn(
            "max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16 md:gap-32",
            section.direction === "rtl" ? "md:flex-row-reverse" : ""
          )}>
            <div className="flex-1">
              <div className={cn(
                "size-16 rounded-2xl flex items-center justify-center mb-8 shadow-lg",
                `bg-${section.accent}-500/10 text-${section.accent}-500`
              )}>
                <section.icon size={32} strokeWidth={2.5} />
              </div>
              <h2 className="text-4xl md:text-7xl font-black font-poppins tracking-tighter mb-8 leading-[0.9] italic uppercase selection:bg-primary selection:text-white">
                {section.title}
              </h2>
              <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-xl leading-relaxed">
                {section.description}
              </p>
              
              <div className="mt-12 flex flex-wrap items-center gap-6">
                 <button className="px-10 py-4 bg-black dark:bg-white text-white dark:text-black font-black text-lg rounded-full hover:scale-105 transition-transform active:scale-95 shadow-xl">
                   Try it free
                 </button>
                 <div className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground cursor-pointer hover:text-black dark:hover:text-white transition-colors border-b-2 border-transparent hover:border-black/10">
                   SEE THE DETAILS
                 </div>
              </div>
            </div>

            <div className="flex-1 w-full aspect-[4/3] relative group">
              <div className="absolute inset-0 bg-black/5 dark:bg-white/5 rounded-[3rem] -rotate-3 group-hover:rotate-0 transition-transform duration-700" />
              <div className="absolute inset-0 bg-white dark:bg-[#111] rounded-[3rem] border border-black/10 dark:border-white/10 overflow-hidden shadow-2xl group-hover:-translate-y-4 group-hover:translate-x-4 transition-all duration-700">
                <div className="h-10 bg-black/5 dark:bg-white/5 border-b border-black/5 dark:border-white/5 flex items-center px-6 gap-2">
                   <div className="size-2.5 rounded-full bg-red-400/50" />
                   <div className="size-2.5 rounded-full bg-yellow-400/50" />
                   <div className="size-2.5 rounded-full bg-green-400/50" />
                </div>
                <div className="p-12 h-full flex items-center justify-center relative">
                   <div className="w-full h-full bg-black/[0.02] dark:bg-white/[0.02] rounded-2xl animate-pulse-slow overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
                   </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}