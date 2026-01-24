'use client';

import React from 'react';
import { UserPlus, Download, BarChart3, ChevronRight } from 'lucide-react';

export function TrackerHowItWorks() {
  const steps = [
    {
      id: "01",
      title: "INITIATE_INVITE",
      desc: "Send magic link to employees.",
      cmd: "> send_invite --email all"
    },
    {
      id: "02",
      title: "INSTALL_AGENT",
      desc: "Silent background installation.",
      cmd: "> install --silent --bg"
    },
    {
      id: "03",
      title: "RECEIVE_DATA",
      desc: "Live feed established.",
      cmd: "> stream --live --quality high"
    }
  ];

  return (
    <section className="py-32 bg-muted/30 border-t-2 border-foreground">
      <div className="container mx-auto px-4">
        <div className="relative mb-16 flex flex-col items-center">
            <h2 className="text-4xl sm:text-6xl font-black font-poppins uppercase leading-none text-center">
                Execution <br/> Protocol
            </h2>
            <div className="md:absolute md:bottom-0 md:right-0 font-mono text-sm font-bold uppercase tracking-widest text-muted-foreground text-center md:text-right mt-6 md:mt-0">
                /// System Workflow
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {steps.map((step, i) => (
                <div key={i} className="relative group">
                    <div className="bg-background border-2 border-foreground p-6 h-full flex flex-col justify-between shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] transition-all duration-200">
                        <div>
                            <div className="flex justify-between items-start mb-6">
                                <span className="font-mono text-4xl font-bold text-muted-foreground/30 group-hover:text-primary transition-colors">
                                    {step.id}
                                </span>
                                <div className="h-2 w-2 bg-foreground rounded-full animate-pulse" />
                            </div>
                            <h3 className="text-xl font-bold font-mono uppercase mb-2 tracking-tight">
                                {step.title}
                            </h3>
                            <p className="text-muted-foreground font-medium mb-6">
                                {step.desc}
                            </p>
                        </div>
                        
                        <div className="bg-black text-green-400 p-3 font-mono text-xs rounded-sm overflow-hidden">
                            <span className="mr-2 opacity-50">$</span>
                            <span className="typing-effect">{step.cmd}</span>
                            <span className="animate-pulse ml-1">_</span>
                        </div>
                    </div>
                    {i < steps.length - 1 && (
                        <div className="hidden lg:block absolute top-1/2 -right-6 transform -translate-y-1/2 z-10">
                            <ChevronRight className="w-8 h-8 text-foreground/20" />
                        </div>
                    )}
                </div>
            ))}
        </div>
      </div>
    </section>
  );
}