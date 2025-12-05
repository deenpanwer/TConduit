"use client";

import React from "react";
import { motion } from "framer-motion";

interface ScoreMeterProps {
  label: string;
  score: number; // Expected to be between 0 and 100
  colorClass?: string; // Tailwind CSS color class, e.g., "text-blue-500"
}

const ScoreMeter: React.FC<ScoreMeterProps> = ({ label, score, colorClass = "text-blue-500" }) => {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center p-4">
      <h4 className="text-lg font-semibold mb-2 text-white">{label}</h4>
      <div className="relative w-32 h-32">
        <svg className="w-full h-full" viewBox="0 0 120 120">
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="10"
          />
          {/* Animated score circle */}
          <motion.circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="currentColor" // Will pick up color from colorClass
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={circumference} // Start full
            strokeLinecap="round"
            transform="rotate(-90 60 60)" // Start from the top
            variants={{
              hidden: { strokeDashoffset: circumference },
              visible: { strokeDashoffset: strokeDashoffset },
            }}
            initial="hidden"
            animate="visible"
            transition={{ duration: 1.5, ease: "easeOut" }}
            className={colorClass}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            className="text-3xl font-bold text-white"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            {score.toFixed(0)}%
          </motion.span>
        </div>
      </div>
    </div>
  );
};

export default ScoreMeter;
