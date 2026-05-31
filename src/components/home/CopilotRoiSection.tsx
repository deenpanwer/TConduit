"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CopilotRoiSection() {
  return (
    <section className="py-24 bg-white text-zinc-900 border-t border-zinc-200 relative select-none">
      <div className="container mx-auto px-6 max-w-7xl relative z-10 space-y-16">
        
        {/* Header Block */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between text-left gap-8 max-w-6xl mx-auto">
          <div className="space-y-4 max-w-3xl">
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 leading-tight font-poppins">
              It's like adding a technical manager to every seat
            </h2>
            <p className="text-base sm:text-lg font-medium text-zinc-500 leading-relaxed max-w-2xl">
              Always helping your employees work three to four times more by automating tasks, streamlining documentation, and eliminating administrative overhead.
            </p>
          </div>
          <div className="shrink-0">
            <Link href="/pricing">
              <Button className="h-12 px-8 rounded-xl bg-black hover:bg-zinc-800 text-white font-extrabold uppercase tracking-widest text-xs transition-colors">
                Get started
              </Button>
            </Link>
          </div>
        </div>

        {/* ClickUp-Style Stat Matrix */}
        <div className="border-t border-zinc-200 pt-12 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-0 text-left">
            
            {/* Stat 1 */}
            <div className="flex flex-col justify-between min-h-[160px] lg:px-8 lg:first:pl-0 lg:border-r lg:border-zinc-200 last:border-r-0">
              <div className="space-y-2">
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block font-poppins">
                  PRODUCTIVITY
                </span>
                <h3 className="text-5xl font-black tracking-tight text-zinc-900 font-poppins leading-none">
                  3x - 4x
                </h3>
              </div>
              <p className="text-xs sm:text-[13px] font-medium text-zinc-500 leading-relaxed mt-4">
                TRAC AI's Super Copilot helps employees automate daily logs, structure work boards, and double output.
              </p>
            </div>

            {/* Stat 2 */}
            <div className="flex flex-col justify-between min-h-[160px] lg:px-8 lg:border-r lg:border-zinc-200 last:border-r-0">
              <div className="space-y-2">
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block font-poppins">
                  HOURS SAVED
                </span>
                <h3 className="text-5xl font-black tracking-tight text-zinc-900 font-poppins leading-none">
                  120 hrs
                </h3>
              </div>
              <p className="text-xs sm:text-[13px] font-medium text-zinc-500 leading-relaxed mt-4">
                AI-automated timesheets, meeting summaries, and daily diaries eliminate administrative overhead.
              </p>
            </div>

            {/* Stat 3 */}
            <div className="flex flex-col justify-between min-h-[160px] lg:px-8 lg:border-r lg:border-zinc-200 last:border-r-0">
              <div className="space-y-2">
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block font-poppins">
                  LEAD FINDER
                </span>
                <h3 className="text-5xl font-black tracking-tight text-zinc-900 font-poppins leading-none">
                  2.5x
                </h3>
              </div>
              <p className="text-xs sm:text-[13px] font-medium text-zinc-500 leading-relaxed mt-4">
                AI Lead Finder actively extracts verified warm business prospects, passing them directly to CRM sales funnels.
              </p>
            </div>

            {/* Stat 4 */}
            <div className="flex flex-col justify-between min-h-[160px] lg:px-8 lg:last:pr-0 lg:border-r lg:border-zinc-200 last:border-r-0">
              <div className="space-y-2">
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block font-poppins">
                  ONBOARDING
                </span>
                <h3 className="text-5xl font-black tracking-tight text-zinc-900 font-poppins leading-none">
                  Instant
                </h3>
              </div>
              <p className="text-xs sm:text-[13px] font-medium text-zinc-500 leading-relaxed mt-4">
                Remote contractors register their wallets, sign NDAs, and access workspaces in 1 click, bypassing IT friction.
              </p>
            </div>

          </div>
        </div>

        {/* Footnote */}
        <div className="text-left max-w-6xl mx-auto pt-4">
          <p className="text-[11px] font-medium text-zinc-400">
            *based on customer feedback and internal telemetry of TRAC AI remote deployments.{" "}
            <Link href="/general-resources/total-economic-impact-report-trac-ai" className="text-indigo-600 hover:underline font-bold">
              Get the study
            </Link>
          </p>
        </div>

      </div>
    </section>
  );
}
