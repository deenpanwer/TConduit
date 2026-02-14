"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Activity, Zap, BrainCircuit, Sparkles } from 'lucide-react';
import { GlassCard } from '../main/shared/GlassCard';
import { cn } from '@/lib/utils';

interface CognitiveHubProps {
  employee: any;
  intensity?: number;
  aiBrief?: string | null;
}

export function CognitiveHub({ employee, intensity = 0, aiBrief = null }: CognitiveHubProps) {
  const activeWindow = employee?.heartbeat?.lastActiveWindow || "Idle";
  const isOnline = employee?.heartbeat?.isCurrentlyRunning;

  const [displayedAiBrief, setDisplayedAiBrief] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Determine the raw text content without quotes
  const rawBrief = aiBrief || 
    `${employee?.name} is ${isOnline ? 'Active' : 'Offline'}. ${isOnline 
        ? `The telemetry indicates execution in ${activeWindow}.`
        : `No live telemetry signal detected. Staff member is currently offline.`
    }`;

  // 2. Atomic Typewriter Effect
  useEffect(() => {
    // Clear any existing timer to prevent overlapping loops
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    
    setDisplayedAiBrief('');
    setIsTypingComplete(false);

    let currentIndex = 0;
    const type = () => {
      if (currentIndex < rawBrief.length) {
        setDisplayedAiBrief(rawBrief.substring(0, currentIndex + 1));
        currentIndex++;
        typingTimerRef.current = setTimeout(type, 15); // Faster, smoother typing
      } else {
        setIsTypingComplete(true);
      }
    };

    type();

    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [rawBrief]); // Only re-run if the text content actually changes


  if (!employee) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-pulse">
        <div className="lg:col-span-2 h-[220px] bg-card border border-border rounded-[2.5rem] p-10" />
        <div className="h-[220px] bg-card border border-border rounded-[2.5rem] p-10" />
      </div>
    );
  }

  const visualIntensity = isOnline ? Math.max(intensity, 0.2) : 0;
  const focusStatus = visualIntensity > 1.2 ? "Hyper Focus" : visualIntensity > 0.7 ? "Optimal" : visualIntensity > 0.3 ? "Standard" : "Low Impact";
  const rhythmStatus = visualIntensity > 0.8 ? "High Velocity" : visualIntensity > 0.4 ? "Consistent" : "Fragmented";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* 70% Column: AI Insight Console */}
      <GlassCard className="lg:col-span-2 p-10 relative overflow-hidden" hoverEffect={false}>
        <div className="flex items-start space-x-6">
          <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
            <BrainCircuit className="w-6 h-6 text-blue-500" />
          </div>
          <div className="flex-1 space-y-4">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em]">AI Insight Summary</h3>
            <p className="text-lg md:text-xl font-medium font-poppins text-gray-900 dark:text-white leading-relaxed">
              "{displayedAiBrief}"
              {!isTypingComplete && <span className="inline-block w-1.5 h-5 ml-1 bg-blue-500 animate-pulse align-middle" />}
            </p>
            {isOnline && (
                <div className="flex items-center space-x-6 pt-4">
                <div className={cn(
                    "flex items-center space-x-2 text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-widest border",
                    visualIntensity > 0.7 ? "text-emerald-500 bg-emerald-500/5 border-emerald-500/10" : "text-amber-500 bg-orange-500/5 border-orange-500/10"
                )}>
                    <Sparkles size={12} />
                    <span>Focus: {focusStatus}</span>
                </div>
                <div className="flex items-center space-x-2 text-[10px] font-bold text-blue-500 bg-blue-500/5 px-3 py-1.5 rounded-lg uppercase tracking-widest border border-blue-500/10">
                    <Activity size={12} />
                    <span>Rhythm: {rhythmStatus}</span>
                </div>
                </div>
            )}
          </div>
        </div>
      </GlassCard>

      {/* 30% Column: Live Intensity Dial */}
      <GlassCard className="p-10 relative overflow-hidden flex flex-col justify-between" hoverEffect={false}>
         <div className="flex items-center justify-between mb-4">
             <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Live Tension</span>
             {isOnline && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />}
         </div>
         
         <div className="flex-1 flex items-center justify-center">
            <svg width="100%" height="60" viewBox="0 0 1000 60" className="overflow-visible">
              <motion.path
                d="M 0 30 Q 50 30, 100 30 T 200 30 T 300 30 T 400 30 T 500 30 T 600 30 T 700 30 T 800 30 T 900 30 T 1000 30"
                fill="none"
                stroke={isOnline ? "#3b82f6" : "#52525b"}
                strokeWidth="4"
                strokeLinecap="round"
                strokeOpacity={isOnline ? 1 : 0.2}
                animate={{
                  d: isOnline ? [
                    `M 0 30 Q 50 ${30 - (25*visualIntensity)}, 100 30 T 200 30 T 300 30 T 400 30 T 500 30 T 600 30 T 700 30 T 800 30 T 900 30 T 1000 30`,
                    `M 0 30 Q 50 ${30 + (25*visualIntensity)}, 100 30 T 200 30 T 300 30 T 400 30 T 500 30 T 600 30 T 700 30 T 800 30 T 900 30 T 1000 30`,
                    `M 0 30 Q 50 ${30 - (25*visualIntensity)}, 100 30 T 200 30 T 300 30 T 400 30 T 500 30 T 600 30 T 700 30 T 800 30 T 900 30 T 1000 30`,
                  ] : "M 0 30 Q 50 30, 100 30 T 200 30 T 300 30 T 400 30 T 500 30 T 600 30 T 700 30 T 800 30 T 900 30 T 1000 30"
                }}
                transition={{ repeat: Infinity, duration: isOnline ? 1.5 / Math.max(visualIntensity, 0.5) : 0, ease: "easeInOut" }}
              />
            </svg>
         </div>
         
         <div className="mt-4 flex items-center justify-between">
            <div className="flex flex-col">
                <span className="text-3xl font-black font-poppins text-gray-900 dark:text-white">
                    {isOnline ? (intensity * 70).toFixed(0) : "0"}%
                </span>
            </div>
            <Zap className={`w-5 h-5 ${isOnline ? 'text-blue-500' : 'text-gray-600'}`} />
         </div>
      </GlassCard>
    </div>
  );
}
