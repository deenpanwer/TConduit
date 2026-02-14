"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const SECTIONS = [
  {
    id: "live",
    title: "Just Live",
    description: "Focus on your craft. Go about your daily life, coding, designing, and solving problems.",
  },
  {
    id: "monitor",
    title: "We Watch",
    description: "Our privacy-first agent quietly observes your work patterns, capturing your genius without interruption.",
  },
  {
    id: "analyze",
    title: "We Analyze",
    description: "State-of-the-art AI charts your skills, converting your raw output into a verified professional profile.",
  },
  {
    id: "hire",
    title: "You Get Hired",
    description: "Skip the interviews. We connect you directly with employers who need exactly what you've proven you can do.",
  },
];

const FRAMES_PER_SEQ = 240;
const TOTAL_FRAMES = 700; 

export function CandidateJourney() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
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

  // Reverted to standard parallel preloading for stability
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

  useEffect(() => {
    const unsubscribe = smoothProgress.on("change", (latest) => {
      const frameIndex = Math.min(
        TOTAL_FRAMES - 1,
        Math.floor(latest * TOTAL_FRAMES)
      );
      setCurrentFrame(frameIndex);

      const step = Math.floor(TOTAL_FRAMES / SECTIONS.length);
      const newTab = Math.min(SECTIONS.length - 1, Math.floor(frameIndex / step));
      setActiveTab(newTab);
    });
    return () => unsubscribe();
  }, [smoothProgress]);


  // Helper to draw
  const drawFrame = (frameIndex: number) => {
      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return;

      let img = imageCache.current[frameIndex];
      // Fallback
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
        const scale = Math.max(canvasRef.current.width / img.width, canvasRef.current.height / img.height);
        const x = (canvasRef.current.width / 2) - (img.width / 2) * scale;
        const y = (canvasRef.current.height / 2) - (img.height / 2) * scale;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      }
  };

  useEffect(() => {
    if (imagesLoaded) drawFrame(currentFrame);
  }, [currentFrame, imagesLoaded]);

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

  const scrollToSection = (index: number) => {
      const sectionElement = document.getElementById(`journey-step-${index}`);
      if (sectionElement) {
          const headerOffset = 100;
          const elementPosition = sectionElement.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
          });
      }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <div className="relative w-full bg-background flex flex-col">
       
       <div className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-md border-b border-border/50 py-4 flex justify-center shadow-sm">
             <div className="flex gap-2 p-1 bg-secondary/30 rounded-full overflow-x-auto max-w-full no-scrollbar px-4">
                {SECTIONS.map((tab, index) => (
                    <button
                        key={tab.id}
                        onClick={() => scrollToSection(index)}
                        className={cn(
                            "px-4 md:px-6 py-2 rounded-full text-xs md:text-sm font-medium transition-all duration-300 whitespace-nowrap",
                            activeTab === index 
                                ? "bg-primary text-primary-foreground shadow-sm scale-105" 
                                : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                        )}
                    >
                        {tab.title}
                    </button>
                ))}
             </div>
        </div>

       <section ref={containerRef} className="relative w-full flex flex-col lg:flex-row">
            
            <div className="w-full lg:w-1/2 flex flex-col order-2 lg:order-1 pt-10">
                {SECTIONS.map((section, index) => (
                    <div 
                        key={section.id}
                        id={`journey-step-${index}`}
                        className="min-h-[120vh] flex flex-col justify-center p-8 lg:p-24 border-l-4 border-transparent data-[active=true]:border-primary transition-colors"
                        data-active={activeTab === index}
                    >
                        <motion.div 
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ margin: "-20%" }}
                            className="max-w-lg"
                        >
                             <motion.div variants={itemVariants} className="text-9xl font-playfair text-primary/25 font-black mb-8 -ml-6 select-none">
                                0{index + 1}
                             </motion.div>
                             <motion.h3 variants={itemVariants} className="text-5xl lg:text-6xl font-playfair font-bold mb-8 leading-tight text-foreground">
                                 {section.title}
                             </motion.h3>
                             <motion.p variants={itemVariants} className="text-2xl text-muted-foreground leading-relaxed mb-8">
                                 {section.description}
                             </motion.p>
                             
                             {index === SECTIONS.length - 1 && (
                                <motion.div variants={itemVariants}>
                                    <Link href="/trac-diary">
                                        <Button size="lg" className="text-lg px-8 py-6 rounded-xl shadow-lg hover:scale-105 transition-transform">
                                            Join the Network
                                        </Button>
                                    </Link>
                                </motion.div>
                             )}
                        </motion.div>
                    </div>
                ))}
            </div>

            <div className="w-full lg:w-1/2 h-[50vh] lg:h-screen sticky top-16 lg:top-0 order-1 lg:order-2 flex items-center justify-center bg-background/50 p-4 lg:p-8 z-10 lg:z-auto pointer-events-none lg:pointer-events-auto">
                 <div className="relative w-full max-w-[600px] aspect-square lg:aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-border/50 bg-secondary/20 ring-1 ring-white/20">
                     {!imagesLoaded && (
                         <div className="absolute inset-0 flex items-center justify-center text-muted-foreground animate-pulse bg-secondary/10">
                             <div className="flex flex-col items-center gap-2">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                                <span className="text-sm font-medium">Loading Experience...</span>
                             </div>
                         </div>
                     )}
                     <canvas 
                        ref={canvasRef} 
                        className={cn("w-full h-full object-cover transition-opacity duration-700", imagesLoaded ? "opacity-100" : "opacity-0")}
                     />
                     <div className="absolute inset-0 pointer-events-none ring-inset ring-1 ring-white/10 rounded-3xl" />
                 </div>
            </div>

       </section>
    </div>
  );
}
