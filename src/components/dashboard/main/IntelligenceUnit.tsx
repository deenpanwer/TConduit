'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Sparkles } from 'lucide-react';
import { PerformanceDial } from './PerformanceDial';

interface IntelligenceUnitProps {
  velocity?: number;
  orgBrief?: any;
  topApp?: string;
  activeCount?: number;
}

export const IntelligenceUnit = ({ velocity = 100, orgBrief, topApp = "Primary Tools", activeCount = 0 }: IntelligenceUnitProps) => {
  const today = format(new Date(), "MMMM dd, yyyy");

  const getBriefText = () => {
    if (orgBrief) {
        const state = velocity >= 90 ? orgBrief.peakState : velocity >= 70 ? orgBrief.optimalState : orgBrief.standardState;
        return `"${state.replace('core development', topApp)} ${orgBrief.milestoneNote}"`;
    }
    
    return `"The organization is currently operating at ${velocity}% velocity with ${activeCount} active personnel. ${velocity >= 90 ? `High-impact deep work is peaking in ${topApp}.` : `Steady output maintained across ${topApp} workflows.`} Primary milestones remain on a healthy delivery trajectory."`;
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#f1f5f9] dark:bg-[#161619] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 mb-12 md:mb-16 flex flex-col lg:flex-row items-center justify-between border border-gray-200/50 dark:border-white/5 relative overflow-hidden shadow-sm gap-8 lg:gap-0"
    >
      {/* Subtle Glow Background */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2" />
      
      <div className="flex flex-col md:flex-row items-center md:items-start lg:items-center space-y-6 md:space-y-0 md:space-x-8 relative z-10 w-full lg:w-auto">
        <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 dark:border-white/5 shrink-0">
          <Sparkles className="w-7 h-7 text-blue-500" />
        </div>
        <div className="text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
            <p className="text-[9px] md:text-[10px] font-black font-poppins text-blue-600 uppercase tracking-[0.25em]">Organization Performance Brief</p>
            <div className="hidden md:block w-1 h-1 rounded-full bg-blue-500/30" />
            <span className="text-[9px] md:text-[10px] font-bold font-poppins text-gray-400 uppercase tracking-widest">{today}</span>
            <div className="hidden md:block w-1 h-1 rounded-full bg-blue-500/30" />
            <span className="text-[9px] md:text-[10px] font-black font-poppins text-emerald-500 uppercase tracking-widest">
              Status: {velocity >= 90 ? 'Peak Flow' : velocity >= 70 ? 'Optimal' : 'Standard'}
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-sm font-medium font-poppins leading-relaxed italic max-w-xl">
            {getBriefText()}
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