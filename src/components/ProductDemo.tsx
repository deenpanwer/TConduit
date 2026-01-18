"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function ProductDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  // Intersection Observer for Lazy Loading Video Source
  useEffect(() => {
    const observer = new IntersectionObserver(
        (entries) => {
            if (entries[0].isIntersecting) {
                setShouldLoad(true);
                observer.disconnect();
            }
        },
        { rootMargin: "200px" } // Load when within 200px
    );
    
    if (containerRef.current) {
        observer.observe(containerRef.current);
    }
    
    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative w-full py-24 overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className={cn(
            "relative w-full max-w-5xl mx-auto aspect-video md:aspect-auto md:h-[600px] overflow-hidden shadow-2xl border border-white/10 ring-1 ring-black/5 bg-black rounded-3xl"
          )}
        >
          {shouldLoad ? (
             <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/VzTIcM539H0?rel=0" 
                title="Product Demo"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
            ></iframe>
          ) : (
            // Placeholder while waiting for lazy load
             <div className="w-full h-full bg-black flex items-center justify-center">
                 <div className="text-white/30 text-sm">Loading Demo...</div>
             </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
