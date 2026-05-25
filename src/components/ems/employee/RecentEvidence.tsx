'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ZoomIn, Camera, ChevronRight, Plus, Minus, RotateCcw, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

interface RecentEvidenceProps {
  screenshots: any[];
}

export function RecentEvidence({ screenshots = [] }: RecentEvidenceProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(10);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const visibleScreenshots = screenshots.slice(0, visibleCount);
  const hasMore = visibleCount < screenshots.length;

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    // Simulate a brief loading state for the skeleton effect
    setTimeout(() => {
      setVisibleCount(prev => prev + 10);
      setIsLoadingMore(false);
    }, 800);
  };

  const getDate = (ts: any) => {
    if (!ts) return new Date();
    if (ts.toDate) return ts.toDate();
    if (ts instanceof Date) return ts;
    if (ts.seconds) return new Date(ts.seconds * 1000);
    return new Date(ts);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Camera size={16} />
          </div>
          <h3 className="text-sm font-black uppercase tracking-widest">Recent Screenshots</h3>
        </div>
        {screenshots.length > 0 && (
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
            Showing {Math.min(visibleCount, screenshots.length)} of {screenshots.length}
          </span>
        )}
      </div>

      {screenshots.length > 0 ? (
        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x scroll-smooth">
          <AnimatePresence mode="popLayout">
            {visibleScreenshots.map((img, i) => (
              <motion.div
                key={img.id || i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                layout
                className="relative flex-none w-64 aspect-video rounded-2xl overflow-hidden bg-muted group border border-border/50 snap-start shadow-sm"
              >
                <img
                  src={img.redactedUrl || img.url || img.activity?.cloudinaryUrl}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  alt="Recent activity"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={() => setSelectedImage(img.redactedUrl || img.url || img.activity?.cloudinaryUrl)}
                    className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-all active:scale-90"
                  >
                    <ZoomIn size={20} />
                  </button>
                </div>
                <div className="absolute bottom-3 left-3 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10">
                  <span className="text-[9px] font-black text-white/90 uppercase tracking-tighter">
                    {format(getDate(img.timestamp), 'hh:mm:ss a')}
                  </span>
                </div>
              </motion.div>
            ))}

            {isLoadingMore && (
              <>
                {[1, 2, 3].map((n) => (
                  <div 
                    key={`skeleton-${n}`}
                    className="flex-none w-64 aspect-video rounded-2xl bg-muted animate-pulse border border-border/50"
                  />
                ))}
              </>
            )}
          </AnimatePresence>
          
          {hasMore && !isLoadingMore && (
              <button 
                onClick={handleLoadMore}
                className="flex-none w-32 flex flex-col items-center justify-center gap-3 text-muted-foreground/40 hover:text-primary transition-all group px-4"
              >
                  <div className="size-12 rounded-full border-2 border-dashed border-current flex items-center justify-center group-hover:scale-110 transition-transform">
                      <ChevronRight size={24} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-center leading-tight">Load<br/>More</span>
              </button>
          )}
        </div>
      ) : (
        <div className="w-full h-32 rounded-[2rem] border-2 border-dashed border-border/50 bg-muted/5 flex flex-col items-center justify-center gap-2">
           <div className="p-3 rounded-xl bg-muted/20 text-muted-foreground/20">
              <Camera size={24} />
           </div>
           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Visual logs awaiting synchronization</span>
        </div>
      )}

      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-[98vw] md:max-w-[90vw] h-[90vh] p-0 overflow-hidden bg-black/95 border-none flex flex-col">
          <DialogTitle className="sr-only">Activity Proof Image</DialogTitle>
          <DialogDescription className="sr-only">Zoomable screenshot of recent activity</DialogDescription>
          
          <div className="absolute top-4 right-4 z-50 flex gap-2">
             <button 
               onClick={() => setSelectedImage(null)}
               className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
             >
               <X size={20} />
             </button>
          </div>

          {selectedImage && (
            <TransformWrapper
              initialScale={1}
              initialPositionX={0}
              initialPositionY={0}
              centerOnInit
            >
              {({ zoomIn, zoomOut, resetTransform }) => (
                <>
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-6 py-3 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 shadow-2xl">
                    <button onClick={() => zoomOut()} className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors">
                      <Minus size={20} />
                    </button>
                    <div className="w-px h-4 bg-white/20" />
                    <button onClick={() => resetTransform()} className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors">
                      <RotateCcw size={18} />
                    </button>
                    <div className="w-px h-4 bg-white/20" />
                    <button onClick={() => zoomIn()} className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors">
                      <Plus size={20} />
                    </button>
                  </div>

                  <div className="flex-1 w-full h-full overflow-hidden cursor-move">
                    <TransformComponent
                      wrapperClass="!w-full !h-full"
                      contentClass="!w-full !h-full flex items-center justify-center"
                    >
                      <img
                        src={selectedImage}
                        className="max-w-full max-h-full object-contain"
                        alt="Enlarged activity proof"
                        onDragStart={(e) => e.preventDefault()}
                      />
                    </TransformComponent>
                  </div>
                </>
              )}
            </TransformWrapper>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
