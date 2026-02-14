"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Clock, Hash, ZoomIn, Image as ImageIcon, ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface WorkHistoryProps {
  timeEntries: any[];
  screenshots: any[];
  onLoadMore: () => void;
}

export function WorkHistory({ timeEntries, screenshots, onLoadMore }: WorkHistoryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Helper to extract JS Date safely
  const getDate = (ts: any) => {
    if (!ts) return new Date(0);
    if (ts.toDate) return ts.toDate();
    if (ts instanceof Date) return ts;
    if (ts.seconds) return new Date(ts.seconds * 1000);
    return new Date(ts);
  };

  // Process activity clusters: Map time entries to their screenshots
  const clusters = useMemo(() => {
    // Note: timeEntries are already sorted and limited by the parent (EmployeeDetailPage)
    return timeEntries.map(entry => {
      const start = getDate(entry.startTime);
      const end = getDate(entry.endTime);
      
      // Find screenshots within this time entry's interval
      const relatedScreenshots = screenshots.filter(s => {
        const sTime = getDate(s.timestamp);
        return sTime >= start && sTime <= end;
      }).sort((a, b) => getDate(b.timestamp).getTime() - getDate(a.timestamp).getTime());

      return {
        ...entry,
        startTime: start,
        endTime: end,
        images: relatedScreenshots.slice(0, 5) // Maximum of 5 screenshots per entry as requested
      };
    });
  }, [timeEntries, screenshots]);

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
            <h3 className="text-xl font-black uppercase tracking-tighter">Engagement Log</h3>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Chronological activity clusters (Max 5 images per segment)</p>
        </div>
        <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20 shadow-inner">
            <Hash size={20} />
        </div>
      </div>

      <div className="space-y-6">
        {clusters.map((entry, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (idx % 10) * 0.05 }}
            key={entry.id || idx} 
            className="group grid grid-cols-1 xl:grid-cols-12 gap-6 p-6 rounded-[2.5rem] bg-secondary/10 border border-transparent hover:border-primary/10 hover:bg-secondary/20 transition-all"
          >
            {/* 1. Time & Meta (3 cols) */}
            <div className="xl:col-span-3 flex flex-col justify-between space-y-4">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center justify-center size-14 rounded-2xl bg-background border border-border shadow-sm shrink-0">
                        <span className="text-[10px] font-black text-primary uppercase">
                            {entry.startTime.getTime() > 0 ? format(entry.startTime, 'HH:mm') : '--:--'}
                        </span>
                        <div className="w-0.5 h-2 bg-muted-foreground/20 my-0.5" />
                        <span className="text-[10px] font-black text-muted-foreground uppercase">
                            {entry.endTime.getTime() > 0 ? format(entry.endTime, 'HH:mm') : '--:--'}
                        </span>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="bg-primary/10 text-primary text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                                {entry.projectName || "General"}
                            </span>
                        </div>
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                            <Clock size={10} /> {Math.floor((entry.duration || 0) / 60)}m {(entry.duration || 0) % 60}s
                        </p>
                    </div>
                </div>
                <h4 className="text-xs font-bold uppercase tracking-tight text-foreground/80 leading-relaxed">
                    {entry.description || `Activity session within ${entry.projectName || 'environment'}.`}
                </h4>
            </div>

            {/* 2. Visual Proof (9 cols) */}
            <div className="xl:col-span-9">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {entry.images.length > 0 ? (
                        entry.images.map((img: any, i: number) => (
                            <div key={i} className="relative aspect-video rounded-2xl overflow-hidden bg-muted group/img border border-border/50">
                                <img 
                                    src={img.url || img.activity?.cloudinaryUrl} 
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110" 
                                    alt="Activity proof" 
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button 
                                        onClick={() => setSelectedImage(img.url || img.activity?.cloudinaryUrl)}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-all active:scale-90"
                                    >
                                        <ZoomIn size={14} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Zoom</span>
                                    </button>
                                </div>
                                <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm">
                                    <span className="text-[7px] font-black text-white/80 uppercase">
                                        {format(getDate(img.timestamp), 'HH:mm')}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full h-20 flex items-center justify-center border-2 border-dashed border-border rounded-2xl bg-muted/5">
                            <div className="flex items-center gap-3 text-muted-foreground/40">
                                <ImageIcon size={16} />
                                <span className="text-[10px] font-black uppercase tracking-widest">No visual logs for this segment</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-12 flex justify-center">
          <Button 
              onClick={onLoadMore}
              variant="outline" 
              className="rounded-2xl h-14 px-10 font-black uppercase text-[10px] tracking-[0.2em] border-2 group hover:bg-primary hover:text-white transition-all active:scale-95"
          >
              Load More Clusters 
              <ChevronDown className="ml-2 group-hover:translate-y-1 transition-transform" size={16} />
          </Button>
      </div>

      {/* Image Zoom Modal */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-[95vw] md:max-w-5xl p-0 overflow-hidden bg-black/90 border-none">
            <DialogTitle className="sr-only">Activity Proof Image</DialogTitle>
            <DialogDescription className="sr-only">Enlarged screenshot of employee activity</DialogDescription>
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