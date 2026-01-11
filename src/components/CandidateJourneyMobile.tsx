"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useScroll, useSpring, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronDown, ArrowRight } from "lucide-react";

const SECTIONS = [
  {
    id: "live",
    title: "Just Live",
    subtitle: "Your Life, Your Code",
    description: "Focus on your craft. Go about your daily life, coding, designing, and solving problems.",
    color: "from-primary/10 to-primary/5"
  },
  {
    id: "monitor",
    title: "We Watch",
    subtitle: "Silent Observation",
    description: "Our privacy-first agent quietly observes your work patterns, capturing your genius without interruption.",
    color: "from-primary/20 to-primary/10"
  },
  {
    id: "analyze",
    title: "We Analyze",
    subtitle: "AI-Powered Insights",
    description: "State-of-the-art AI charts your skills, converting your raw output into a verified professional profile.",
    color: "from-primary/30 to-primary/20"
  },
  {
    id: "hire",
    title: "You Get Hired",
    subtitle: "Direct Connection",
    description: "Skip the interviews. We connect you directly with employers who need exactly what you've proven you can do.",
    color: "from-primary/40 to-primary/30"
  },
];

const FRAMES_PER_SEQ = 240;
const TOTAL_FRAMES = 700; 

export function CandidateJourneyMobile() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [activeSection, setActiveSection] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const imageCache = useRef<HTMLImageElement[]>([]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Preload Images Logic
  useEffect(() => {
    let isMounted = true;
    const preloadImages = async () => {
        const promises = [];
        for (let i = 0; i < TOTAL_FRAMES; i++) {
            const index = i;
            promises.push(new Promise<void>((resolve) => {
                const img = new Image();
                let src = "";
                if (index < FRAMES_PER_SEQ) {
                    src = `/sequence_1/ezgif-frame-${(index + 1).toString().padStart(3, '0')}.jpg`;
                } else if (index < FRAMES_PER_SEQ * 2) {
                    src = `/sequence_2/ezgif-frame-${(index - FRAMES_PER_SEQ + 1).toString().padStart(3, '0')}.jpg`;
                } else {
                    src = `/sequence_3/ezgif-frame-${(index - FRAMES_PER_SEQ * 2 + 1).toString().padStart(3, '0')}.jpg`;
                }
                
                img.src = src;
                img.onload = () => {
                    imageCache.current[index] = img;
                    resolve();
                };
                img.onerror = () => resolve(); 
            }));
        }
        
        await Promise.all(promises);
        if (isMounted) setImagesLoaded(true);
    };

    preloadImages();
    return () => { isMounted = false; };
  }, []);

  // Sync Frame & Section
  useEffect(() => {
    const unsubscribe = smoothProgress.on("change", (latest) => {
      const frameIndex = Math.min(
        TOTAL_FRAMES - 1,
        Math.floor(latest * TOTAL_FRAMES)
      );
      setCurrentFrame(frameIndex);

      const step = 1 / SECTIONS.length;
      const newSection = Math.min(SECTIONS.length - 1, Math.floor(latest / step));
      setActiveSection(newSection);
    });
    return () => unsubscribe();
  }, [smoothProgress]);

  // Draw Frame
  const drawFrame = (frameIndex: number) => {
      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return;

      let img = imageCache.current[frameIndex];
      if (!img) {
          for (let i = frameIndex - 1; i >= 0; i--) {
              if (imageCache.current[i]) {
                  img = imageCache.current[i];
                  break;
              }
          }
      }

      if (img) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        
        // Use 'contain' logic
        const scale = Math.min(canvasRef.current.width / img.width, canvasRef.current.height / img.height);
        
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (canvasRef.current.width / 2) - (w / 2);
        const y = (canvasRef.current.height / 2) - (h / 2);
        
        // Rounded corners for the image
        const radius = 32; // 2rem

        ctx.save();
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
           ctx.roundRect(x, y, w, h, radius);
        } else {
           // Fallback for older browsers
           ctx.moveTo(x + radius, y);
           ctx.lineTo(x + w - radius, y);
           ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
           ctx.lineTo(x + w, y + h - radius);
           ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
           ctx.lineTo(x + radius, y + h);
           ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
           ctx.lineTo(x, y + radius);
           ctx.quadraticCurveTo(x, y, x + radius, y);
           ctx.closePath();
        }
        ctx.clip();
        
        ctx.drawImage(img, x, y, w, h);
        ctx.restore();
      }
  };

  useEffect(() => {
    if (imagesLoaded) drawFrame(currentFrame);
  }, [currentFrame, imagesLoaded]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
        if(canvasRef.current && canvasRef.current.parentElement) {
            canvasRef.current.width = canvasRef.current.parentElement.clientWidth;
            canvasRef.current.height = canvasRef.current.parentElement.clientHeight;
            if(imagesLoaded) drawFrame(currentFrame);
        }
    }
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [currentFrame, imagesLoaded]);


  return (
    <div ref={containerRef} className="relative w-full bg-background" style={{ height: `${SECTIONS.length * 100}vh` }}>
      
      {/* Sticky Canvas Background */}
      <div className="sticky top-0 h-[100dvh] w-full overflow-hidden">
        <canvas 
            ref={canvasRef} 
            className={cn(
                "w-full h-full transition-opacity duration-700", 
                imagesLoaded ? "opacity-100" : "opacity-0"
            )}
        />
        {/* Overlay gradient to make text readable - lightened for clarity */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        
        {/* Loading State */}
        {!imagesLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <span className="text-sm font-medium animate-pulse">Loading Visuals...</span>
                </div>
            </div>
        )}

        {/* Dynamic Content Overlay - Fixed position over the canvas */}
        <div className="absolute inset-x-0 bottom-0 h-[55%] pb-8 px-6 flex flex-col justify-end pointer-events-none">
             <AnimatePresence mode="wait">
                <motion.div
                    key={activeSection}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="relative pointer-events-auto"
                >
                    {/* Card Container - Reduced blur */}
                    <div className={cn(
                        "relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl p-6",
                        "dark:bg-black/20 dark:border-white/10"
                    )}>
                        {/* Decorative background blob */}
                        <div className={cn("absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-30 bg-gradient-to-br", SECTIONS[activeSection].color)} />

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-3">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary ring-1 ring-primary/50">
                                    0{activeSection + 1}
                                </span>
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                                    {SECTIONS[activeSection].subtitle}
                                </h4>
                            </div>
                            
                            <h2 className="text-3xl font-bold mb-3 leading-tight tracking-tight text-foreground">
                                {SECTIONS[activeSection].title}
                            </h2>
                            
                            <p className="text-base text-muted-foreground/90 leading-relaxed mb-6">
                                {SECTIONS[activeSection].description}
                            </p>

                            {activeSection === SECTIONS.length - 1 ? (
                                <Link href="/trac-dairy" className="w-full">
                                    <Button className="w-full rounded-xl py-6 text-lg font-semibold shadow-lg group">
                                        Join the Network
                                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </Link>
                            ) : (
                                <div className="flex justify-center pt-2">
                                     <div className="animate-bounce text-muted-foreground/50">
                                        <ChevronDown className="h-6 w-6" />
                                     </div>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
             </AnimatePresence>
        </div>

        {/* Progress Indicators  i removed these indicators not needed if theres any leftover code for them clean it up*/}

      </div>

    </div>
  );
}