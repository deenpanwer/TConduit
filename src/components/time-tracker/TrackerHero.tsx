'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, CheckSquare, Terminal, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface TrackerHeroProps {
  onBookDemo: () => void;
  whatsappNumber?: string;
}

export function TrackerHero({ onBookDemo, whatsappNumber = "923178005465" }: TrackerHeroProps) {
  const whatsappUrl = `https://wa.me/${whatsappNumber}`;

  return (
    <section className="relative pt-40 pb-20 lg:pt-56 lg:pb-32 overflow-hidden bg-background">
      {/* Neo-Brutalist Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_-30%,hsl(var(--primary)/0.15),transparent)] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-end gap-16">
          
          {/* Typography / Content */}
          <div className="flex-1 max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="inline-flex items-center gap-2 border-2 border-foreground px-3 py-1 rounded-full bg-background mb-8 shadow-[4px_4px_0px_0px_currentColor]">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider">Status: Online</span>
              </div>
              
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black font-poppins leading-[1.1] tracking-tighter uppercase mb-8">
                Employee <br />
                Time Tracking <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-pink-500 animate-pulse">Software.</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl leading-relaxed mb-10 border-l-4 border-primary pl-6">
                <span className="text-foreground font-bold">The best way to ensure every billed hour is a productive hour.</span> <br className="hidden sm:block" />
                <span className="text-foreground/90">AI-powered logging and live streams. Pay only for true work.</span>
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Button 
                  size="lg" 
                  onClick={() => {
                    if (typeof window !== 'undefined' && (window as any).gtag_report_conversion) {
                      (window as any).gtag_report_conversion();
                    }
                    onBookDemo();
                  }} 
                  className="h-14 px-8 text-lg font-black uppercase tracking-wider border-2 border-foreground bg-primary text-primary-foreground rounded-none hover:translate-x-1 hover:-translate-y-1 hover:shadow-[-4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[-4px_4px_0px_0px_rgba(255,255,255,1)] transition-all"
                >
                  <Play className="mr-2 h-5 w-5 fill-current" />
                  Book a Strategy Call
                </Button>
                <a 
                  href={whatsappUrl}
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={() => {
                    if (typeof window !== 'undefined' && (window as any).gtag_report_conversion) {
                      (window as any).gtag_report_conversion();
                    }
                  }}
                  className="group inline-flex items-center justify-center whitespace-nowrap text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-14 px-8 text-lg font-black uppercase tracking-wider border-2 border-foreground bg-background text-foreground rounded-none hover:bg-foreground hover:text-background transition-colors"
                >
                    <img 
                      src="/whatsapp-black.svg" 
                      alt="WhatsApp" 
                      className="mr-2 h-5 w-5 transition-all filter invert-0 group-hover:invert dark:invert dark:group-hover:invert-0" 
                    />
                    Chat on WhatsApp
                </a>
              </div>

              <div className="flex flex-wrap gap-4 sm:gap-8 text-xs font-mono font-bold uppercase tracking-widest text-primary">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" /> No Credit Card
                </div>
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" /> Cancel Anytime
                </div>
                 <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4" /> AI Enabled
                </div>
                 <div className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" /> 14-Day Free Trial
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" /> Super Fast Integration
                </div>
              </div>
            </motion.div>
          </div>

          {/* Raw Schematic Visual */}
          <div className="flex-1 w-full lg:max-w-[500px]">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2, ease: "backOut" }}
                className="relative aspect-square"
            >
                {/* Main Dashboard Container */}
                <div className="absolute inset-0 bg-background border-2 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] p-4 flex flex-col gap-4">
                    {/* Fake Browser Header */}
                    <div className="h-8 border-b-2 border-foreground flex items-center justify-between px-2">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 bg-foreground rounded-full" />
                            <div className="w-3 h-3 border border-foreground rounded-full" />
                        </div>
                        <div className="font-mono text-[10px] uppercase">trac_ai_monitor.exe</div>
                    </div>

                    {/* Dashboard Content */}
                    <div className="flex-1 grid grid-cols-2 gap-4">
                        <div className="bg-muted border border-foreground/20 p-3 flex flex-col justify-between relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-1">
                                <span className="text-[8px] font-bold bg-primary text-primary-foreground px-1 uppercase">AI Score</span>
                            </div>
                            <Terminal className="w-6 h-6 text-primary" />
                            <div>
                                <div className="text-3xl font-black font-mono">98%</div>
                                <div className="text-[10px] font-bold uppercase text-muted-foreground">Productivity</div>
                            </div>
                        </div>
                        <div className="bg-muted border border-foreground/20 p-3 relative overflow-hidden">
                            <div className="absolute inset-0 flex items-center justify-center opacity-10">
                                <div className="w-20 h-20 border-4 border-foreground rounded-full animate-spin" style={{ animationDuration: '3s' }} />
                            </div>
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                                <div>
                                    <div className="text-xl font-black font-mono">LIVE</div>
                                    <div className="text-[10px] font-bold uppercase text-muted-foreground">AI Monitoring</div>
                                </div>
                            </div>
                        </div>
                        <div className="col-span-2 bg-foreground text-background p-3 font-mono text-xs">
                            <div className="opacity-50 mb-2">AI Event Log:</div>
                            <div className="space-y-1">
                                <div className="flex justify-between"><span>user_01</span> <span className="text-green-400">ACTIVE (Code)</span></div>
                                <div className="flex justify-between"><span>user_02</span> <span className="text-green-400">ACTIVE (Design)</span></div>
                                <div className="flex justify-between"><span>user_03</span> <span className="text-red-400">IDLE DETECTED</span></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Floating Mobile Element */}
                <div className="absolute -bottom-6 -left-6 w-40 bg-background border-2 border-foreground shadow-[4px_4px_0px_0px_currentColor] p-3 rotate-3 z-20">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center font-bold text-primary-foreground">!</div>
                        <div className="text-xs font-bold leading-tight">AI Alert: <br/> Idle Detected</div>
                    </div>
                    <div className="h-1 bg-foreground/10 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 w-[80%]" />
                    </div>
                </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
