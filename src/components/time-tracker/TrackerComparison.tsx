'use client';

import React from 'react';
import { X, Check } from 'lucide-react';

export function TrackerComparison() {
  return (
    <section className="py-24 bg-muted/20 border-t-2 border-foreground">
      <div className="container mx-auto px-4">
         <div className="text-center mb-16">
           <h2 className="text-4xl sm:text-5xl font-black font-poppins uppercase leading-none mb-6">
              Stop <span className="text-red-500 line-through">Guessing.</span>
            </h2>
            <p className="text-xl font-mono text-muted-foreground">
              Manual timesheets are costing you thousands.
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            
            {/* The Old Way */}
            <div className="bg-background border-2 border-foreground p-8 opacity-75 grayscale hover:grayscale-0 transition-all duration-500">
                <div className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">/// The Old Way</div>
                <h3 className="text-3xl font-black font-poppins uppercase mb-8">Manual Entry</h3>
                
                <ul className="space-y-6">
                    <li className="flex items-start gap-4">
                        <div className="mt-1 min-w-[24px] h-6 rounded-full bg-red-100 border border-red-500 flex items-center justify-center text-red-600">
                            <X className="w-4 h-4" />
                        </div>
                        <div>
                            <strong className="block font-bold">Ghost Hours</strong>
                            <p className="text-sm text-muted-foreground">Employees rounding up hours ("8:00 - 5:00") regardless of actual work.</p>
                        </div>
                    </li>
                    <li className="flex items-start gap-4">
                        <div className="mt-1 min-w-[24px] h-6 rounded-full bg-red-100 border border-red-500 flex items-center justify-center text-red-600">
                            <X className="w-4 h-4" />
                        </div>
                         <div>
                            <strong className="block font-bold">Paid Distractions</strong>
                            <p className="text-sm text-muted-foreground">Paying for social media scrolling, YouTube, and "research".</p>
                        </div>
                    </li>
                    <li className="flex items-start gap-4">
                        <div className="mt-1 min-w-[24px] h-6 rounded-full bg-red-100 border border-red-500 flex items-center justify-center text-red-600">
                            <X className="w-4 h-4" />
                        </div>
                         <div>
                            <strong className="block font-bold">Zero Proof</strong>
                            <p className="text-sm text-muted-foreground">No way to verify if work was actually done during billed hours.</p>
                        </div>
                    </li>
                </ul>
            </div>

            {/* The Trac AI Way */}
            <div className="bg-background border-2 border-foreground p-8 shadow-[8px_8px_0px_0px_var(--primary)] relative">
                 <div className="absolute -top-3 -right-3 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 border-2 border-foreground uppercase tracking-wider transform rotate-3">
                    Efficient
                </div>
                <div className="font-mono text-xs font-bold uppercase tracking-widest text-primary mb-4">/// The New Way</div>
                <h3 className="text-3xl font-black font-poppins uppercase mb-8">Trac AI</h3>
                
                 <ul className="space-y-6">
                    <li className="flex items-start gap-4">
                        <div className="mt-1 min-w-[24px] h-6 rounded-full bg-green-100 border border-green-500 flex items-center justify-center text-green-600">
                            <Check className="w-4 h-4" />
                        </div>
                        <div>
                            <strong className="block font-bold">Precise Logs</strong>
                            <p className="text-sm text-muted-foreground">Exact start/stop times captured automatically. Seconds matter.</p>
                        </div>
                    </li>
                    <li className="flex items-start gap-4">
                        <div className="mt-1 min-w-[24px] h-6 rounded-full bg-green-100 border border-green-500 flex items-center justify-center text-green-600">
                            <Check className="w-4 h-4" />
                        </div>
                         <div>
                            <strong className="block font-bold">Auto-Pause on Idle</strong>
                            <p className="text-sm text-muted-foreground">If the mouse stops moving, the billing stops. Simple.</p>
                        </div>
                    </li>
                    <li className="flex items-start gap-4">
                        <div className="mt-1 min-w-[24px] h-6 rounded-full bg-green-100 border border-green-500 flex items-center justify-center text-green-600">
                            <Check className="w-4 h-4" />
                        </div>
                         <div>
                            <strong className="block font-bold">Visual Proof</strong>
                            <p className="text-sm text-muted-foreground">Randomized screenshots and activity levels act as your receipt.</p>
                        </div>
                    </li>
                </ul>
            </div>

        </div>
      </div>
    </section>
  );
}
