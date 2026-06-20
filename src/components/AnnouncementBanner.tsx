"use client";

import React, { useEffect, useState } from "react";
import { X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ANNOUNCEMENT_KEY = "trac-website-announcement-dismissed-v4";

export function AnnouncementBanner() {
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
    const dismissed = localStorage.getItem(ANNOUNCEMENT_KEY) === "true";
    if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(ANNOUNCEMENT_KEY, "true");
    setIsVisible(false);
  };

  if (!mounted || !isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="fixed bottom-24 right-4 md:bottom-6 md:right-6 w-[360px] max-w-[calc(100vw-2rem)] bg-white dark:bg-zinc-900 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.8)] p-4 rounded-xl z-50 select-none"
      >
        {/* Banner Header */}
        <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[9px] font-black tracking-widest text-white uppercase bg-blue-600 px-2 py-0.5 rounded border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              <Sparkles className="size-2.5 fill-white stroke-[2]" />
              New
            </span>
            <h4 className="text-xs font-black tracking-wider text-black dark:text-zinc-100 uppercase">
              What's New in TRAC AI
            </h4>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 rounded bg-white hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-black dark:border-zinc-700 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] text-black dark:text-white transition-all cursor-pointer"
            aria-label="Dismiss Announcement"
          >
            <X className="size-3.5 stroke-[3]" />
          </button>
        </div>

        {/* Banner Content */}
        <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 leading-relaxed">
          We've optimized our core <span className="text-blue-600 dark:text-blue-400 font-extrabold underline decoration-2 decoration-blue-600 dark:decoration-blue-400">authentication handshake protocols</span> and integrated advanced <span className="text-blue-600 dark:text-blue-400 font-extrabold underline decoration-2 decoration-blue-600 dark:decoration-blue-400">client-side session caching</span> for seamless resilience, alongside a secure new <span className="text-blue-600 dark:text-blue-400 font-extrabold underline decoration-2 decoration-blue-600 dark:decoration-blue-400">manager invitation flow</span>.
        </p>
      </motion.div>
    </AnimatePresence>
  );
}
