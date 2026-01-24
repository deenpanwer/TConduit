'use client';

import React from 'react';
import { DollarSign, Zap, Smartphone, Clock, AlertTriangle, Eye, TrendingUp, Sparkles } from 'lucide-react';

export function TrackerFeatures() {
  return (
    <section className="py-32 bg-background relative border-t-2 border-foreground">
      <div className="container mx-auto px-4">
        
        {/* Pain Point Banner */}
        <div className="mb-24 relative">
          <div className="absolute -inset-1 bg-green-500 blur opacity-20" />
          <div className="relative bg-background border-2 border-green-500 p-8 md:p-12 text-center max-w-4xl mx-auto shadow-[8px_8px_0px_0px_rgba(34,197,94,1)]">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 text-green-600 rounded-full mb-6 border-2 border-green-500">
                <TrendingUp className="w-6 h-6" />
            </div>
            <h2 className="text-3xl sm:text-5xl font-black font-poppins uppercase leading-none mb-4">
              Unlock Hidden Productivity.
            </h2>
            <p className="text-xl sm:text-2xl font-mono text-muted-foreground">
              Reduce idle hours and increase workforce output by <span className="bg-green-500 text-white px-2 py-0.5">20-30%</span> instantly.
            </p>
          </div>
        </div>

        {/* Feature Grid (Bento Style) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="group bg-background border-2 border-foreground p-8 relative overflow-hidden hover:-translate-y-1 transition-transform duration-300">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Zap className="w-24 h-24 rotate-12" />
            </div>
            <div className="relative z-10">
                <div className="w-12 h-12 bg-foreground text-background flex items-center justify-center mb-6 font-mono font-bold text-xl">01</div>
                <h3 className="text-2xl font-black font-poppins uppercase mb-4">AI-Enhanced Time Logging</h3>
                <p className="text-muted-foreground font-medium leading-relaxed">
                Precise, AI-driven recording that pauses when they do. Pay only for actual work, not "research" breaks.
                </p>
            </div>
          </div>

          <div className="group bg-primary border-2 border-foreground p-8 relative overflow-hidden hover:-translate-y-1 transition-transform duration-300 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-primary-foreground">
                <Smartphone className="w-24 h-24" />
            </div>
            <div className="relative z-10 text-primary-foreground">
                <div className="w-12 h-12 bg-background text-foreground flex items-center justify-center mb-6 font-mono font-bold text-xl">02</div>
                <h3 className="text-2xl font-black font-poppins uppercase mb-4">Mobile Command Center</h3>
                <p className="font-medium leading-relaxed opacity-90">
                The ultimate pocket monitor. View active screens, apps, and productivity levels directly from your phone.
                </p>
            </div>
          </div>

          <div className="group bg-background border-2 border-foreground p-8 relative overflow-hidden hover:-translate-y-1 transition-transform duration-300">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Sparkles className="w-24 h-24 -rotate-12" />
            </div>
            <div className="relative z-10">
                <div className="w-12 h-12 bg-foreground text-background flex items-center justify-center mb-6 font-mono font-bold text-xl">03</div>
                <h3 className="text-2xl font-black font-poppins uppercase mb-4">AI Workforce Insights</h3>
                <p className="text-muted-foreground font-medium leading-relaxed">
                Go beyond timesheets. Get automated AI summaries of daily output, focus trends, and productivity scores.
                </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}