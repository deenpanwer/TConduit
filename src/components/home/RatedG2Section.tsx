"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const ROW_1_IMAGES = [
  "/g2/g2-best-software-2026-agentic-ai-products.webp",
  "/g2/g2-best-software-2026-ai-products.webp",
  "/g2/g2-best-software-2026-content-management-systems.webp",
  "/g2/g2-best-software-2026-development-products.webp",
  "/g2/g2-best-software-2026-global-software-companies.webp",
  "/g2/g2-best-software-2026-hr-software-products.webp",
];

const ROW_2_IMAGES = [
  "/g2/g2-best-software-2026-it-management-products.webp",
  "/g2/g2-best-software-2026-project-management-products.webp",
  "/g2/g2-best-software-2026-software.webp",
  "/g2/g2-winter-2026-high-performer-enterprise.webp",
  "/g2/g2-winter-2026-leader.webp",
  "/g2/g2-winter-2026-momentum-leader.webp",
];

const ROW_3_IMAGES = [
  "/g2/g2-best-software-2026-content-management-systems.webp",
  "/g2/g2-best-software-2026-development-products.webp",
  "/g2/g2-best-software-2026-global-software-companies.webp",
  "/g2/g2-best-software-2026-hr-software-products.webp",
  "/g2/g2-best-software-2026-agentic-ai-products.webp",
  "/g2/g2-best-software-2026-ai-products.webp",
];

const ROW_4_IMAGES = [
  "/g2/g2-winter-2026-leader.webp",
  "/g2/g2-winter-2026-momentum-leader.webp",
  "/g2/g2-best-software-2026-it-management-products.webp",
  "/g2/g2-best-software-2026-project-management-products.webp",
  "/g2/g2-best-software-2026-software.webp",
  "/g2/g2-winter-2026-high-performer-enterprise.webp",
];


export function RatedG2Section() {
  return (
    <section className="py-24 bg-white dark:bg-[#050505] text-zinc-900 dark:text-zinc-100 overflow-hidden relative border-t border-zinc-100 dark:border-zinc-800/80">
      {/* Dynamic encapsulated marquee styles */}
      <style>{`
        @keyframes marquee-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-right {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .animate-marquee-left {
          animation: marquee-left 40s linear infinite;
        }
        .animate-marquee-right {
          animation: marquee-right 40s linear infinite;
        }
        .animate-marquee-left:hover, .animate-marquee-right:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Indigo text and clean modern CTA */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <div className="text-indigo-600 dark:text-indigo-400 font-extrabold uppercase tracking-widest text-[11px]">
              RATED 4.7/5 BY 10,000+ USERS ON G2
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-zinc-900 dark:text-white tracking-tight leading-tight">
              #1 most referenced company on G2 reports
            </h2>
            <div className="pt-2">
              <Link href="/reviews">
                <Button className="h-12 px-8 rounded-xl bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-semibold text-sm transition-colors shadow-sm">
                  Read customer stories
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Column: Horizontal marquees of G2 badges */}
          <div className="lg:col-span-7 h-[480px] relative overflow-hidden flex flex-col justify-center gap-4 py-2">
            {/* Overlay mask gradients for smooth fade out at all sides */}
            <div className="absolute inset-0 pointer-events-none z-20">
              {/* Left fade */}
              <div className="absolute top-0 left-0 bottom-0 w-24 bg-gradient-to-r from-white via-white/80 to-transparent dark:from-[#050505] dark:via-[#050505]/80" />
              {/* Right fade */}
              <div className="absolute top-0 right-0 bottom-0 w-24 bg-gradient-to-l from-white via-white/80 to-transparent dark:from-[#050505] dark:via-[#050505]/80" />
              {/* Top fade */}
              <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-white to-transparent dark:from-[#050505]" />
              {/* Bottom fade */}
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent dark:from-[#050505]" />
            </div>

            {/* Row 1: Scrolls Left */}
            <div className="w-full overflow-hidden flex items-center">
              <div className="flex w-max gap-2 animate-marquee-left">
                {[...ROW_1_IMAGES, ...ROW_1_IMAGES].map((imgSrc, idx) => (
                  <img 
                    key={`row1-${idx}`} 
                    src={imgSrc} 
                    alt="G2 Badge"
                    className="h-24 w-auto object-contain flex-shrink-0 select-none pointer-events-none mx-4"
                  />
                ))}
              </div>
            </div>

            {/* Row 2: Scrolls Right */}
            <div className="w-full overflow-hidden flex items-center">
              <div className="flex w-max gap-2 animate-marquee-right">
                {[...ROW_2_IMAGES, ...ROW_2_IMAGES].map((imgSrc, idx) => (
                  <img 
                    key={`row2-${idx}`} 
                    src={imgSrc} 
                    alt="G2 Badge"
                    className="h-24 w-auto object-contain flex-shrink-0 select-none pointer-events-none mx-4"
                  />
                ))}
              </div>
            </div>

            {/* Row 3: Scrolls Left */}
            <div className="w-full overflow-hidden flex items-center">
              <div className="flex w-max gap-2 animate-marquee-left">
                {[...ROW_3_IMAGES, ...ROW_3_IMAGES].map((imgSrc, idx) => (
                  <img 
                    key={`row3-${idx}`} 
                    src={imgSrc} 
                    alt="G2 Badge"
                    className="h-24 w-auto object-contain flex-shrink-0 select-none pointer-events-none mx-4"
                  />
                ))}
              </div>
            </div>

            {/* Row 4: Scrolls Right */}
            <div className="w-full overflow-hidden flex items-center">
              <div className="flex w-max gap-2 animate-marquee-right">
                {[...ROW_4_IMAGES, ...ROW_4_IMAGES].map((imgSrc, idx) => (
                  <img 
                    key={`row4-${idx}`} 
                    src={imgSrc} 
                    alt="G2 Badge"
                    className="h-24 w-auto object-contain flex-shrink-0 select-none pointer-events-none mx-4"
                  />
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
