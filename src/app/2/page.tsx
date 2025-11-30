'use client';

import React, { useState, useEffect } from 'react';
import { Search, ArrowUp } from 'lucide-react';
import { StarryBackground } from '@/components/StarryBackground';
import { cn } from '@/lib/utils';
import { StackedCard } from '@/components/StackedCard';

const problems = [
  "my reels don't look as good as theirs",
  "our website isn't getting any traffic",
  "I'm spending all day answering customer emails",
  "we need to build a financial model for fundraising",
  "I can't find our first 100 paying customers",
  "our pitch deck isn't impressive enough for investors",
];

const solvedProblems = [
    "Video Editor for Viral TikTok",
    "Growth Hacker for SaaS Waitlist",
    "Smart Contract Audit",
    "B2B Lead Gen Specialist",
    "Conversion Rate Optimization Expert",
    "Pitch Deck Designer for Seed Round"
];


export default function GrokPage() {
  const [placeholder, setPlaceholder] = useState('');
  const [problemIndex, setProblemIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [currentProblems, setCurrentProblems] = useState(solvedProblems);
  const [isFooterVisible, setIsFooterVisible] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
        setCurrentProblems(prev => {
            const newProblems = [...prev];
            const first = newProblems.shift();
            if (first) {
                newProblems.push(first);
            }
            return newProblems;
        });
    }, 5000);
    return () => clearInterval(interval);
  }, []);


  useEffect(() => {
    // Animate footer in
    const footerTimer = setTimeout(() => setIsFooterVisible(true), 300);
    return () => clearTimeout(footerTimer);
  }, []);

  useEffect(() => {
    if (isInputFocused) return;

    const currentProblemText = problems[problemIndex];
    let timeout: NodeJS.Timeout;

    const type = () => {
      if (isDeleting) {
        if (charIndex > 0) {
          setPlaceholder(currentProblemText.substring(0, charIndex - 1));
          setCharIndex(charIndex - 1);
          timeout = setTimeout(type, 30);
        } else {
          setIsDeleting(false);
          setProblemIndex((prev) => (prev + 1) % problems.length);
        }
      } else {
        if (charIndex < currentProblemText.length) {
          setPlaceholder(currentProblemText.substring(0, charIndex + 1));
          setCharIndex(charIndex + 1);
          timeout = setTimeout(type, 60);
        } else {
          timeout = setTimeout(() => setIsDeleting(true), 2500);
        }
      }
    };

    timeout = setTimeout(type, isDeleting ? 30 : 150);

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, problemIndex, isInputFocused]);
  
  return (
    <div className="bg-neutral-950 min-h-screen text-neutral-300 font-sans flex flex-col justify-between p-4 sm:p-6 md:p-8">
      <StarryBackground />
      <header className="flex justify-end w-full h-8">
        {/* Header content removed as requested */}
      </header>

      <main className="flex-grow flex flex-col items-center justify-center w-full -mt-24">
        <div className="text-center mb-8">
          <h1 className="font-playfair text-5xl md:text-6xl text-neutral-300 tracking-wide">
            TracHire
            <sup className="text-xl md:text-2xl text-neutral-400 ml-2">v0.1</sup>
          </h1>
        </div>

        <div className="w-full max-w-3xl">
          <div className="relative">
             <div className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-500 z-10">
                <Search size={20} />
            </div>
            <input
              type="text"
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              className="bg-neutral-900/50 border border-neutral-800 text-white placeholder:text-neutral-500 text-base rounded-full w-full h-16 pl-14 pr-16 py-2 focus:outline-none focus:ring-0 focus:border-neutral-700 transition-shadow shadow-lg backdrop-blur-sm"
            />
             <div
              className={cn(
                "absolute left-14 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none transition-all duration-300",
                isInputFocused ? "opacity-0 -translate-y-8" : "opacity-100"
              )}
            >
              {placeholder}
            </div>
            <button className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-neutral-800/80 hover:bg-neutral-700/80 rounded-full flex items-center justify-center transition-colors">
              <ArrowUp size={20} className="text-white" />
            </button>
          </div>
          
          <div className="mt-8 h-24 flex items-center justify-center">
               <StackedCard items={currentProblems} />
          </div>
        </div>
      </main>

      <footer className={cn("text-center w-full pb-4 transition-opacity duration-700", isFooterVisible ? "opacity-100" : "opacity-0")}>
        <p className="text-sm text-neutral-500 font-normal">Freelancers Available</p>
        <p className="text-3xl font-semibold text-neutral-300 tracking-wider">11,497</p>
      </footer>
    </div>
  );
}
