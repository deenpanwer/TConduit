"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function EmployeeRoiSection() {
  return (
    <section className="py-24 bg-white text-zinc-900 border-t border-zinc-200 relative select-none">
      <div className="container mx-auto px-6 max-w-7xl relative z-10 space-y-16">
        
        {/* Header Block */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between text-left gap-8 max-w-6xl mx-auto">
          <div className="space-y-4 max-w-3xl">
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 leading-tight font-poppins">
              It's like adding 15 full-time employees
            </h2>
            <p className="text-base sm:text-lg font-medium text-zinc-500 leading-relaxed max-w-2xl">
              According to third party research TRAC AI saves the average company over 30k hours per year, and delivers industry-leading ROI.
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
                  ROI
                </span>
                <h3 className="text-5xl font-black tracking-tight text-zinc-900 font-poppins leading-none">
                  384%
                </h3>
              </div>
              <p className="text-xs sm:text-[13px] font-medium text-zinc-500 leading-relaxed mt-4">
                TRAC AI delivered 384% ROI over three years, helping organizations unlock significant efficiency gains.
              </p>
            </div>

            {/* Stat 2 */}
            <div className="flex flex-col justify-between min-h-[160px] lg:px-8 lg:border-r lg:border-zinc-200 last:border-r-0">
              <div className="space-y-2">
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block font-poppins">
                  REVENUE INCREASE
                </span>
                <h3 className="text-5xl font-black tracking-tight text-zinc-900 font-poppins leading-none">
                  $3.9M
                </h3>
              </div>
              <p className="text-xs sm:text-[13px] font-medium text-zinc-500 leading-relaxed mt-4">
                TRAC AI projects drove $3.9M in revenue gains by streamlining work, consolidating tools, and scaling faster.
              </p>
            </div>

            {/* Stat 3 */}
            <div className="flex flex-col justify-between min-h-[160px] lg:px-8 lg:border-r lg:border-zinc-200 last:border-r-0">
              <div className="space-y-2">
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block font-poppins">
                  HOURS SAVED
                </span>
                <h3 className="text-5xl font-black tracking-tight text-zinc-900 font-poppins leading-none">
                  92,400
                </h3>
              </div>
              <p className="text-xs sm:text-[13px] font-medium text-zinc-500 leading-relaxed mt-4">
                Organizations saved 92,400 hours with TRAC AI, reducing manual work and recapturing productivity at scale.
              </p>
            </div>

            {/* Stat 4 */}
            <div className="flex flex-col justify-between min-h-[160px] lg:px-8 lg:last:pr-0 lg:border-r lg:border-zinc-200 last:border-r-0">
              <div className="space-y-2">
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block font-poppins">
                  PAYBACK
                </span>
                <h3 className="text-5xl font-black tracking-tight text-zinc-900 font-poppins leading-none">
                  &lt; 6 mo
                </h3>
              </div>
              <p className="text-xs sm:text-[13px] font-medium text-zinc-500 leading-relaxed mt-4">
                Customers reached payback in under six months, making TRAC AI a proven investment with rapid returns.
              </p>
            </div>

          </div>
        </div>

        {/* Footnote */}
        <div className="text-left max-w-6xl mx-auto pt-4">
          <p className="text-[11px] font-medium text-zinc-400">
            *from the 2025 Total Economic Impact™ of TRAC AI report by Veritas Independent Consulting.{" "}
            <Link href="/general-resources/total-economic-impact-report-trac-ai" className="text-indigo-600 hover:underline font-bold">
              Get the report
            </Link>
          </p>
        </div>

      </div>
    </section>
  );
}
