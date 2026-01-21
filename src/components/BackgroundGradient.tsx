import React from "react";
import { cn } from "@/lib/utils";

interface BackgroundGradientProps {
  className?: string;
}

export function BackgroundGradient({ className }: BackgroundGradientProps) {
  return (
    <div className={cn("fixed inset-0 pointer-events-none z-0 overflow-hidden", className)}>
      {/* Light mode gradient */}
      <div 
        className="absolute inset-0 dark:hidden transition-opacity duration-700 opacity-60"
        style={{
            backgroundImage: `
                linear-gradient(180deg, #ffffff 0%, #FFEDD5 25%, #FFDAB9 50%, #FFB6C1 70%, #E0BBE4 85%, #F3E5F5 100%),
                radial-gradient(at 20% 30%, #ffffff33 0%, transparent 60%),
                radial-gradient(at 80% 70%, #f3e5f533 0%, transparent 70%)
            `,
            backgroundBlendMode: "overlay, screen",
            filter: "blur(60px)",
        }}
      />
      
      {/* Dark mode gradient */}
      <div 
        className="absolute inset-0 hidden dark:block transition-opacity duration-700"
        style={{
            backgroundImage: `
                linear-gradient(180deg, #000000 0%, #0a192f 25%, #112240 50%, #0f172a 75%, #020617 100%),
                radial-gradient(at 20% 30%, rgba(255, 255, 255, 0.05) 0%, transparent 60%),
                radial-gradient(at 80% 70%, rgba(255, 255, 255, 0.05) 0%, transparent 70%)
            `,
            filter: "blur(60px)",
            opacity: 1,
        }}
      />

      {/* Animated Pulse Effect */}
      <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] h-[150vh] bg-radial-pulse animate-pulse-slow" 
               style={{
                   background: "radial-gradient(circle at center, rgba(56, 189, 248, 0.15) 0%, transparent 70%)",
                   filter: "blur(120px)",
               }}
          />
      </div>
    </div>
  );
}
