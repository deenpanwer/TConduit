
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center font-sans">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex items-center justify-center space-x-2">
            <span className="h-3 w-3 animate-pulse-dot rounded-full bg-primary [animation-delay:-0.3s]"></span>
            <span className="h-3 w-3 animate-pulse-dot rounded-full bg-primary [animation-delay:-0.15s]"></span>
            <span className="h-3 w-3 animate-pulse-dot rounded-full bg-primary"></span>
        </div>

        <h1 className="mb-4 font-playfair text-4xl font-medium text-foreground md:text-5xl">
          Agent is initializing...
        </h1>

        <p className="mb-8 text-muted-foreground">
          Our AI agent is now analyzing your request, preparing to scour the web for top-tier talent, and identifying candidates with the precise skills to solve your problem. Once approved, you can sit back as the most competent freelancer is found for you.
        </p>

        <div className="mb-10 text-lg font-medium text-red-500">
          {formatTime(timeLeft)}
        </div>

        <Link href="/">
          <Button variant="outline" size="lg">
            Cancel and Go Back
          </Button>
        </Link>
      </div>
    </main>
  );
}
