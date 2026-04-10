'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
  hoverEffect?: boolean;
}

export const GlassCard = ({ 
  children, 
  className = "", 
  elevated = false,
  hoverEffect = true
}: GlassCardProps) => (
  <motion.div 
    whileHover={hoverEffect ? { y: -4, transition: { type: "spring", stiffness: 400, damping: 25 } } : {}}
    className={`
      rounded-[2.5rem] transition-all duration-700 relative overflow-hidden
      ${elevated 
        ? 'bg-white dark:bg-[#111113] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.08)] dark:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.4)] border border-white/60 dark:border-white/5' 
        : 'bg-[#fcfdfe] dark:bg-[#0c0c0e] border border-gray-100 dark:border-gray-800/40'}
      ${className}
    `}
  >
    {/* Subtle Inner Glow */}
    <div className="absolute inset-0 rounded-[2.5rem] border border-white/20 pointer-events-none" />
    {children}
  </motion.div>
);
