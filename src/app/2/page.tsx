'use client';

import React, { useState, useEffect } from 'react';
import { Search, ArrowUp } from 'lucide-react';
import { StarryBackground } from '@/components/StarryBackground';

const problems = [
  "my reels don't look as good as theirs",
  "our website isn't getting any traffic",
  "I'm spending all day answering customer emails",
  "we need to build a financial model for fundraising",
  "I can't find our first 100 paying customers",
  "our pitch deck isn't impressive enough for investors",
];

const RecentActivityCard = ({ title, time }: { title: string; time: string }) => (
  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 w-full max-w-md backdrop-blur-sm">
    <h3 className="font-medium text-white">{title}</h3>
    <div className="flex justify-between items-center mt-2">
      <p className="text-xs text-neutral-400">New solution deployed by TracHire</p>
      <p className="text-xs text-neutral-400">{time}</p>
    </div>
  </div>
);


export default function GrokPage() {
  const [placeholder, setPlaceholder] = useState('');
  const [problemIndex, setProblemIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentProblem = problems[problemIndex];
    let timeout: NodeJS.Timeout;

    const type = () => {
      if (isDeleting) {
        if (charIndex > 0) {
          setPlaceholder(currentProblem.substring(0, charIndex - 1));
          setCharIndex(charIndex - 1);
          timeout = setTimeout(type, 30);
        } else {
          setIsDeleting(false);
          setProblemIndex((prev) => (prev + 1) % problems.length);
        }
      } else {
        if (charIndex < currentProblem.length) {
          setPlaceholder(currentProblem.substring(0, charIndex + 1));
          setCharIndex(charIndex + 1);
          timeout = setTimeout(type, 60);
        } else {
          timeout = setTimeout(() => setIsDeleting(true), 2500);
        }
      }
    };

    timeout = setTimeout(type, isDeleting ? 30 : 150);

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, problemIndex]);

  return (
    <div className="bg-black min-h-screen text-neutral-300 font-sans flex flex-col justify-between p-4 sm:p-6 md:p-8">
      <StarryBackground />
      <header className="flex justify-end w-full">
        <div className="flex items-center gap-4">
          <button className="text-neutral-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
            KK
          </div>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center w-full -mt-16">
        <div className="text-center mb-8">
          <h1 className="font-playfair text-5xl md:text-6xl text-white">
            TracHire
            <sup className="text-xl md:text-2xl text-neutral-400 ml-2">v0.1</sup>
          </h1>
        </div>

        <div className="w-full max-w-xl relative">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={20} />
            <input
              type="text"
              placeholder={placeholder}
              className="bg-neutral-900 border border-neutral-800 text-white placeholder:text-neutral-500 text-base rounded-full w-full h-14 pl-12 pr-14 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow shadow-lg"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-neutral-800 hover:bg-neutral-700 rounded-full flex items-center justify-center transition-colors">
              <ArrowUp size={20} className="text-white" />
            </button>
          </div>
        </div>
        
        <div className="mt-8 space-y-4 w-full max-w-xl flex flex-col items-center">
            <RecentActivityCard title="Video Editor for a Viral TikTok Campaign" time="2 hours ago" />
        </div>
      </main>

      <footer className="text-center w-full pb-4">
        <p className="text-sm text-neutral-500">Freelancers Available</p>
        <p className="text-3xl font-bold text-white tracking-wider">11,497</p>
      </footer>
    </div>
  );
}