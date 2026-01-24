'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface TrackerHeaderProps {
  onBookDemo: () => void;
}

export function TrackerHeader({ onBookDemo }: TrackerHeaderProps) {
  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className="fixed top-6 left-0 right-0 z-50 pointer-events-none"
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center max-w-5xl mx-auto">
          {/* Logo Island */}
          <div className="bg-background border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] rounded-xl px-6 py-3 pointer-events-auto">
            <Link href="/" className="font-poppins font-black text-xl tracking-tighter uppercase flex items-center gap-2">
              <span className="w-3 h-3 bg-primary rounded-sm animate-pulse" />
              Trac AI
            </Link>
          </div>

          {/* CTA Island */}
          <div className="bg-background border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] rounded-xl p-1.5 pointer-events-auto transition-transform hover:-translate-y-1 hover:translate-x-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]">
            <Button 
              onClick={onBookDemo} 
              variant="default" 
              className="rounded-lg font-bold border-none bg-foreground text-background hover:bg-foreground/90 h-10 px-6 uppercase tracking-wide"
            >
              Book Strategy Call
            </Button>
          </div>
        </div>
      </div>
    </motion.header>
  );
}