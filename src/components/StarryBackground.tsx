'use client';

import React, { useEffect, useState } from 'react';

const Star = ({ style }: { style: React.CSSProperties }) => {
  return (
    <div className="absolute" style={style}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 0L6.12257 3.87743L10 5L6.12257 6.12257L5 10L3.87743 6.12257L0 5L3.87743 3.87743L5 0Z" fill="white"/>
        </svg>
    </div>
  );
};

export const StarryBackground = () => {
  const [stars, setStars] = useState<React.ReactElement[]>([]);

  useEffect(() => {
    const generateStars = () => {
      const newStars = [];
      const numStars = 30; // Reduced density for subtlety
      for (let i = 0; i < numStars; i++) {
        const size = Math.random() * 0.5 + 0.5; // smaller stars
        const animationDuration = Math.random() * 8 + 4; // 4s to 12s, longer duration
        const animationDelay = Math.random() * 10; // 0s to 10s delay
        
        const style: React.CSSProperties = {
          transform: `scale(${size})`,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animation: `flicker ${animationDuration}s infinite`,
          animationDelay: `${animationDelay}s`,
        };
        newStars.push(<Star key={i} style={style} />);
      }
      setStars(newStars);
    };

    generateStars();
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden">
      <style>
        {`
          @keyframes flicker {
            0%, 100% {
              opacity: 0;
            }
            20%, 80% {
              opacity: 0.7;
              transform: scale(1);
            }
            50% {
              opacity: 1;
              transform: scale(1.2);
            }
          }
        `}
      </style>
      {stars}
    </div>
  );
};
