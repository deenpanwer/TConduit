"use client";

import React, { useState, useMemo, memo, useRef } from "react";
import { format } from "date-fns";
import { Clock, Hash, ZoomIn, Image as ImageIcon, ChevronDown, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface WorkHistoryProps {
  timeEntries: any[];
  screenshots: any[];
  onLoadMore: () => void;
  hasMore: boolean;
}

// Helper to extract JS Date safely
const getDate = (ts: any) => {
  if (!ts) return new Date(0);
  if (ts.toDate) return ts.toDate();
  if (ts instanceof Date) return ts;
  if (ts.seconds) return new Date(ts.seconds * 1000);
  return new Date(ts);
};

const formatDuration = (seconds: number) => {
  if (!seconds || seconds <= 0) return "0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  
  const parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (h === 0 && m === 0 && s > 0) parts.push(`${s}s`);
  
  return parts.join(' ') || "0m";
};

const SkeletonItem = () => (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 p-6 rounded-[2.5rem] bg-secondary/5 border border-dashed border-border/50 animate-pulse mb-6">
        <div className="xl:col-span-3 flex flex-col justify-between space-y-4">
            <div className="flex items-center gap-4">
                <div className="size-14 rounded-2xl bg-muted shrink-0" />
                <div className="space-y-2">
                    <div className="h-3 w-16 bg-muted rounded" />
                    <div className="h-3 w-24 bg-muted rounded" />
                </div>
            </div>
            <div className="h-4 w-full bg-muted rounded" />
        </div>
        <div className="xl:col-span-9">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {[1,2,3,4,5].map(i => (
                    <div key={i} className="aspect-video rounded-2xl bg-muted/40" />
                ))}
            </div>
        </div>
    </div>
);

const ClusterItem = memo(({ entry, idx, onZoom }: { entry: any, idx: number, onZoom: (url: string) => void }) => {
  const startTimeStr = entry.startTime.getTime() > 0 ? format(entry.startTime, 'hh:mm a') : '--:--';
  const endTimeStr = entry.endTime.getTime() > 0 ? format(entry.endTime, 'hh:mm a') : '--:--';

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ 
        duration: 0.4, 
        delay: (idx % 5) * 0.05,
        layout: { duration: 0.3 }
      }}
      className="group grid grid-cols-1 xl:grid-cols-12 gap-6 p-6 rounded-[2.5rem] bg-white dark:bg-[#111113] border border-gray-100 dark:border-white/5 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 transition-all mb-6 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

      {/* 1. Time & Meta (4 cols) */}
      <div className="xl:col-span-4 flex flex-col justify-center space-y-4 relative z-10">
          <div className="flex items-center gap-4">
              <div className="flex flex-col items-center justify-center p-2 text-center transition-colors bg-gray-50 border border-gray-100 rounded-2xl shadow-sm w-28 h-28 dark:bg-white/5 dark:border-white/10 shrink-0 group-hover:border-primary/30">
                  <p className="text-2xl font-black leading-none text-primary">{startTimeStr}</p>
                  <p className="my-1 text-xs font-bold text-muted-foreground">to</p>
                  <p className="text-lg font-bold leading-none text-primary">{endTimeStr}</p>
              </div>
              <div className="space-y-2">
                  <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-primary/10">
                      {entry.projectName || "No Project"}
                  </span>
                  <p className="flex items-center gap-1.5 text-sm font-bold text-emerald-500 uppercase">
                      <Clock size={12} className="shrink-0" />
                      {formatDuration(entry.duration)}
                  </p>
              </div>
          </div>
          <h4 className="pr-4 text-xs font-semibold leading-relaxed tracking-wide text-muted-foreground group-hover:text-foreground transition-colors">
              {entry.description || "No details for this session."}
          </h4>
      </div>

      {/* 2. Visual Proof (8 cols) */}
      <div className="xl:col-span-8 relative z-10">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {entry.images.length > 0 ? (
                  entry.images.map((img: any, i: number) => (
                      <div key={img.id || i} className="relative aspect-video rounded-2xl overflow-hidden bg-muted group/img border border-border/50 shadow-sm">
                          <img 
                              src={img.redactedUrl || img.url || img.imageUrl || img.activity?.cloudinaryUrl} 
                              className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110" 
                              alt="Work screenshot" 
                              loading="lazy"
                          />
                          <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover/img:opacity-100 transition-all duration-300 flex items-center justify-center">
                              <button 
                                  onClick={() => onZoom(img.redactedUrl || img.url || img.imageUrl || img.activity?.cloudinaryUrl)}
                                  className="size-10 bg-white rounded-xl text-primary flex items-center justify-center shadow-xl hover:scale-110 active:scale-90 transition-all"
                              >
                                  <ZoomIn size={18} />
                              </button>
                          </div>
                          <div className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10">
                              <span className="text-[8px] font-black text-white uppercase tracking-tighter">
                                  {format(getDate(img.timestamp), 'hh:mm a')}
                              </span>
                          </div>
                      </div>
                  ))
              ) : (
                  <div className="col-span-full h-24 flex items-center justify-center border-2 border-dashed border-gray-100 dark:border-white/5 rounded-[2rem] bg-gray-50/50 dark:bg-white/5">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground/30">
                          <ImageIcon size={20} />
                          <span className="text-[9px] font-black uppercase tracking-[0.2em]">No Screenshots Recorded</span>
                      </div>
                  </div>
              )}
          </div>
      </div>
    </motion.div>
  );
});

ClusterItem.displayName = "ClusterItem";

export function WorkHistory({ timeEntries, screenshots, onLoadMore, hasMore }: WorkHistoryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // State and refs for zoom/pan functionality
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const isDragging = useRef(false);
  const lastPointerPosition = useRef({ x: 0, y: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const clusters = useMemo(() => {
    const sortedScreenshots = [...screenshots].sort((a, b) => getDate(b.timestamp).getTime() - getDate(a.timestamp).getTime());
    return timeEntries.map(entry => {
      const start = getDate(entry.startTime).getTime();
      const end = getDate(entry.endTime).getTime();
      const relatedScreenshots = sortedScreenshots.filter(s => {
        const sTime = getDate(s.timestamp).getTime();
        return sTime >= (start - 30000) && sTime <= (end + 30000);
      });
      return {
        ...entry,
        startTime: new Date(start),
        endTime: new Date(end),
        images: relatedScreenshots.slice(0, 5)
      };
    });
  }, [timeEntries, screenshots]);

  const handleLoadMore = () => {
    setIsSyncing(true);
    onLoadMore();
    setTimeout(() => setIsSyncing(false), 1200);
  };

  // Handlers for image interaction
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (imageContainerRef.current) {
        e.preventDefault();
        const scaleAmount = e.deltaY > 0 ? -0.1 : 0.1;
        setTransform(prev => {
            const newScale = Math.min(Math.max(prev.scale + scaleAmount, 1), 4);
            if (newScale <= 1) {
                return { scale: 1, x: 0, y: 0 };
            }
            return { ...prev, scale: newScale };
        });
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (transform.scale > 1) {
      isDragging.current = true;
      lastPointerPosition.current = { x: e.clientX, y: e.clientY };
      e.currentTarget.style.cursor = 'grabbing';
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging.current && transform.scale > 1) {
        const deltaX = e.clientX - lastPointerPosition.current.x;
        const deltaY = e.clientY - lastPointerPosition.current.y;
        setTransform(prev => ({
            ...prev,
            x: prev.x + deltaX,
            y: prev.y + deltaY,
        }));
        lastPointerPosition.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = false;
    if (transform.scale > 1) {
        e.currentTarget.style.cursor = 'grab';
    } else {
        e.currentTarget.style.cursor = 'default';
    }
  };

  if (timeEntries.length === 0) {
    return (
      <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-xl animate-pulse">
        <div className="h-6 w-48 bg-muted rounded-full mb-10" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-secondary/20 rounded-[2rem] border border-transparent" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden">
      <div className="flex items-center justify-between mb-10">
        <div>
            <h3 className="text-xl font-black uppercase tracking-tighter">Work Log</h3>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">A timeline of work sessions.</p>
        </div>
        <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20 shadow-inner">
            <Hash size={20} />
        </div>
      </div>

      <div className="relative">
        <AnimatePresence initial={false}>
          {clusters.map((entry, idx) => (
            <ClusterItem
              key={entry.id || idx}
              entry={entry}
              idx={idx}
              onZoom={setSelectedImage}
            />
          ))}
          {isSyncing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SkeletonItem />
              <SkeletonItem />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {hasMore && (
        <div className="mt-12 flex justify-center">
            <Button
                onClick={handleLoadMore}
                disabled={isSyncing}
                variant="outline"
                className="rounded-2xl h-14 px-10 font-black uppercase text-[10px] tracking-[0.2em] border-2 group hover:bg-primary hover:text-white transition-all active:scale-95 disabled:opacity-70"
            >
                {isSyncing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Load More
                    <ChevronDown className="ml-2 group-hover:translate-y-1 transition-transform" size={16} />
                  </>
                )}
            </Button>
        </div>
      )}

      {/* Image Zoom Modal */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => {
            if (!open) {
                setSelectedImage(null);
                setTransform({ scale: 1, x: 0, y: 0 }); // Reset zoom state on close
            }
        }}>
        <DialogContent className="w-full h-full max-w-[95vw] max-h-[90vh] p-0 flex items-center justify-center bg-transparent border-none shadow-none">
            <DialogTitle className="sr-only">Enlarged Screenshot</DialogTitle>
            <DialogDescription className="sr-only">A closer view of the work screenshot. You can zoom and move the image.</DialogDescription>
            {selectedImage && (
                <div
                    ref={imageContainerRef}
                    onWheel={handleWheel}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp} // End drag if cursor leaves the area
                    className="w-full h-full touch-none" // `touch-none` is critical for pointer events
                    style={{ cursor: transform.scale > 1 ? 'grab' : 'default' }}
                >
                    <img
                        src={selectedImage}
                        className="w-full h-full object-contain shadow-2xl"
                        style={{
                            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                            transition: isDragging.current ? 'none' : 'transform 0.15s ease-out',
                        }}
                        alt="Enlarged screenshot"
                    />
                </div>
            )}
             <div className="absolute bottom-4 left-1/2 -translate-x-1/2 transform text-sm font-semibold text-white/80 bg-black/50 px-3 py-1.5 rounded-lg pointer-events-none">
                Scroll to Zoom, Drag to Move
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
