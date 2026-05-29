
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Squares from '@/components/Squares';
// Removed unused Skeleton component import
// Removed unused Progress component import
import { Checkbox } from '@/components/ui/checkbox';

const INITIAL_TIME = 178; // 2:58 in seconds

const CustomProgressBar = ({ value }: { value: number }) => {
  const segmentColor1 = 'hsl(221, 50%, 70%)'; // Subtle blue
  const segmentColor2 = 'hsl(210, 20%, 70%)'; // Subtle gray
  const segmentColor3 = 'hsl(215, 10%, 80%)'; // Even lighter gray

  return (
    <div className="h-2 w-full bg-[#E0E0E0] rounded-[4px] overflow-hidden">
      <div 
        className="h-full rounded-[4px]" 
        style={{
          width: `${value}%`,
          background: `linear-gradient(to right, ${segmentColor1} 0% 33.33%, ${segmentColor2} 33.33% 66.66%, ${segmentColor3} 66.66% 100%)`,
          transition: 'width 1s ease-out', 
        }}
      ></div>
    </div>
  );
};

// Custom Skeleton component for the entire card content
const CustomSkeleton = () => (
  <div className="skeleton-loader p-8"> {/* Adjusted padding to p-8 (32px) */}
    <div className="skeleton-line large-title mb-6"></div>

    <div className="skeleton-progress-area flex items-center gap-4 mb-6">
      <div className="skeleton-progress-bar h-2 w-3/4 rounded-[4px]"></div> {/* w-3/4 (75%) */}
      <div className="skeleton-timer h-4 w-[15%] rounded-[4px]"></div> {/* w-[15%] */}
    </div>

    <div className="skeleton-line small-text mb-8"></div>

    <div className="skeleton-text-block p-4 rounded-md border bg-secondary mb-8">
      <div className="skeleton-line text-line-1 h-4 w-full mb-2"></div>
      <div className="skeleton-line text-line-2 h-4 w-full mb-2"></div>
      <div className="skeleton-line text-line-3 h-4 w-full mb-2"></div>
      <div className="skeleton-line text-line-4 short h-4 w-3/4"></div>
    </div>

    <div className="skeleton-buttons-area flex flex-col md:flex-row gap-4">
      <div className="skeleton-button primary-btn h-12 w-[48%] rounded-[4px]"></div> {/* w-[48%] */}
      <div className="skeleton-button secondary-btn h-12 w-[48%] rounded-[4px]"></div> {/* w-[48%] */}
    </div>
  </div>
);

export default function TestPage() {
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const progressValue = ((INITIAL_TIME - timeLeft) / INITIAL_TIME) * 100;

  useEffect(() => {
    if (timeLeft === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => (prevTime > 0 ? prevTime - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  useEffect(() => {
    const loadingTimer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(loadingTimer);
  }, []);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLElement>) => {
    setMousePosition({ x: event.clientX, y: event.clientY });
  };

  const handleMouseLeave = () => {
    setMousePosition(null);
  };

  return (
    <main 
      className="relative flex min-h-screen flex-col items-center justify-center p-4 font-sans overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
       <Squares 
        speed={0.5} 
        squareSize={40} 
        direction='diagonal' 
        borderColor='hsl(var(--border))' 
        hoverFillColor='hsl(221, 39%, 22%)' 
        className="absolute inset-0 -z-10"
        mousePosition={mousePosition}
       />
      <div className="relative z-10 w-full max-w-2xl rounded-lg border bg-background text-card-foreground shadow-xl">
        {isLoading ? (
          <CustomSkeleton />
        ) : (
          <>
            <header className="flex flex-col gap-4 mb-6 p-6"> {/* Added p-6 here for consistent padding */}
              <h1 className="font-playfair text-2xl font-medium text-foreground">Agent Is Initializing</h1>
              <div className="flex items-center gap-4"> {/* progress-container */}
                <CustomProgressBar value={progressValue} />
                <div className="flex items-center gap-2 text-muted-foreground"> {/* .timer */}
                  <span className="text-base font-bold">{formatTime(timeLeft)}</span> <span className="hidden md:inline">remaining</span>
                </div>
              </div>
            </header>

            <section className="space-y-4 mb-8 p-6 pt-0"> {/* Adjusted padding */}
                <div className="flex items-center gap-2">
                    <Checkbox id="review-check" checked disabled />
                    <label htmlFor="review-check" className="font-medium text-foreground">Review Agent's Mission</label>
                </div>
                <div className="p-4 rounded-md border bg-secondary">
                    <p className="text-muted-foreground">
                        <span className="font-bold text-foreground">Agent Initializing:</span> Our AI is now performing the preparatory analysis based on your prompt, scoping the web for experts in short-form video editing (TikTok, Reels). The focus is currently set on dynamic pacing, creative transitions, and color grading. Review this focus to ensure a successful search, or stop to refine your prompt.
                    </p>
                </div>
            </section>

            <footer className="flex flex-col md:flex-row gap-4 p-6 pt-0"> {/* Adjusted padding */}
                <Button size="lg" asChild className="w-full md:w-auto flex-grow">
                    <Link href="/test/start">CONFIRM & LAUNCH AGENT</Link>
                </Button>
                <Button variant="outline" size="lg" className="w-full md:w-auto">
                    STOP & EDIT PROMPT
                </Button>
            </footer>
          </>
        )}
      </div>
    </main>
  );
}
