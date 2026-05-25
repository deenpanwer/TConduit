"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, Image as ImageIcon, Loader2, Calendar, 
  ChevronRight, Maximize2, Search, ZoomIn, ZoomOut, RotateCcw
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";

interface TimeEntry {
  id: string;
  projectName: string;
  description: string;
  startTime: string;
  endTime: string;
  duration: number;
}

interface Screenshot {
  id: string;
  url: string;
  timestamp: string;
  windowTitle?: string;
  app?: string;
}

interface WorkAuditorProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  date: string;
  initialTab?: 'entries' | 'screenshots';
}

export function WorkAuditor({ isOpen, onClose, userId, userName, date, initialTab = "entries" }: WorkAuditorProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // State for Time Entries
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [hasMoreEntries, setHasMoreEntries] = useState(true);
  const [entriesOffset, setEntriesOffset] = useState(0);

  // State for Screenshots
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [screenshotsLoading, setScreenshotsLoading] = useState(false);
  const [hasMoreScreenshots, setHasMoreScreenshots] = useState(true);
  const [screenshotsPage, setScreenshotsPage] = useState(1);
  const [selectedScreenshot, setSelectedScreenshot] = useState<Screenshot | null>(null);

  const formatTime = (isoStr: string) => {
    try {
      if (!isoStr) return "--:--";
      return format(parseISO(isoStr), "hh:mm:ss a");
    } catch (e) {
      return "--:--";
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return "0m";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const fetchEntries = useCallback(async (reset = false) => {
    setEntriesLoading(true);
    const newOffset = reset ? 0 : entriesOffset;
    try {
      const entriesRef = collection(db, "users", userId, "timeEntries");
      const localStart = new Date(`${date}T00:00:00`);
      const localEnd = new Date(`${date}T23:59:59.999`);
      
      const startDay = localStart.toISOString();
      const endDay = localEnd.toISOString();
      
      let q = query(
        entriesRef,
        where("startTime", ">=", startDay),
        where("startTime", "<=", endDay),
        orderBy("startTime", "asc")
      );
      
      let snap = await getDocs(q);
      if (snap.empty) {
        // Try as Timestamps
        const startDate = localStart;
        const endDate = localEnd;
        q = query(
          entriesRef,
          where("startTime", ">=", startDate),
          where("startTime", "<=", endDate),
          orderBy("startTime", "asc")
        );
        snap = await getDocs(q);
      }

      const allEntries = snap.docs.map((doc: any) => {
        const data = doc.data();
        return {
          id: doc.id,
          projectName: data.projectName || "Internal",
          description: data.description || "",
          startTime: data.startTime?.toDate ? data.startTime.toDate().toISOString() : data.startTime,
          endTime: data.endTime?.toDate ? data.endTime.toDate().toISOString() : data.endTime,
          duration: data.duration || 0
        };
      });

      const paginated = allEntries.slice(newOffset, newOffset + 10);
      
      if (reset) setEntries(paginated);
      else setEntries(prev => [...prev, ...paginated]);
      
      setHasMoreEntries(allEntries.length > newOffset + 10);
      setEntriesOffset(newOffset + paginated.length);
    } catch (err) {
      console.error("Failed to fetch audit entries:", err);
    } finally {
      setEntriesLoading(false);
    }
  }, [userId, date, entriesOffset]);

  const fetchScreenshots = useCallback(async (reset = false) => {
    setScreenshotsLoading(true);
    const nextPage = reset ? 1 : screenshotsPage;
    try {
      const screenshotsRef = collection(db, "users", userId, "screenshots", date, "images");
      const q = query(screenshotsRef, orderBy("timestamp", "desc"));
      const snap = await getDocs(q);

      const allScreenshots = snap.docs.map((doc: any) => {
        const data = doc.data();
        const activeWindow = data.activity?.activeWindow || {};
        return {
          id: doc.id,
          url: data.url,
          timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : data.timestamp,
          windowTitle: activeWindow.title || data.windowTitle || "Unknown Window",
          app: activeWindow.owner || activeWindow.title || data.app || "Unknown App"
        };
      });

      const offset = (nextPage - 1) * 10;
      const paginated = allScreenshots.slice(offset, offset + 10);
      
      if (reset) setScreenshots(paginated);
      else setScreenshots(prev => [...prev, ...paginated]);
      
      setHasMoreScreenshots(allScreenshots.length > offset + 10);
      setScreenshotsPage(nextPage + 1);
    } catch (err) {
      console.error("Failed to fetch audit screenshots:", err);
    } finally {
      setScreenshotsLoading(false);
    }
  }, [userId, date, screenshotsPage]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      fetchEntries(true);
      fetchScreenshots(true);
    } else {
      // Reset state on close
      setEntries([]);
      setScreenshots([]);
      setEntriesOffset(0);
      setScreenshotsPage(1);
    }
  }, [isOpen, date, userId]); // Refetch if these change

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent 
        className="max-w-[95vw] w-[1200px] h-[90vh] flex flex-col p-0 gap-0 rounded-[2.5rem] overflow-hidden border-border/40 shadow-2xl bg-background/95 backdrop-blur-xl"
        onPointerDownOutside={(e) => {
          if (selectedScreenshot) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (selectedScreenshot) {
            e.preventDefault();
            setSelectedScreenshot(null);
          }
        }}
      >
        <DialogHeader className="p-8 pb-4 border-b border-border/50 bg-secondary/5 flex flex-row items-center justify-between shrink-0">
          <div className="space-y-1">
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter">{userName}</DialogTitle>
            <DialogDescription className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 flex items-center gap-2">
              <Calendar size={12} />
              {date ? format(parseISO(date), "EEEE, MMM dd, yyyy") : "Selected Date"}
            </DialogDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-secondary/20">
            <ChevronRight className="rotate-90" />
          </Button>
        </DialogHeader>

        <Tabs value={activeTab} className="flex-1 flex flex-col overflow-hidden" onValueChange={(val) => setActiveTab(val as 'entries' | 'screenshots')}>
          <div className="px-8 py-4 border-b border-border/50 flex items-center justify-between bg-card/30 shrink-0">
            <TabsList className="bg-secondary/20 p-1.5 rounded-2xl border border-border/50">
              <TabsTrigger value="entries" className="rounded-xl font-black uppercase tracking-widest text-[10px] gap-2 px-6 h-10 data-[state=active]:bg-background data-[state=active]:shadow-lg">
                <Clock size={14} />
                Time Entries
              </TabsTrigger>
              <TabsTrigger value="screenshots" className="rounded-xl font-black uppercase tracking-widest text-[10px] gap-2 px-6 h-10 data-[state=active]:bg-background data-[state=active]:shadow-lg">
                <ImageIcon size={14} />
                Visual Logs
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="entries" className="flex-1 overflow-hidden m-0 focus-visible:ring-0">
            <ScrollArea className="h-full">
              <div className="p-8 space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {entries.map((entry) => (
                    <div key={entry.id} className="group p-5 rounded-3xl border border-border/50 bg-secondary/5 hover:bg-secondary/10 hover:border-emerald-500/30 transition-all flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="size-12 rounded-2xl bg-background flex items-center justify-center border border-border/50 shadow-inner group-hover:scale-110 transition-transform">
                          <Clock className="size-5 text-emerald-500" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-black uppercase tracking-tight">{entry.projectName || "Internal Work"}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60 truncate max-w-[400px]">
                            {entry.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-8">
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-2">
                             <span className="text-xs font-black italic text-emerald-500">{formatTime(entry.startTime)}</span>
                             <ChevronRight size={12} className="opacity-30" />
                             <span className="text-xs font-black italic text-rose-500">{formatTime(entry.endTime)}</span>
                          </div>
                        </div>
                        
                        <Badge variant="secondary" className="h-10 rounded-xl px-4 font-black text-xs uppercase bg-background border-border/50">
                          {formatDuration(entry.duration)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                {hasMoreEntries && (
                  <div className="py-10 flex justify-center">
                    <Button 
                      onClick={() => fetchEntries()} 
                      disabled={entriesLoading}
                      variant="outline" 
                      className="rounded-2xl font-black uppercase tracking-widest text-[10px] h-12 px-10 border-border/50 hover:bg-secondary/20"
                    >
                      {entriesLoading ? <Loader2 className="animate-spin mr-2 size-4" /> : null}
                      {entriesLoading ? "Accessing Logs..." : "Load More Activity"}
                    </Button>
                  </div>
                )}
                
                {entries.length === 0 && !entriesLoading && (
                  <div className="h-64 flex flex-col items-center justify-center opacity-40 text-center space-y-4">
                    <Clock size={48} />
                    <p className="text-xs font-black uppercase tracking-widest">No activity entries recorded for this date</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="screenshots" className="flex-1 overflow-hidden m-0 focus-visible:ring-0">
            <ScrollArea className="h-full">
              <div className="p-8">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {screenshots.map((s) => (
                    <div 
                      key={s.id} 
                      onClick={() => setSelectedScreenshot(s)}
                      className="group relative aspect-video rounded-[1.5rem] overflow-hidden border border-border/50 bg-secondary/5 cursor-pointer hover:ring-2 hover:ring-emerald-500 transition-all shadow-lg"
                    >
                      <img src={s.url} alt={s.windowTitle} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                        <p className="text-[10px] font-black uppercase text-white tracking-tighter truncate">{s.app || "Desktop"}</p>
                        <p className="text-[8px] font-bold text-white/60 uppercase tracking-widest">{formatTime(s.timestamp)}</p>
                      </div>
                      <div className="absolute top-3 right-3 size-8 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                        <Maximize2 size={14} className="text-white" />
                      </div>
                    </div>
                  ))}
                </div>

                {hasMoreScreenshots && (
                  <div className="py-10 flex justify-center">
                    <Button 
                      onClick={() => fetchScreenshots()} 
                      disabled={screenshotsLoading}
                      variant="outline" 
                      className="rounded-2xl font-black uppercase tracking-widest text-[10px] h-12 px-10 border-border/50 hover:bg-secondary/20"
                    >
                      {screenshotsLoading ? <Loader2 className="animate-spin mr-2 size-4" /> : null}
                      {screenshotsLoading ? "Pulling Visuals..." : "Load More Evidence"}
                    </Button>
                  </div>
                )}

                {screenshots.length === 0 && !screenshotsLoading && (
                  <div className="h-64 flex flex-col items-center justify-center opacity-40 text-center space-y-4">
                    <ImageIcon size={48} />
                    <p className="text-xs font-black uppercase tracking-widest">No visual logs available for this date</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Fullscreen Screenshot Viewer - Inside DialogContent to receive pointer events */}
        {selectedScreenshot && (
          <div 
            className="absolute inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-10 animate-in fade-in duration-300"
            onClick={() => setSelectedScreenshot(null)}
          >
            <div className="absolute top-8 right-8 flex items-center gap-3 z-[110]">
              <Button 
                variant="outline"
                className="rounded-2xl bg-white/10 hover:bg-white/20 border-white/20 text-white font-black uppercase tracking-widest text-[10px] h-12"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedScreenshot(null);
                }}
              >
                Exit Viewer
              </Button>
            </div>
            
            <div className="relative group w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <TransformWrapper
                initialScale={1}
                minScale={0.5}
                maxScale={4}
                centerOnInit={true}
              >
                {({ zoomIn, zoomOut, resetTransform }) => (
                  <>
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/10 backdrop-blur-xl border border-white/20 p-2 rounded-2xl z-[130] opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => zoomIn()} className="text-white hover:bg-white/20 rounded-xl">
                        <ZoomIn size={18} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => zoomOut()} className="text-white hover:bg-white/20 rounded-xl">
                        <ZoomOut size={18} />
                      </Button>
                      <div className="w-px h-6 bg-white/20 mx-1" />
                      <Button variant="ghost" size="icon" onClick={() => resetTransform()} className="text-white hover:bg-white/20 rounded-xl">
                        <RotateCcw size={18} />
                      </Button>
                    </div>

                    <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-full !h-full flex items-center justify-center">
                      <img 
                        src={selectedScreenshot.url} 
                        alt={selectedScreenshot.windowTitle} 
                        className="max-w-[90vw] max-h-[80vh] rounded-3xl shadow-2xl border border-white/10 object-contain cursor-grab active:cursor-grabbing"
                      />
                    </TransformComponent>
                  </>
                )}
              </TransformWrapper>
              
              <div className="absolute -bottom-16 left-0 right-0 flex items-center justify-between px-2 pointer-events-none">
                <div className="space-y-1">
                  <p className="text-xl font-black text-white uppercase tracking-tighter">{selectedScreenshot.app || "Desktop Session"}</p>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{selectedScreenshot.windowTitle}</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-lg font-black italic text-emerald-400">{formatTime(selectedScreenshot.timestamp)}</span>
                  <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Timestamp</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
