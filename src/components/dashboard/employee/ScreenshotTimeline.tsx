"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, ChevronLeft, ChevronRight, Maximize2, Clock, Eye, Keyboard, MousePointer2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ScreenshotTimelineProps {
  screenshots: any[];
}

export function ScreenshotTimeline({ screenshots }: ScreenshotTimelineProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    let interval: any;
    if (isPlaying && screenshots.length > 0) {
      interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % screenshots.length);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, screenshots.length]);

  if (screenshots.length === 0) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 w-48 bg-muted rounded-full ml-2" />
        <div className="bg-secondary/30 border border-border rounded-[3rem] aspect-video w-full" />
      </div>
    );
  }

  const current = screenshots[currentIndex];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <div>
            <h3 className="text-xl font-black uppercase tracking-tighter">Oversight Timeline</h3>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Visual performance verification</p>
        </div>
        <div className="flex items-center gap-2">
            <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsPlaying(!isPlaying)}
                className="rounded-xl font-black uppercase text-[10px] tracking-widest h-10 px-4"
            >
                {isPlaying ? <Pause size={14} className="mr-2 fill-current" /> : <Play size={14} className="mr-2 fill-current" />}
                {isPlaying ? "Pause Stream" : "Play Timelapse"}
            </Button>
        </div>
      </div>

      <div className="relative group">
        {/* Main Display */}
        <div className={cn(
            "bg-secondary/30 border border-border rounded-[3rem] overflow-hidden aspect-video relative shadow-2xl transition-all duration-500",
            isFullscreen && "fixed inset-0 z-[200] rounded-none bg-black"
        )}>
            <AnimatePresence mode="wait">
                <motion.img 
                    key={current.id}
                    src={current.base64}
                    initial={{ opacity: 0, scale: 1.02 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full object-contain"
                />
            </AnimatePresence>

            {/* Overlay Info */}
            <div className="absolute bottom-0 inset-x-0 p-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end justify-between text-white pointer-events-none translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                            {current.mode || 'SCREEN'}
                        </div>
                        <span className="text-sm font-bold opacity-80">{current.sourceName || 'Main Display'}</span>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest opacity-60">
                        <span className="flex items-center gap-1.5"><Clock size={12} /> {format(current.timestamp?.toDate ? current.timestamp.toDate() : new Date(), 'HH:mm:ss')}</span>
                        <span className="flex items-center gap-1.5"><Keyboard size={12} /> {current.activity?.keystrokes || 0} Keys</span>
                        <span className="flex items-center gap-1.5"><MousePointer2 size={12} /> {current.activity?.mouseClicks || 0} Clicks</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 pointer-events-auto">
                    <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl transition-colors">
                        <Maximize2 size={20} />
                    </button>
                </div>
            </div>

            {/* Navigation Controls */}
            <div className="absolute inset-y-0 left-4 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                    onClick={() => setCurrentIndex((prev) => (prev - 1 + screenshots.length) % screenshots.length)}
                    className="size-12 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center hover:bg-black/60 transition-colors"
                >
                    <ChevronLeft size={24} className="text-white" />
                </button>
            </div>
            <div className="absolute inset-y-0 right-4 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                    onClick={() => setCurrentIndex((prev) => (prev + 1) % screenshots.length)}
                    className="size-12 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center hover:bg-black/60 transition-colors"
                >
                    <ChevronRight size={24} className="text-white" />
                </button>
            </div>
        </div>

        {/* Thumbnail Scrubber */}
        <div className="mt-6 flex gap-3 overflow-x-auto pb-4 custom-scrollbar px-2 snap-x">
            {screenshots.map((s, idx) => (
                <button 
                    key={s.id}
                    onClick={() => { setCurrentIndex(idx); setIsPlaying(false); }}
                    className={cn(
                        "relative shrink-0 w-32 aspect-video rounded-xl overflow-hidden border-2 transition-all snap-start",
                        currentIndex === idx ? "border-primary scale-105 shadow-lg" : "border-transparent opacity-50 hover:opacity-80"
                    )}
                >
                    <img src={s.base64} className="w-full h-full object-cover" />
                    <div className="absolute bottom-1 right-1 text-[8px] font-black text-white bg-black/60 px-1 rounded">
                        {format(s.timestamp?.toDate ? s.timestamp.toDate() : new Date(), 'HH:mm')}
                    </div>
                </button>
            ))}
        </div>
      </div>
    </div>
  );
}
