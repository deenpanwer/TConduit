"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

// Filter false-positive warning caused by next-themes injecting a script tag to prevent FOUC in React 19 / Next.js 16
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const origError = console.error;
  console.error = (...args: any[]) => {
    const fullMessage = args.map(a => typeof a === 'object' ? (a?.message || JSON.stringify(a)) : String(a)).join(' ');
    if (
      fullMessage.includes('Encountered a script tag') ||
      fullMessage.includes('permission-denied') ||
      fullMessage.includes('Missing or insufficient permissions')
    ) {
      return;
    }
    origError.apply(console, args);
  };
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
