"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Button } from "@/components/ui/button-v2";
import { cn } from "@/lib/utils";
import { ReactNode } from 'react';
import { motion, Variants } from 'framer-motion';
import { Download } from "lucide-react";

export default function HeroSection() {
  const gradientRef = useRef<HTMLDivElement>(null);

  const transitionVariants = {
    item: {
      hidden: {
        opacity: 0,
        filter: "blur(12px)",
        y: 12,
      },
      visible: {
        opacity: 1,
        filter: "blur(0px)",
        y: 0,
        transition: {
          type: "spring",
          bounce: 0.3,
          duration: 1.5,
        },
      },
    },
  };

  useEffect(() => {
    if (!gradientRef.current) return;
    gsap.fromTo(
      gradientRef.current,
      { opacity: 0, y: -30 },
      { opacity: 1, y: 0, duration: 1.6, ease: "power3.out" }
    );
  }, []);

  return (
    <div className="isolate p-2 sm:p-6 overflow-hidden rounded-xl text-foreground transition-colors duration-300 relative">
        <div className="relative w-full">
        {/* Gradient Background Container */}
        <div
            ref={gradientRef}
            className="absolute inset-0 -z-10 transition-colors duration-700 max-h-[90vh] rounded-2xl overflow-hidden"
        >
            {/* Light mode gradient */}
            <div 
                className="absolute inset-0 dark:hidden"
                style={{
                    backgroundImage: `
                        linear-gradient(180deg, #ffffff 0%, #FFEDD5 25%, #FFDAB9 50%, #FFB6C1 70%, #E0BBE4 85%, #F3E5F5 100%),
                        radial-gradient(at 20% 30%, #ffffff33 0%, transparent 60%),
                        radial-gradient(at 80% 70%, #f3e5f533 0%, transparent 70%)
                    `,
                    backgroundBlendMode: "overlay, screen",
                    filter: "blur(40px)",
                }}
            />
            {/* Dark mode gradient */}
            <div 
                className="absolute inset-0 hidden dark:block"
                style={{
                    backgroundImage: `
                        linear-gradient(180deg, #000000 0%, #0a192f 25%, #112240 50%, #1e1b4b 70%, #4c1d95 85%, #020617 100%),
                        radial-gradient(at 20% 30%, rgba(255, 255, 255, 0.08) 0%, transparent 60%),
                        radial-gradient(at 80% 70%, rgba(255, 255, 255, 0.08) 0%, transparent 70%)
                    `,
                    filter: "blur(40px)",
                }}
            />
        </div>

        <div className="relative z-10 pt-16 pb-10 sm:pt-24 sm:pb-20 text-left px-6 lg:px-12">
            <div className="relative max-w-6xl flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="max-w-3xl">
                    <h1 className="text-4xl sm:text-6xl md:text-7xl font-poppins font-bold tracking-tighter-custom text-foreground leading-[1.1] uppercase">
                        No resumes.<br />
                        No interviews.<br />
                        Just competence.
                    </h1>
                    <p className="mt-6 text-lg sm:text-xl text-muted-foreground font-poppins max-w-2xl leading-[1.4] tracking-tighter-custom">
                        Companies use Trac to hire based on actual output. Your background, location, and credentials don’t matter, only the work does.
                    </p>
                </div>
                
                <AnimatedGroup
                    variants={{
                    container: {
                        visible: {
                        transition: {
                            staggerChildren: 0.05,
                            delayChildren: 0.75,
                        },
                        },
                    },
                    ...transitionVariants,
                    }}
                    className="flex-shrink-0 md:-translate-x-12 md:-translate-y-10"
                >
                    <div key={1} className="bg-foreground/10 rounded-full p-0.5 shadow-lg shadow-foreground/5 dark:shadow-none mb-2">
                    <Button asChild size="lg" className="rounded-full px-12 h-16 text-xl font-poppins bg-foreground text-background hover:bg-foreground/90 border-none transition-all">
                        <a href="/TracDairy-Installer.exe" download className="flex items-center gap-2">
                            <Download className="w-7 h-7" />
                            download for windows
                        </a>
                    </Button>
                    </div>
                </AnimatedGroup>
            </div>
        </div>

        <AnimatedGroup
            variants={{
            container: {
                visible: {
                transition: {
                    staggerChildren: 0.05,
                    delayChildren: 0.75,
                },
                },
            },
            ...transitionVariants,
            }}
        >
            <div className="relative overflow-hidden px-6 lg:px-12 mt-8">
            <div
                aria-hidden
                className="bg-gradient-to-b from-transparent to-background absolute inset-0 z-10 from-35%"
            />
            <div className="inset-shadow-2xs ring-foreground/5 bg-background relative max-w-6xl overflow-hidden rounded-t-2xl border border-border border-b-0 p-2 sm:p-4 shadow-2xl shadow-foreground/5 ring-1">
                    <video
                        className="relative rounded-xl w-full aspect-[16/12] object-cover border border-border dark:hidden pointer-events-none"
                        src="/dairy/demo-light.mp4"
                        autoPlay
                        loop
                        muted
                        playsInline
                    />
                    <video
                        className="relative rounded-xl w-full aspect-[16/12] object-cover border border-border hidden dark:block pointer-events-none"
                        src="/dairy/demo-dark.mp4"
                        autoPlay
                        loop
                        muted
                        playsInline
                    />
            </div>
            </div>
        </AnimatedGroup>
        </div>    
    </div>
  );
}


type PresetType =
  | 'fade'
  | 'slide'
  | 'scale'
  | 'blur'
  | 'blur-slide'
  | 'zoom'
  | 'flip'
  | 'bounce'
  | 'rotate'
  | 'swing';

type AnimatedGroupProps = {
  children: ReactNode;
  className?: string;
  variants?: {
    container?: Variants;
    item?: Variants;
  };
  preset?: PresetType;
};

const defaultContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const defaultItemVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const presetVariants: Record<
  PresetType,
  { container: Variants; item: Variants }
> = {
  fade: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
    },
  },
  slide: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
    },
  },
  scale: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, scale: 0.8 },
      visible: { opacity: 1, scale: 1 },
    },
  },
  blur: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, filter: 'blur(4px)' },
      visible: { opacity: 1, filter: 'blur(0px)' },
    },
  },
  'blur-slide': {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, filter: 'blur(4px)', y: 20 },
      visible: { opacity: 1, filter: 'blur(0px)', y: 0 },
    },
  },
  zoom: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, scale: 0.5 },
      visible: {
        opacity: 1,
        scale: 1,
        transition: { type: "spring" as const, stiffness: 300, damping: 20 },
      },
    },
  },
  flip: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, rotateX: -90 },
      visible: {
        opacity: 1,
        rotateX: 0,
        transition: { type: "spring" as const, stiffness: 300, damping: 20 },
      },
    },
  },
  bounce: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, y: -50 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { type: "spring" as const, stiffness: 400, damping: 10 },
      },
    },
  },
  rotate: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, rotate: -180 },
      visible: {
        opacity: 1,
        rotate: 0,
        transition: { type: "spring" as const, stiffness: 200, damping: 15 },
      },
    },
  },
  swing: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, rotate: -10 },
      visible: {
        opacity: 1,
        rotate: 0,
        transition: { type: "spring" as const, stiffness: 300, damping: 8 },
      },
    },
  },
};

function AnimatedGroup({
  children,
  className,
  variants,
  preset,
}: AnimatedGroupProps) {
  const selectedVariants = preset
    ? presetVariants[preset]
    : { container: defaultContainerVariants, item: defaultItemVariants };
  const containerVariants = variants?.container || selectedVariants.container;
  const itemVariants = variants?.item || selectedVariants.item;

  return (
    <motion.div
      initial='hidden'
      animate='visible'
      variants={containerVariants}
      className={cn(className)}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div key={index} variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

export { AnimatedGroup };