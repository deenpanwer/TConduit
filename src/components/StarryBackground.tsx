'use client';

import React, { useEffect, useState } from 'react';

const Star = ({ style }: { style: React.CSSProperties }) => {
  return <div className="absolute bg-white rounded-full" style={style}></div>;
};

export const StarryBackground = () => {
  const [stars, setStars] = useState<React.ReactElement[]>([]);

  useEffect(() => {
    const generateStars = () => {
      const newStars = [];
      const numStars = 50; // Adjust for density
      for (let i = 0; i < numStars; i++) {
        const size = Math.random() * 2 + 0.5;
        const animationDuration = Math.random() * 5 + 3; // 3s to 8s
        const animationDelay = Math.random() * 5; // 0s to 5s
        
        const style: React.CSSProperties = {
          width: `${size}px`,
          height: `${size}px`,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animation: `flicker ${animationDuration}s infinite alternate`,
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
              opacity: 0.2;
              transform: scale(0.8);
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
