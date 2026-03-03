'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ZoomIn, Camera, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { GlassCard } from '../main/shared/GlassCard';

interface RecentEvidenceProps {
  screenshots: any[];
}

export function RecentEvidence({ screenshots = [] }: RecentEvidenceProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const last10 = screenshots.slice(0, 10);

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
        {last10.length > 0 && <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Latest 10 Captures</span>}
      </div>

      {last10.length > 0 ? (
        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x">
          {last10.map((img, i) => (
            <motion.div
              key={img.id || i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="relative flex-none w-48 aspect-video rounded-2xl overflow-hidden bg-muted group border border-border/50 snap-start shadow-sm"
            >
              <img
                src={img.url || img.activity?.cloudinaryUrl}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                alt="Recent activity"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={() => setSelectedImage(img.url || img.activity?.cloudinaryUrl)}
                  className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-all active:scale-90"
                >
                  <ZoomIn size={18} />
                </button>
              </div>
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm">
                <span className="text-[8px] font-black text-white/90 uppercase tracking-tighter">
                  {format(getDate(img.timestamp), 'HH:mm:ss')}
                </span>
              </div>
            </motion.div>
          ))}
          
          {screenshots.length > 10 && (
              <div className="flex-none w-20 flex flex-col items-center justify-center gap-2 text-muted-foreground/40 hover:text-primary transition-colors cursor-pointer">
                  <div className="size-10 rounded-full border-2 border-dashed border-current flex items-center justify-center">
                      <ChevronRight size={20} />
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest">View All</span>
              </div>
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
        <DialogContent className="max-w-[95vw] md:max-w-5xl p-0 overflow-hidden bg-black/90 border-none">
          <DialogTitle className="sr-only">Activity Proof Image</DialogTitle>
          <DialogDescription className="sr-only">Enlarged screenshot of recent activity</DialogDescription>
          {selectedImage && (
            <div className="relative aspect-video w-full h-full flex items-center justify-center">
              <img
                src={selectedImage}
                className="max-w-full max-h-[85vh] object-contain shadow-2xl"
                alt="Enlarged activity proof"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
