'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { PerformanceDial } from './PerformanceDial';

export const IntelligenceUnit = ({ velocity = 114 }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-[#f1f5f9] dark:bg-[#161619] rounded-[2.5rem] p-8 mb-16 flex flex-col md:flex-row items-center justify-between border border-gray-200/50 dark:border-white/5 relative overflow-hidden shadow-sm"
  >
    {/* Subtle Glow Background */}
    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2" />
    
    <div className="flex items-center space-x-8 relative z-10">
      <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 dark:border-white/5">
        <Sparkles className="w-7 h-7 text-blue-500" />
      </div>
      <div>
        <div className="flex items-center space-x-2 mb-1.5">
          <p className="text-[10px] font-black font-poppins text-blue-600 uppercase tracking-[0.25em]">Morning Performance Brief</p>
          <div className="w-1 h-1 rounded-full bg-blue-500/30" />
          <span className="text-[10px] font-bold font-poppins text-gray-400 uppercase tracking-widest">January 30, 2026</span>
          <div className="w-1 h-1 rounded-full bg-blue-500/30 ml-1" />
          <span className="text-[10px] font-black font-poppins text-emerald-500 uppercase tracking-widest">Status: Peak Flow</span>
        </div>
        <p className="text-gray-600 dark:text-gray-300 text-sm font-medium font-poppins leading-relaxed italic max-w-xl">
          "The organization is currently operating at {velocity}% velocity. High-impact deep work is peaking across core departments, while primary milestones remain on a 4-day early delivery trajectory."
        </p>
      </div>
    </div>
    
    <div className="flex items-center space-x-12 relative z-10 mt-8 md:mt-0">
      <div className="h-20 w-px bg-gray-200 dark:bg-gray-800 hidden lg:block" />
      <div className="scale-90 origin-center">
        <PerformanceDial value={velocity} />
      </div>
      <div className="hidden lg:flex flex-col items-end">
         <span className="text-[10px] font-black font-poppins text-gray-400 uppercase tracking-widest mb-2">Confidence Score</span>
         <div className="flex space-x-1">
            {[1, 1, 1, 1, 0.4].map((o, i) => (
              <motion.div 
                key={i} 
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: i * 0.1 }}
                className={`w-4 h-1 rounded-full origin-left ${o === 1 ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-800'}`} 
              />
            ))}
         </div>
      </div>
    </div>
  </motion.div>
);
