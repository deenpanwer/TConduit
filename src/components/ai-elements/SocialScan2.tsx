
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

// Original static definitions for logos and types, counts will be randomized
const staticSocialScanItems: Omit<ScanItem, 'count'>[] = [
  {
    id: "fiver",
    type: "social",
    name: "Fiver",
    darkLogo: "https://cdn.brandfetch.io/idB8OJ7IzV/theme/light/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B",
    lightLogo: "https://cdn.brandfetch.io/idB8OJ7IzV/theme/dark/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B",
  },
  {
    id: "upwork",
    type: "social",
    name: "Upwork",
    darkLogo: "https://cdn.brandfetch.io/id6B0ZV-R2/theme/light/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B",
    lightLogo: "/upwork_black.svg",
  },
  {
    id: "github",
    type: "social",
    name: "GitHub",
    darkLogo: "https://cdn.brandfetch.io/idZAyF9rlg/theme/light/symbol.svg?c=1dxbfHSJFAPEGdCLU4o5B",
    lightLogo: "https://cdn.brandfetch.io/idZAyF9rlg/theme/dark/symbol.svg?c=1dxbfHSJFAPEGdCLU4o5B",
  },
  {
    id: "linkedin",
    type: "social",
    name: "LinkedIn",
    darkLogo: "https://cdn.brandfetch.io/idJFz6sAsl/theme/dark/id745SkyD0.svg?c=1dxbfHSJFAPEGdCLU4o5B",
    lightLogo: "https://cdn.brandfetch.io/idJFz6sAsl/theme/dark/idtEseDv1X.svg?c=1dxbfHSJFAPEGdCLU4o5B",
  },
  {
    id: "twitter",
    type: "social",
    name: "Twitter",
    darkLogo: "https://cdn.brandfetch.io/idS5WhqBbM/theme/light/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B",
    lightLogo: "https://cdn.brandfetch.io/idS5WhqBbM/theme/dark/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B",
  },

];

// Helper to generate random number within a range
const generateRandomCount = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const SocialScan2 = () => {
  const { theme } = useTheme();
  const [dynamicScanItems, setDynamicScanItems] = useState<ScanItem[]>([]);
  const [currentScanIndex, setCurrentScanIndex] = useState(0);
  const [displayedCount, setDisplayedCount] = useState(0);
  const [isScanning, setIsScanning] = useState(false);

  // Populate dynamicScanItems with randomized counts on mount
  useEffect(() => {
    const randomizedItems: ScanItem[] = staticSocialScanItems.map((item) => {
      if (item.type === "social") {
        let count;
        if (item.id === "fiver" || item.id === "upwork") {
          count = generateRandomCount(90, 450);
        } else { // github, linkedin, twitter
          count = generateRandomCount(45, 200);
        }
        return { ...item, count };
      }
      return item;
    });
    setDynamicScanItems(randomizedItems);
  }, []); // Run only once on mount

  const currentScan = dynamicScanItems[currentScanIndex];
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
    const intervalId = setInterval(() => {
      const remaining = target - start;
      if (remaining <= 0) {
        setDisplayedCount(target);
        clearInterval(intervalId);
        setIsScanning(false);
        return;
      }
      
      // Calculate a dynamic jump: 10-30% of the remaining distance, min 1
      const jump = Math.max(1, Math.floor(Math.random() * (0.2 * remaining) + (0.1 * remaining)));
      start += jump;
      
      if (start >= target) {
        setDisplayedCount(target);
        clearInterval(intervalId);
        setIsScanning(false);
      } else {
        setDisplayedCount(Math.ceil(start));
      }
    }, 100); // Increased interval to 100ms for more distinct chunks
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
    if (!isScanning && currentScanIndex < dynamicScanItems.length - 1) {
      const timer = setTimeout(() => {
        setCurrentScanIndex((prev) => prev + 1);
      }, 1000); // 1 second delay between scans
      return () => clearTimeout(timer);
    } else if (!isScanning && currentScanIndex === dynamicScanItems.length - 1) {
        // All scans complete, potentially transition to next stage or loop
        console.log("All scans complete!");
    }
  }, [isScanning, currentScanIndex, dynamicScanItems]);

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