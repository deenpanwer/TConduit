
'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const features = [
  {
    title: "Smart Activity Feed",
    description: "Track your work in real-time with automatic context logging. See exactly what you've worked on and for how long.",
    image: "/dairy/demo1.png",
  },
  {
    title: "Strategic Capacity",
    description: "View your productivity trends and capacity at a glance. Identify your most productive days and optimize your schedule.",
    image: "/dairy/demo2.png",
  },
  {
    title: "Visual Analytics",
    description: "Understand where your time goes with project distribution charts. Visualize your focus across different applications and projects.",
    image: "/dairy/demo3.png",
  },
  {
    title: "Granular Reporting",
    description: "Dive deep into every minute with detailed logs and exportable data. Generate comprehensive reports for billing or personal audits.",
    image: "/dairy/demo4.png",
  },
];

// New Desktop Component
const DesktopDemo = () => {
  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ['start start', 'end end'],
  });

  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);

  useEffect(() => {
    return scrollYProgress.onChange((latest) => {
      const index = Math.floor(latest * features.length);
      setActiveFeatureIndex(Math.min(index, features.length - 1));
    });
  }, [scrollYProgress]);

  // Using 4 indicators to match the 4 features. The user's image had 3, but we have 4 content sections.
  const arrowY = useTransform(scrollYProgress, [0, 1/3, 2/3, 1], ['20%', '40%', '60%', '80%']);

  return (
    <div ref={targetRef} className="relative h-[350vh] w-full">
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden bg-black">
        <div className="relative flex w-full max-w-7xl items-center justify-center p-8">
          
          {/* Left Indicators - 4 to match features */}
          <div className="absolute left-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-6">
            {features.map((_, index) => (
              <div
                key={index}
                className={cn(
                  'h-8 w-1 rounded-full bg-white transition-opacity duration-300',
                  activeFeatureIndex === index ? 'opacity-100' : 'opacity-30'
                )}
              />
            ))}
          </div>

          {/* Image Panel */}
          <div className="relative w-1/2 h-[600px] rounded-3xl overflow-hidden">
            <AnimatePresence initial={false}>
                <motion.div
                  key={activeFeatureIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                  className="absolute inset-0"
                >
                  <Image
                    src={features[activeFeatureIndex].image}
                    alt={features[activeFeatureIndex].title}
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-orange-500/40 mix-blend-multiply" />
                </motion.div>
            </AnimatePresence>
          </div>

          {/* Content Panel */}
          <div className="relative w-[45%] -ml-16">
            <motion.div
              className="absolute left-0 w-8 h-8 bg-background transform -translate-x-1/2 rotate-45"
              style={{
                clipPath: 'polygon(50% 0%, 0% 50%, 50% 100%)',
                top: arrowY,
              }}
            />
            <div className="bg-background text-card-foreground p-16 rounded-3xl shadow-2xl h-[450px] flex flex-col justify-center">
               <AnimatePresence mode="wait">
                  <motion.div
                    key={activeFeatureIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, ease: 'circOut' }}
                    className="space-y-4"
                  >
                    <h2 className="text-4xl font-bold font-playfair text-foreground">
                      {features[activeFeatureIndex].title}
                    </h2>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      {features[activeFeatureIndex].description}
                    </p>
                  </motion.div>
               </AnimatePresence>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};


// Original Mobile Component
const MobileDemo = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [autorotate, setAutorotate] = useState(true);

    useEffect(() => {
        if (!autorotate) return;
        const interval = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % features.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [autorotate]);

    const handleManualChange = (index: number) => {
        setAutorotate(false);
        setActiveIndex(index);
    };

    return (
        <div className="w-full max-w-6xl mx-auto px-4 py-12 md:py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-playfair mb-4">
              Experience the Power of Trac
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              A comprehensive suite of tools designed to help you capture, analyze, and improve your work.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Features List (Left side on desktop) */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              {features.map((feature, index) => (
                <button
                  key={index}
                  onClick={() => handleManualChange(index)}
                  className={cn(
                    "text-left p-6 rounded-xl transition-all duration-300 border border-transparent",
                    activeIndex === index
                      ? "bg-secondary/50 border-secondary shadow-sm scale-[1.02]"
                      : "hover:bg-muted/50 hover:scale-[1.01]"
                  )}
                >
                  <h3
                    className={cn(
                      "font-semibold text-lg mb-2 transition-colors",
                      activeIndex === index ? "text-primary" : "text-foreground"
                    )}
                  >
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </button>
              ))}
            </div>

            {/* Image Display (Right side on desktop) */}
            <div className="lg:col-span-8 relative aspect-[16/10] bg-muted/20 rounded-2xl overflow-hidden shadow-2xl border border-border/50">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="absolute inset-0 flex items-center justify-center p-4 md:p-8"
                >
                  <div className="relative w-full h-full rounded-lg overflow-hidden shadow-lg bg-background">
                    <Image
                      src={features[activeIndex].image}
                      alt={features[activeIndex].title}
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                </motion.div>
              </AnimatePresence>
              
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 lg:hidden z-10">
                {features.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleManualChange(idx)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      activeIndex === idx ? "bg-primary w-6" : "bg-primary/30"
                    )}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
    );
}

// Main component that switches between Desktop and Mobile
export default function TracDairyDemo() {
  return (
    <>
      <div className="hidden lg:block">
        <DesktopDemo />
      </div>
      <div className="lg:hidden">
        <MobileDemo />
      </div>
    </>
  )
}
