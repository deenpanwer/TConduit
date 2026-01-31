"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Activity, Zap, BrainCircuit } from 'lucide-react';
import { GlassCard } from '../main/shared/GlassCard';

interface CognitiveHubProps {
  employee: any;
  intensity?: number;
}

export function CognitiveHub({ employee, intensity = 0 }: CognitiveHubProps) {
  // Mock AI text for now - in production this would come from an analysis prop
  const activeWindow = employee?.heartbeat?.lastActiveWindow || "Idle";
  const isOnline = employee?.heartbeat?.isCurrentlyRunning;

  if (!employee) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-pulse">
        <div className="lg:col-span-2 h-[220px] bg-card border border-border rounded-[2.5rem] p-10" />
        <div className="h-[220px] bg-card border border-border rounded-[2.5rem] p-10" />
      </div>
    );
  }

  // Visual Logic: If online but no data yet, show a "breathing" pulse (0.2). 
  // If offline, flatline (0).
  const visualIntensity = isOnline ? Math.max(intensity, 0.2) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* 70% Column: AI Insight Console */}
      <GlassCard className="lg:col-span-2 p-10 relative overflow-hidden" hoverEffect={false}>
        <div className="flex items-start space-x-6">
          <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
            <BrainCircuit className="w-6 h-6 text-blue-500" />
          </div>
          <div className="flex-1 space-y-4">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em]">Cognitive Audit Protocol</h3>
            <p className="text-lg md:text-xl font-medium font-poppins text-gray-900 dark:text-white leading-relaxed">
              "{employee?.name} is <span className="text-blue-500 font-black">{isOnline ? 'Active' : 'Offline'}</span>. 
              {isOnline 
                ? <span> The telemetry indicates execution in <span className="italic border-b border-gray-300 dark:border-gray-700">{activeWindow}</span>.</span>
                : <span> No live telemetry signal detected. Node is currently disconnected from the neural grid.</span>
              }
            </p>
            {isOnline && (
                <div className="flex items-center space-x-6 pt-4">
                <div className="flex items-center space-x-2 text-[10px] font-bold text-emerald-500 bg-emerald-500/5 px-3 py-1.5 rounded-lg uppercase tracking-widest border border-emerald-500/10">
                    <Sparkles size={12} />
                    <span>Focus: Optimal</span>
                </div>
                <div className="flex items-center space-x-2 text-[10px] font-bold text-blue-500 bg-blue-500/5 px-3 py-1.5 rounded-lg uppercase tracking-widest border border-blue-500/10">
                    <Activity size={12} />
                    <span>Rhythm: Consistent</span>
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
                <span className="text-3xl font-black font-poppins text-gray-900 dark:text-white">{(visualIntensity * 100).toFixed(0)}%</span>
            </div>
            <Zap className={`w-5 h-5 ${isOnline ? 'text-blue-500' : 'text-gray-600'}`} />
         </div>
      </GlassCard>
    </div>
  );
}
