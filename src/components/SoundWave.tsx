"use client";

import React from 'react';
import { cn } from '@/lib/utils';

type SoundWaveProps = {
  isListening: boolean;
};

export const SoundWave = ({ isListening }: SoundWaveProps) => {
  const barsRef = React.useRef<(HTMLDivElement | null)[]>([]);

  React.useEffect(() => {
    if (isListening) {
      barsRef.current.forEach(bar => {
        if (bar) {
          bar.style.animationDuration = `${Math.random() * (0.7 - 0.2) + 0.2}s`;
        }
      });
    }
  }, [isListening]);

  const numBars = 30;

  const getBarClass = (index: number) => {
    if (!isListening) return 'bar-still';

    const midPoint = Math.floor(numBars / 2);
    const distanceFromCenter = Math.abs(index - midPoint);

    if (distanceFromCenter > 10) {
      return 'bar-sm';
    }
    if (distanceFromCenter > 5) {
      return 'bar-md';
    }
    return 'bar-lg';
  };

  return (
    <div className="sound-wave">
      {[...Array(numBars)].map((_, i) => (
        <div
          key={i}
          ref={el => (barsRef.current[i] = el)}
          className={cn('bar', getBarClass(i))}
        />
      ))}
    </div>
  );
};
