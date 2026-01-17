
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import useEmblaCarousel from 'embla-carousel-react'


const features = [
  {
    title: "Reporting Overview",
    description: "Get a high-level overview of key performance metrics and activity trends. Monitor your team's output at a glance.",
    image: "/dairy/demo2.png",
  },
  {
    title: "Deep Visual Analytics",
    description: "Understand precisely where your time goes with our detailed project distribution charts. Visualize your focus across different applications and strategic initiatives.",
    image: "/dairy/demo2.png",
  },
  {
    title: "Activity Trend Analysis",
    description: "Track productivity patterns over time to identify opportunities for improvement and celebrate your team's successes.",
    image: "/dairy/demo3.png",
  },
];

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
  
  const arrowY = useTransform(scrollYProgress, [0, 0.5, 1], ['25%', '50%', '75%']);

  return (
    <div ref={targetRef} className="relative h-[300vh] w-full">
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden bg-black p-10">
        <div className="relative flex w-full max-w-6xl items-center justify-center">
          
          <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4">
            {features.map((_, index) => (
              <div
                key={index}
                className={cn(
                  'w-1 rounded-full bg-white transition-all duration-300',
                  activeFeatureIndex === index ? 'opacity-100 h-8' : 'opacity-30 h-4'
                )}
              />
            ))}
          </div>

          <div className="relative w-1/2 h-[600px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeFeatureIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0"
                >
                    <Image
                      src={features[activeFeatureIndex].image}
                      alt={features[activeFeatureIndex].title}
                      fill
                      className="object-contain rounded-3xl"
                      priority
                    />
                </motion.div>
              </AnimatePresence>
          </div>

          <div className="relative w-[45%] -ml-32">
            <motion.div
              className="absolute left-0 w-8 h-8 bg-white transform -translate-x-1/2 rotate-45"
              style={{ top: arrowY }}
            />
            <div className="bg-white text-slate-900 p-16 rounded-3xl shadow-2xl h-[450px] flex flex-col justify-center">
               <AnimatePresence mode="wait">
                  <motion.div
                    key={activeFeatureIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, ease: 'circOut' }}
                    className="space-y-6"
                  >
                    <h2 className="text-4xl font-bold font-playfair text-slate-900">
                      {features[activeFeatureIndex].title}
                    </h2>
                    <p className="text-lg text-slate-600 leading-relaxed">
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


const MobileDemo = () => {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
    const [selectedIndex, setSelectedIndex] = useState(0);
  
    const onSelect = useCallback(() => {
      if (!emblaApi) return;
      setSelectedIndex(emblaApi.selectedScrollSnap());
    }, [emblaApi]);
  
    useEffect(() => {
      if (!emblaApi) return;
      onSelect();
      emblaApi.on("select", onSelect);
      return () => emblaApi.off("select", onSelect);
    }, [emblaApi, onSelect]);

    const FeatureCard = ({ title, description }: { title: string; description: string; }) => (
        <div className="bg-black rounded-3xl p-2 w-full h-full">
            <div className="bg-white rounded-[1.25rem] overflow-hidden shadow-xl h-full flex flex-col">
                <div className="relative">
                    <div style={{ clipPath: 'url(#mobile-curve)' }} className="relative">
                        <div className="aspect-[4/3] relative">
                            <Image 
                              src="https://picsum.photos/seed/mobile-city/400/300"
                              alt={title} 
                              fill 
                              className="object-cover"
                              data-ai-hint="city night"
                            />
                            <div className="absolute inset-0 bg-orange-500/70 mix-blend-multiply"/>
                        </div>
                    </div>
                    <svg width="0" height="0">
                        <defs>
                            <clipPath id="mobile-curve" clipPathUnits="objectBoundingBox">
                                <path d="M 0,0 H 1 V 0.9 Q 0.5,1 0,0.9 Z" />
                            </clipPath>
                        </defs>
                    </svg>
                </div>
                <div className="p-8 text-left flex-grow flex flex-col justify-center">
                    <h3 className="text-3xl font-bold text-slate-900 mb-4 leading-tight">
                        {title}
                    </h3>
                    <p className="text-slate-600 leading-relaxed text-base">
                        {description}
                    </p>
                </div>
            </div>
        </div>
    );
  
    return (
      <div className="w-full bg-black py-16 px-4">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {features.map((feature, index) => (
              <div className="flex-shrink-0 flex-grow-0 basis-full min-w-0 px-4" key={index}>
                <FeatureCard title={feature.title} description={feature.description} />
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-center gap-2 mt-8">
            {features.map((_, index) => (
                <button
                    key={index}
                    onClick={() => emblaApi?.scrollTo(index)}
                    className={cn(
                        "w-2 h-2 rounded-full transition-all duration-300",
                        index === selectedIndex ? "bg-white w-6" : "bg-white/30"
                    )}
                />
            ))}
        </div>
      </div>
    );
  };

// Main component that switches between Desktop and Mobile
export default function DairyDemo() {
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
