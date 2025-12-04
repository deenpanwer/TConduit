"use client";

import { useEffect, useState, useCallback, Fragment } from "react";
// import Image from "next/image"; // Commented out for debugging
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { TaskItem } from "./task";

interface ScanItem {
  id: string;
  type: "social" | "text";
  name?: string;
  count?: number;
  message?: string;
  lightLogo?: string;
  darkLogo?: string;
}

const socialScanItems: ScanItem[] = [
  {
    id: "fiver",
    type: "social",
    name: "Fiver",
    darkLogo: "https://cdn.brandfetch.io/idB8OJ7IzV/theme/light/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B",
    lightLogo: "https://cdn.brandfetch.io/idB8OJ7IzV/theme/dark/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B",
    count: 123,
  },
  {
    id: "upwork",
    type: "social",
    name: "Upwork",
    darkLogo: "https://cdn.brandfetch.io/id6B0ZV-R2/theme/light/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B",
    lightLogo: "/upwork_black.svg",
    count: 456,
  },
  {
    id: "github",
    type: "social",
    name: "GitHub",
    darkLogo: "https://cdn.brandfetch.io/idZAyF9rlg/theme/light/symbol.svg?c=1dxbfHSJFAPEGdCLU4o5B",
    lightLogo: "https://cdn.brandfetch.io/idZAyF9rlg/theme/dark/symbol.svg?c=1dxbfHSJFAPEGdCLU4o5B",
    count: 234,
  },
  {
    id: "linkedin",
    type: "social",
    name: "LinkedIn",
    darkLogo: "https://cdn.brandfetch.io/idJFz6sAsl/theme/dark/id745SkyD0.svg?c=1dxbfHSJFAPEGdCLU4o5B",
    lightLogo: "https://cdn.brandfetch.io/idJFz6sAsl/theme/dark/idtEseDv1X.svg?c=1dxbfHSJFAPEGdCLU4o5B",
    count: 345,
  },
  {
    id: "twitter",
    type: "social",
    name: "Twitter",
    darkLogo: "https://cdn.brandfetch.io/idS5WhqBbM/theme/light/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B",
    lightLogo: "https://cdn.brandfetch.io/idS5WhqBbM/theme/dark/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B",
    count: 178,
  },
  {
    id: "website_visit",
    type: "text",
    message: "Visiting a developer's personal website...",
  }
];

const SocialScan2 = () => {
  const { theme } = useTheme();
  const [currentScanIndex, setCurrentScanIndex] = useState(0);
  const [displayedCount, setDisplayedCount] = useState(0);
  const [isScanning, setIsScanning] = useState(false);

  const currentScan = socialScanItems[currentScanIndex];
  const logoSrc =
    currentScan?.type === "social"
      ? theme === "dark"
        ? currentScan.darkLogo
        : currentScan.lightLogo
      : undefined;

  // Determine logo size
  const logoSize = currentScan?.id === "fiver" || currentScan?.id === "upwork" ? 80 : 40;

  const animateCount = useCallback((target: number, duration: number) => {
    setIsScanning(true);
    let start = 0;
    const increment = target / (duration / 50); // Divide duration by interval (50ms)
    const intervalId = setInterval(() => {
      start += increment;
      if (start >= target) {
        setDisplayedCount(target);
        clearInterval(intervalId);
        setIsScanning(false);
      } else {
        setDisplayedCount(Math.ceil(start));
      }
    }, 50);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (currentScan) {
      if (currentScan.type === "social" && currentScan.count !== undefined) {
        setDisplayedCount(0); // Reset count for new scan
        const cleanup = animateCount(currentScan.count, 2000); // 2 seconds animation
        return cleanup;
      } else if (currentScan.type === "text") {
        setIsScanning(true);
        const timer = setTimeout(() => {
          setIsScanning(false);
        }, 1500); // Display text message for 1.5 seconds
        return () => clearTimeout(timer);
      }
    }
  }, [currentScanIndex, currentScan, animateCount]);

  useEffect(() => {
    if (!isScanning && currentScanIndex < socialScanItems.length - 1) {
      const timer = setTimeout(() => {
        setCurrentScanIndex((prev) => prev + 1);
      }, 1000); // 1 second delay between scans
      return () => clearTimeout(timer);
    } else if (!isScanning && currentScanIndex === socialScanItems.length - 1) {
        // All scans complete, potentially transition to next stage or loop
        console.log("All scans complete!");
    }
  }, [isScanning, currentScanIndex]);

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {currentScan && (
          <motion.div
            key={currentScan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center gap-2"
          >
            {currentScan.type === "social" && logoSrc && (
              <Fragment>
                <img
                  src={logoSrc}
                  alt={`${currentScan.name} logo`}
                  width={logoSize}
                  height={logoSize}
                />
                <p className="text-2xl font-bold">{displayedCount}</p>
                <p className="text-muted-foreground">{currentScan.name} Profiles</p>
              </Fragment>
            )}
            {currentScan.type === "text" && currentScan.message && (
              <p className="text-lg text-muted-foreground text-center">
                {currentScan.message}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <p className="mt-8 text-sm text-muted-foreground">
        Scanning for top-tier candidates across the web...
      </p>
    </div>
  );
};

export default SocialScan2;