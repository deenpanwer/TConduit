'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface PerformanceDialProps {
  value?: number;
  label?: string;
  size?: number;
}

export const PerformanceDial = ({ value = 114, label = "Output Speed", size = 176 }: PerformanceDialProps) => {
  const radius = (size / 2) - 12;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * (Math.min(value, 150) / 150));

  // Dynamic Theme Colors based on Velocity
  const dialColor = value >= 90 ? "#10b981" : value >= 70 ? "#3b82f6" : "#f59e0b";

  return (
    <div className="relative flex items-center justify-center group" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90 overflow-visible">
        {/* Ambient Pulse (Reverted to Ping but stronger) */}
        <circle
          cx={size/2} cy={size/2} r={radius + 8}
          fill="none"
          stroke={dialColor}
          strokeWidth="3"
          className="opacity-20 animate-ping"
        />
        {/* Track */}
        <circle
          cx={size/2} cy={size/2} r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="14"
          className="text-gray-100 dark:text-gray-800/50"
        />
        {/* Progress */}
        <motion.circle
          cx={size/2} cy={size/2} r={radius}
          fill="none"
          stroke={dialColor}
          strokeWidth="14"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 2, ease: "circOut" }}
          strokeLinecap="round"
        />
        
        {/* Core Intensity Wave (Mapped to Velocity) */}
        <foreignObject x={size/4} y={size/4} width={size/2} height={size/2}>
          <div className="flex items-center justify-center h-full w-full rotate-90">
             <div className="flex items-end space-x-0.5 h-8">
                {[0.4, 0.7, 0.5, 0.9, 0.6, 0.8].map((h, i) => (
                  <motion.div 
                    key={i}
                    animate={{ height: [`${h*100}%`, `${(1-h)*100}%`, `${h*100}%`] }}
                    transition={{ 
                        repeat: Infinity, 
                        duration: (0.6 + (i * 0.1)) * (100 / Math.max(value, 50)), // Speed scales with value
                        ease: "easeInOut" 
                    }}
                    className="w-1 rounded-full"
                    style={{ backgroundColor: dialColor, opacity: 0.6 }}
                  />
                ))}
             </div>
          </div>
        </foreignObject>
      </svg>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black font-poppins text-gray-900 dark:text-white tracking-tighter-custom" style={{ color: dialColor }}>{value}%</span>
        <span className="text-[9px] font-black font-poppins text-gray-400 uppercase tracking-widest mt-1">{label}</span>
      </div>
    </div>
  );
};
