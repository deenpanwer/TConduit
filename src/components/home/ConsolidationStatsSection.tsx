"use client";

import React from "react";

export function ConsolidationStatsSection() {
  return (
    <section className="py-24 bg-white text-zinc-900 border-t border-zinc-100 relative">
      <div className="container mx-auto px-6 max-w-7xl relative z-10 select-none">
        
        {/* Inner contiguous layout block dividing dot grid and text columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-6xl mx-auto">
          
          {/* Left Column: Lightweight visual dot grid array */}
          <div className="flex flex-col items-center lg:items-start space-y-6 bg-zinc-50/30 p-8 md:p-12 border border-zinc-100/50 rounded-3xl">
            <style>{`
              .grid-cols-20 {
                grid-template-columns: repeat(20, minmax(0, 1fr));
              }
            `}</style>
            {/* 15x20 dot array representation representing statistical volume */}
            <div className="grid grid-cols-20 gap-1.5 w-fit">
              {Array.from({ length: 300 }).map((_, idx) => (
                <div 
                  key={idx} 
                  className={`size-2 rounded-full transition-colors duration-500 ${
                    idx < 255 
                      ? "bg-indigo-600 dark:bg-indigo-500 shadow-[0_0_8px_-1px_rgba(79,70,229,0.3)]" 
                      : "bg-zinc-200"
                  }`} 
                />
              ))}
            </div>
            
            <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none text-center lg:text-left mt-2">
              STARTUPS & REMOTE AGENCIES RUNNING ON TRAC AI
            </div>
          </div>

          {/* Right Column: Convergence stats & headline */}
          <div className="space-y-8 text-left">
            <div className="flex items-center gap-1.5 text-indigo-600 font-black uppercase tracking-widest text-[11px]">
              CONVERGENCE • POWERHOUSE
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight leading-none uppercase max-w-lg">
              Powering businesses of all sizes
            </h2>
            
            {/* Stat Row */}
            <div className="grid grid-cols-2 gap-8 pt-4 border-t border-zinc-100">
              <div className="space-y-1">
                <span className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-900 leading-none">85%</span>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block pt-1">of remote agencies report instant tool consolidation</p>
              </div>
              <div className="space-y-1">
                <span className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-900 leading-none">3M+</span>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block pt-1">operational tasks automated by AI agents monthly</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
