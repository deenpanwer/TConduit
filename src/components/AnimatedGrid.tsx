
'use client';

import { cn } from "@/lib/utils";
import React from "react";

export const AnimatedGrid = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        "absolute inset-0 h-full w-full",
        className
      )}
      {...props}
    >
        <div className="absolute inset-0 h-full w-full bg-background [mask-image:radial-gradient(transparent,white)]"></div>
        <div 
            className="absolute inset-0 h-full w-full"
            style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='hsl(var(--border))'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e")`,
                animation: "grid 10s linear infinite",
            }}
        >
        </div>
    </div>
  );
};

