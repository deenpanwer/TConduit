"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Image from "next/image";

const SECTIONS = [
  {
    title: "Real-time visibility into your workforce.",
    description: "Know exactly what's happening across your team with live updates and intelligent summaries. See work as it happens without ever having to ask for a status report.",
    image: "/trac-ai-employee-management-reports-traconomics.png",
    direction: "ltr",
    accent: "blue"
  },
  {
    title: "Streamlined task & work management.",
    description: "Keep projects on track with a powerful yet simple management suite. From quick-add notes to complex subtasks, everything is organized in one unified window.",
    image: "/traconomics-ai-task-management-trac-diary.png",
    direction: "rtl",
    accent: "purple"
  },
  {
    title: "Deep insights into performance.",
    description: "Understand productivity with visual charts and detailed activity logs. Identify bottlenecks and optimize your workflow with data-driven insights that help you grow.",
    image: "/trac-ai-productivity-charts-trac-diary-software.png",
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
            "max-w-[1400px] mx-auto flex flex-col md:flex-row items-center gap-16 md:gap-24",
            section.direction === "rtl" ? "md:flex-row-reverse" : ""
          )}>
            <div className="w-full md:w-[40%] shrink-0">
              <h2 className="text-4xl md:text-7xl font-black tracking-tighter mb-8 leading-[0.9] italic uppercase">
                {section.title}
              </h2>
              <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-xl leading-relaxed">
                {section.description}
              </p>
            </div>

            {/* --- WIDER FULL IMAGE DISPLAY --- */}
            <div className="w-full md:w-[60%] aspect-[16/10] relative group">
              <div className="absolute inset-0 bg-black/5 dark:bg-white/5 rounded-[2.5rem] md:rounded-[4rem] -rotate-2 group-hover:rotate-0 transition-transform duration-700" />
              <div className="absolute inset-0 rounded-[2.5rem] md:rounded-[4rem] overflow-hidden shadow-2xl group-hover:-translate-y-4 group-hover:translate-x-4 transition-all duration-700 border border-black/10 dark:border-white/10 bg-white dark:bg-[#050505]">
                <Image 
                  src={section.image}
                  alt={section.title}
                  fill
                  className="object-cover object-top"
                  sizes="(max-w-7xl) 60vw, 100vw"
                  priority={index === 0}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none z-10" />
              </div>
            </div>
            {/* --------------------------- */}
          </div>
        </section>
      ))}
    </div>
  );
}