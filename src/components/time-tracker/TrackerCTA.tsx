'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, ArrowRight } from 'lucide-react';

interface TrackerCTAProps {
  onStartTrial: () => void;
  onBookDemo: () => void;
  whatsappNumber?: string;
}

export function TrackerCTA({ onStartTrial, onBookDemo, whatsappNumber = "923178005465" }: TrackerCTAProps) {
  const whatsappUrl = `https://wa.me/${whatsappNumber}`;

  return (
    <section className="py-32 bg-foreground text-background relative overflow-hidden">
      {/* Background noise texture */}
      <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay pointer-events-none" />
      
      <div className="container mx-auto px-4 relative z-10 text-center">
        <h2 className="text-5xl sm:text-7xl md:text-8xl font-black font-poppins uppercase leading-[0.85] mb-8 tracking-tighter">
          Start Efficient <br />
          <span className="text-primary">Timekeeping.</span>
        </h2>
        
        <p className="text-xl md:text-2xl font-mono text-background/70 mb-12 max-w-2xl mx-auto">
          The best time recording software for modern teams. <br />
          Start your 14-day risk-free trial today.
        </p>

        <div className="flex flex-col items-center gap-6">
          <Button 
            size="lg" 
            onClick={onStartTrial} 
            className="w-full sm:w-auto h-20 text-2xl font-black uppercase tracking-widest px-12 bg-primary text-primary-foreground hover:bg-white hover:text-black border-4 border-transparent hover:border-primary transition-all shadow-[0px_0px_40px_-10px_var(--primary)]"
          >
            Start Free Trial
          </Button>

          <div className="flex flex-col sm:flex-row items-center gap-8 mt-12 pt-12 border-t border-background/20 w-full max-w-3xl">
             <div className="flex-1 text-center sm:text-right">
                <p className="font-mono text-xs uppercase tracking-widest text-background/50 mb-2">Need a demo?</p>
                <a 
                  href={whatsappUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  onClick={() => {
                    if (typeof window !== 'undefined' && (window as any).gtag_report_conversion) {
                      (window as any).gtag_report_conversion();
                    }
                  }}
                  className="group flex items-center justify-center sm:justify-end gap-2 text-lg font-bold hover:text-primary transition-colors w-full"
                >
                    Book Strategy Call <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </a>
             </div>
             <div className="hidden sm:block w-px h-12 bg-background/20" />
             <div className="flex-1 text-center sm:text-left">
                <p className="font-mono text-xs uppercase tracking-widest text-background/50 mb-2">Have questions?</p>
                <a 
                    href={whatsappUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={() => {
                      if (typeof window !== 'undefined' && (window as any).gtag_report_conversion) {
                        (window as any).gtag_report_conversion();
                      }
                    }}
                    className="flex items-center justify-center sm:justify-start gap-2 text-lg font-bold hover:text-green-400 transition-colors"
                >
                    <img src="/whatsapp-real.svg" alt="WhatsApp" width={20} height={20} className="w-5 h-5 invert-0" />
                    Chat on WhatsApp
                </a>
             </div>
          </div>
        </div>

      </div>
    </section>
  );
}