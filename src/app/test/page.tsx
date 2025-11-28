
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function TestPage() {
  const [timeLeft, setTimeLeft] = useState(120); // 120 seconds = 2 minutes

  useEffect(() => {
    if (timeLeft === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => (prevTime > 0 ? prevTime - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 font-sans">
      <div className="w-full max-w-2xl rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col space-y-1.5 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <div className="flex items-center justify-center space-x-1">
                    <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-primary [animation-delay:-0.3s]"></span>
                    <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-primary [animation-delay:-0.15s]"></span>
                    <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-primary"></span>
                </div>
              </div>
              <h1 className="font-playfair text-2xl font-medium text-foreground">
                Agent is initializing...
              </h1>
            </div>
            <div className="text-lg font-medium text-red-500">
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>
        
        <div className="p-6 pt-0">
            <p className="text-muted-foreground">
                Our AI agent is now analyzing your request, preparing to scour the web for top-tier talent, and identifying candidates with the precise skills to solve your problem. Once approved, you can sit back as the most competent freelancer is found for you.
            </p>
        </div>

        <div className="flex items-center p-6 pt-0 justify-end">
             <Link href="/">
                <Button variant="outline">
                    Cancel and Go Back
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </Link>
        </div>

      </div>
    </main>
  );
}
