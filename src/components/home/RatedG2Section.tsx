"use client";

import React from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const BADGES_COL_1 = [
  { title: "AI Products", label: "Leader 2026", color: "from-[#ff4b2b] to-[#ff416c]" },
  { title: "Best Software", label: "Top 50", color: "from-blue-600 to-indigo-600" },
  { title: "Project Management", label: "Leader 2026", color: "from-[#ff4b2b] to-[#ff416c]" },
  { title: "Agentic AI Tools", label: "High Performer", color: "from-emerald-500 to-teal-500" },
  { title: "Time Tracking", label: "Leader", color: "from-[#ff4b2b] to-[#ff416c]" },
];

const BADGES_COL_2 = [
  { title: "HR Software", label: "Leader 2026", color: "from-purple-600 to-pink-600" },
  { title: "Global ERP", label: "Momentum Leader", color: "from-amber-500 to-orange-500" },
  { title: "CRM Platforms", label: "Leader", color: "from-[#ff4b2b] to-[#ff416c]" },
  { title: "Development Products", label: "High Performer", color: "from-blue-500 to-cyan-500" },
  { title: "Operations Suite", label: "Leader 2026", color: "from-[#ff4b2b] to-[#ff416c]" },
];

export function RatedG2Section() {
  return (
    <section className="py-24 bg-white text-zinc-900 overflow-hidden relative border-t border-zinc-100">
      {/* Dynamic encapsulated marquee styles */}
      <style>{`
        @keyframes marquee-up {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        @keyframes marquee-down {
          0% { transform: translateY(-50%); }
          100% { transform: translateY(0); }
        }
        .animate-marquee-up {
          animation: marquee-up 25s linear infinite;
        }
        .animate-marquee-down {
          animation: marquee-down 25s linear infinite;
        }
        .animate-marquee-up:hover, .animate-marquee-down:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Indigo text and clean modern CTA */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <div className="flex items-center gap-1.5 text-indigo-600 font-black uppercase tracking-widest text-[11px]">
              <Star size={12} className="fill-indigo-600 stroke-none" />
              RATED 4.9/5 FROM 500+ G2 REVIEWS
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-zinc-900 tracking-tight leading-none uppercase">
              #1 most referenced company on G2 reports
            </h2>
            <p className="text-base font-semibold text-zinc-500 uppercase tracking-wide leading-relaxed">
              Founders, remote teams, and managers rate TRAC AI at the top of G2 reports for workflow consolidation, time logs, and AI efficiency.
            </p>
            <div className="pt-2">
              <Link href="/reviews">
                <Button className="h-12 px-6 rounded-xl bg-black hover:bg-zinc-800 text-white font-extrabold uppercase tracking-widest text-xs transition-colors shadow-sm">
                  Read customer stories
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Column: Dynamic vertical marquee of CSS-rendered G2 badges */}
          <div className="lg:col-span-7 h-[450px] relative overflow-hidden grid grid-cols-2 gap-6 bg-gradient-to-r from-zinc-50/20 to-zinc-50/80 p-4 rounded-3xl border border-zinc-100/50">
            {/* Overlay mask gradients for smooth fade out at top/bottom */}
            <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-white to-transparent z-20 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-white to-transparent z-20 pointer-events-none" />

            {/* Column 1: Scrolls UP */}
            <div className="flex flex-col gap-6 h-full relative overflow-hidden">
              <div className="flex flex-col gap-6 animate-marquee-up py-4">
                {[...BADGES_COL_1, ...BADGES_COL_1].map((badge, idx) => (
                  <div 
                    key={idx} 
                    className="bg-white border border-zinc-200/60 rounded-2xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-zinc-300 transition-all flex flex-col justify-between items-center text-center w-full min-h-[160px] relative overflow-hidden group"
                  >
                    {/* Top Ribbon */}
                    <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${badge.color}`} />
                    
                    {/* SVG G2-like Logo */}
                    <div className="size-10 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform duration-300">
                      <svg viewBox="0 0 24 24" className="size-5 fill-[#ff4b2b]" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z" />
                      </svg>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400 block">{badge.label}</span>
                      <h4 className="text-sm font-black uppercase text-zinc-800 tracking-tight leading-snug">{badge.title}</h4>
                    </div>
                    
                    <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mt-2 block">WINTER 2026</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: Scrolls DOWN */}
            <div className="flex flex-col gap-6 h-full relative overflow-hidden">
              <div className="flex flex-col gap-6 animate-marquee-down py-4">
                {[...BADGES_COL_2, ...BADGES_COL_2].map((badge, idx) => (
                  <div 
                    key={idx} 
                    className="bg-white border border-zinc-200/60 rounded-2xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-zinc-300 transition-all flex flex-col justify-between items-center text-center w-full min-h-[160px] relative overflow-hidden group"
                  >
                    {/* Top Ribbon */}
                    <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${badge.color}`} />
                    
                    {/* SVG G2-like Logo */}
                    <div className="size-10 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform duration-300">
                      <svg viewBox="0 0 24 24" className="size-5 fill-[#ff4b2b]" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z" />
                      </svg>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400 block">{badge.label}</span>
                      <h4 className="text-sm font-black uppercase text-zinc-800 tracking-tight leading-snug">{badge.title}</h4>
                    </div>
                    
                    <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mt-2 block">WINTER 2026</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
