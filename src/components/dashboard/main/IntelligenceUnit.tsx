'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Sparkles } from 'lucide-react';
import { PerformanceDial } from './PerformanceDial';

interface IntelligenceUnitProps {
  velocity?: number;
  topApp?: string;
  activeCount?: number;
  totalHoursToday?: string | number;
}

export const IntelligenceUnit = ({ 
  velocity = 100, 
  topApp = "Primary Tools", 
  activeCount = 0,
  totalHoursToday = "0.0"
}: IntelligenceUnitProps) => {
  const today = format(new Date(), "MMMM dd, yyyy");
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [displayedText, setDisplayedText] = useState("");
  const [isTypingComplete, setIsTypingComplete] = useState(false);

  const briefText = useMemo(() => {
    const status = velocity >= 90 ? 'Peak Flow' : velocity >= 70 ? 'Optimal' : 'Standard';
    
    const intensityObservation = velocity >= 90 
        ? `The organization is currently exhibiting elite-level performance, operating at ${velocity}% velocity.` 
        : velocity >= 70 
            ? `The organization maintains strong operational momentum at ${velocity}% velocity.` 
            : `The organization is operating at a stable ${velocity}% velocity baseline.`;

    const workforceObservation = activeCount > 0 
        ? `With ${activeCount} personnel currently active, we've recorded ${totalHoursToday} hours of verified production today.`
        : `All personnel are currently standby, with a total of ${totalHoursToday} hours recorded for the current cycle.`;

    const toolObservation = `Workflows are heavily concentrated in ${topApp}, showing consistent engagement patterns.`;
    
    const outlook = velocity >= 80 
        ? "Primary milestones remain ahead of schedule on a superior delivery trajectory."
        : "Operational health remains nominal with all primary milestones on a healthy trajectory.";

    return `${intensityObservation} ${workforceObservation} ${toolObservation} ${outlook}`;
  }, [velocity, topApp, activeCount, totalHoursToday]);

  // Atomic Typewriter Effect
  useEffect(() => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    
    setDisplayedText('');
    setIsTypingComplete(false);

    let currentIndex = 0;
    const type = () => {
      if (currentIndex < briefText.length) {
        setDisplayedText(briefText.substring(0, currentIndex + 1));
        currentIndex++;
        typingTimerRef.current = setTimeout(type, 10); // Fast typing for long text
      } else {
        setIsTypingComplete(true);
      }
    };

    type();

    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [briefText]);

  const status = velocity >= 90 ? 'Peak Flow' : velocity >= 70 ? 'Optimal' : 'Standard';
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#f1f5f9] dark:bg-[#161619] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 mb-12 md:mb-16 flex flex-col lg:flex-row items-center justify-between border border-gray-200/50 dark:border-white/5 relative overflow-hidden shadow-sm gap-8 lg:gap-0"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2" />
      
      <div className="flex flex-col md:flex-row items-center md:items-start lg:items-center space-y-6 md:space-y-0 md:space-x-8 relative z-10 w-full lg:w-auto">
        <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 dark:border-white/5 shrink-0">
          <Sparkles className="w-7 h-7 text-blue-500" />
        </div>
        <div className="text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
            <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.25em] text-blue-600">Organization Performance Brief</p>
            <div className="hidden md:block w-1 h-1 rounded-full bg-blue-500/30" />
            <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">{today}</span>
            <div className="hidden md:block w-1 h-1 rounded-full bg-blue-500/30" />
            <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest ${
                velocity >= 90 ? 'text-emerald-500' : velocity >= 70 ? 'text-blue-500' : 'text-orange-500'
            }`}>
              Status: {status}
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-sm font-medium leading-relaxed italic max-w-2xl min-h-[4rem]">
            "{displayedText}"
            {!isTypingComplete && <span className="inline-block w-1 h-4 ml-1 bg-blue-500 animate-pulse" />}
          </p>
        </div>
      </div>
    
      <div className="flex flex-col sm:flex-row items-center space-y-6 sm:space-y-0 sm:space-x-12 relative z-10 w-full lg:w-auto justify-center lg:justify-end">
        <div className="h-20 w-px bg-gray-200 dark:bg-gray-800 hidden lg:block" />
        <div className="scale-75 md:scale-90 origin-center">
          <PerformanceDial value={velocity} />
        </div>
      </div>
    </motion.div>
  );
};