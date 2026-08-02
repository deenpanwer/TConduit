"use client";

import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Image as ImageIcon, Tag, Plus, Check, X, Hourglass, 
  ChevronLeft, ChevronRight, Loader2, AlertCircle, Sparkles, Filter,
  ZoomIn, ZoomOut, RotateCcw, ChevronDown, ChevronUp, Maximize2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { faker } from "@faker-js/faker";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { doc, updateDoc, collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { toast } from "sonner";

interface HourlyScreenshotTaggingProps {
  selectedEmployee: any;
  selectedDate: Date;
  hideBannerHeader?: boolean;
}

const PRESET_TAGS = ["#SEO", "#VideoEdit", "#Design", "#Coding", "#ClientCall", "#Documentation"];

export function HourlyScreenshotTagging({ selectedEmployee, selectedDate, hideBannerHeader }: HourlyScreenshotTaggingProps) {
  const [loading, setLoading] = useState(false);
  const [slotTags, setSlotTags] = useState<Record<string, string[]>>({});
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Hourly section collapse state
  const [collapsedHours, setCollapsedHours] = useState<Record<string, boolean>>({});

  // Active tagging popover state
  const [taggingSlotId, setTaggingSlotId] = useState<string | null>(null);
  const [customTagInput, setCustomTagInput] = useState("");

  const empId = selectedEmployee?.id || "demo_emp";
  const empName = selectedEmployee?.name || selectedEmployee?.displayName || "John Doe";
  const dateStr = selectedDate.toISOString().substring(0, 10);

  const [realScreenshots, setRealScreenshots] = useState<any[]>([]);

  // Fetch real screenshots for the active employee and date across nested paths
  useEffect(() => {
    if (!empId || empId === "demo_emp") {
      setLoading(false);
      setRealScreenshots([]);
      return;
    }

    setLoading(true);

    // Primary Path: users/{empId}/screenshots/{dateStr}/images (Electron Cloud Captures)
    const imagesRef = collection(db, "users", empId, "screenshots", dateStr, "images");
    const unsub = onSnapshot(imagesRef, (snap) => {
      if (!snap.empty) {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        docs.sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0));
        setRealScreenshots(docs);
        setLoading(false);
      } else {
        // Fallback Path: users/{empId}/screenshots (where date == dateStr)
        const rootRef = collection(db, "users", empId, "screenshots");
        const qRoot = query(rootRef, where("date", "==", dateStr));
        getDocs(qRoot).then(rootSnap => {
          const docs = rootSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          setRealScreenshots(docs);
          setLoading(false);
        }).catch(() => {
          setRealScreenshots([]);
          setLoading(false);
        });
      }
    }, (err) => {
      console.warn("Screenshot query error:", err);
      setRealScreenshots([]);
      setLoading(false);
    });

    return () => unsub();
  }, [empId, dateStr]);

  // Group real screenshots into hourly blocks
  const hourlyData = useMemo(() => {
    const list = [...realScreenshots];

    if (selectedEmployee?.workShifts) {
      selectedEmployee.workShifts.forEach((s: any) => {
        if (s.screenshots && Array.isArray(s.screenshots)) {
          list.push(...s.screenshots);
        }
      });
    }

    if (list.length === 0) return [];

    const hoursMap: Record<string, any[]> = {};
    list.forEach((scr, idx) => {
      let dateObj: Date = new Date();
      if (scr.timestamp?.toDate) dateObj = scr.timestamp.toDate();
      else if (typeof scr.timestamp === 'number') dateObj = new Date(scr.timestamp);
      else if (typeof scr.timestamp === 'string') dateObj = new Date(scr.timestamp);

      const startH = dateObj.getHours();
      const ampm1 = startH >= 12 ? 'PM' : 'AM';
      const h12_1 = startH % 12 === 0 ? 12 : startH % 12;
      const endH = (startH + 1) % 24;
      const ampm2 = endH >= 12 ? 'PM' : 'AM';
      const h12_2 = endH % 12 === 0 ? 12 : endH % 12;

      const hourKey = scr.hourLabel || `${h12_1.toString().padStart(2, '0')}:00 ${ampm1} – ${h12_2.toString().padStart(2, '0')}:00 ${ampm2}`;
      
      let timeStr = "10m Segment";
      try {
        timeStr = format(dateObj, "hh:mm a");
      } catch (e) {
        timeStr = scr.timeRange || "10m Segment";
      }

      // Extract active window title & owner from scr.activity or top-level properties
      const actWin = scr.activity?.activeWindow || {};
      const activeTitle = typeof actWin.title === 'string' ? actWin.title : (typeof actWin.owner === 'string' ? actWin.owner : null);
      const rawProject = activeTitle || (typeof scr.windowTitle === 'string' ? scr.windowTitle : (typeof scr.app === 'string' ? scr.app : (typeof scr.project === 'string' ? scr.project : "Active Screen Capture")));
      const rawTask = typeof scr.task === 'string' ? scr.task : "Work Activity";

      // Compute dynamic activity percent and metric summary from scr.activity
      let computedActivity = 0;
      let activityDetails = "";

      if (typeof scr.activityPercent === 'number') {
        computedActivity = scr.activityPercent;
      } else if (typeof scr.activity === 'number') {
        computedActivity = scr.activity;
      } else if (scr.activity && typeof scr.activity === 'object') {
        const ks = Number(scr.activity.keystrokes || 0);
        const mc = Number(scr.activity.mouseClicks || 0);
        const md = Number(scr.activity.mouseDistance || 0);
        const ms = Number(scr.activity.mouseScrolls || 0);
        const totalInputs = ks + mc + (md > 0 ? 5 : 0) + (ms > 0 ? 5 : 0);
        
        if (totalInputs === 0) {
          computedActivity = 0;
        } else {
          computedActivity = Math.min(100, Math.max(15, Math.round(totalInputs * 4.5)));
        }

        const parts = [];
        if (ks > 0) parts.push(`${ks} keys`);
        if (mc > 0) parts.push(`${mc} clicks`);
        if (md > 0) parts.push(`${Math.round(md)}px`);
        activityDetails = parts.join(" • ");
      } else {
        computedActivity = 75;
      }

      const rawUrl = typeof scr.url === 'string' ? scr.url : (typeof scr.screenshotUrl === 'string' ? scr.screenshotUrl : (typeof scr.imageUrl === 'string' ? scr.imageUrl : (typeof scr.downloadUrl === 'string' ? scr.downloadUrl : "")));

      if (!hoursMap[hourKey]) hoursMap[hourKey] = [];
      hoursMap[hourKey].push({
        id: String(scr.id || `scr_${idx}`),
        project: String(rawProject),
        task: String(rawTask),
        timeRange: String(timeStr),
        activityPercent: computedActivity,
        activityDetails,
        hasScreenshot: true,
        imageUrl: String(rawUrl),
        tags: Array.isArray(scr.tags) ? scr.tags : []
      });
    });

    return Object.keys(hoursMap).map(hourLabel => ({
      hourLabel,
      totalWorked: `${hoursMap[hourLabel].length * 10}m`,
      slots: hoursMap[hourLabel]
    }));
  }, [realScreenshots, selectedEmployee?.workShifts]);

  const handleAddTag = (slotId: string, tag: string) => {
    const cleanTag = tag.trim().startsWith("#") ? tag.trim() : `#${tag.trim()}`;
    if (!cleanTag || cleanTag === "#") return;

    setSlotTags(prev => {
      const existing = prev[slotId] || [];
      if (existing.includes(cleanTag)) return prev;
      return { ...prev, [slotId]: [...existing, cleanTag] };
    });
    setCustomTagInput("");
    toast.success(`Added tag ${cleanTag}`);
  };  
  
  const handleRemoveTag = (slotId: string, tagToRemove: string) => {
    setSlotTags(prev => {
      const existing = prev[slotId] || [];
      return { ...prev, [slotId]: existing.filter(t => t !== tagToRemove) };
    });
  };

  const toggleHourCollapse = (hourLabel: string) => {
    setCollapsedHours(prev => ({ ...prev, [hourLabel]: !prev[hourLabel] }));
  };

  const areAllCollapsed = useMemo(() => {
    if (hourlyData.length === 0) return false;
    return hourlyData.every(block => !!collapsedHours[block.hourLabel]);
  }, [hourlyData, collapsedHours]);

  const toggleAllHoursCollapse = () => {
    const nextState = !areAllCollapsed;
    const nextMap: Record<string, boolean> = {};
    hourlyData.forEach(block => {
      nextMap[block.hourLabel] = nextState;
    });
    setCollapsedHours(nextMap);
  };

  if (!selectedEmployee || !selectedEmployee.id || (selectedEmployee.id === "demo_emp" && !selectedEmployee.name)) {
    return (
      <div className="p-12 text-center bg-card rounded-2xl border border-border flex flex-col items-center justify-center space-y-3">
        <ImageIcon className="size-8 text-muted-foreground/40" />
        <p className="text-xs font-semibold text-muted-foreground">
          No employee selected or connected yet. Connect employees to view hourly screenshots.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-12 text-center bg-card rounded-2xl border border-border flex flex-col items-center justify-center space-y-3">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-xs font-semibold text-muted-foreground">
          Loading screenshots for <span className="text-foreground font-bold">{empName}</span>...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Banner with Global Collapse/Expand Button */}
      {!hideBannerHeader && (
        <div className="flex items-center justify-between bg-card p-4 rounded-xl border border-border shadow-xs">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
              {empName.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">{empName}</h3>
              <p className="text-[11px] text-muted-foreground">Showing 10-minute screenshot segments for {dateStr}</p>
            </div>
          </div>

          {hourlyData.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAllHoursCollapse}
              className="h-8 text-xs font-bold gap-1.5 rounded-xl border-border hover:bg-secondary"
            >
              {areAllCollapsed ? (
                <>
                  <ChevronDown className="size-3.5" /> Expand All Hours ({hourlyData.length})
                </>
              ) : (
                <>
                  <ChevronUp className="size-3.5" /> Collapse All Hours ({hourlyData.length})
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {hideBannerHeader && hourlyData.length > 0 && (
        <div className="flex justify-end pb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAllHoursCollapse}
            className="h-8 text-xs font-bold gap-1.5 rounded-xl border-border hover:bg-secondary"
          >
            {areAllCollapsed ? (
              <>
                <ChevronDown className="size-3.5" /> Expand All Hours ({hourlyData.length})
              </>
            ) : (
              <>
                <ChevronUp className="size-3.5" /> Collapse All Hours ({hourlyData.length})
              </>
            )}
          </Button>
        </div>
      )}

      {/* Hourly Segments */}
      <div className="space-y-6">
        {hourlyData.length === 0 ? (
          <div className="p-12 text-center bg-card rounded-2xl border border-border flex flex-col items-center justify-center space-y-3">
            <ImageIcon className="size-8 text-muted-foreground/40" />
            <p className="text-xs font-semibold text-muted-foreground">
              No screenshot telemetry recorded for {empName} on {dateStr}. Connect employee and track active shifts to capture screen segments.
            </p>
          </div>
        ) : (
          hourlyData.map((hourBlock, idx) => {
            const isCollapsed = !!collapsedHours[hourBlock.hourLabel];

            return (
              <div key={idx} className="bg-card rounded-2xl border border-border p-5 shadow-xs space-y-4">
                <div 
                  onClick={() => toggleHourCollapse(hourBlock.hourLabel)}
                  className="flex items-center justify-between border-b border-border pb-3 cursor-pointer hover:bg-secondary/20 p-2 rounded-xl transition-colors select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-3 rounded-full border-2 border-primary" />
                    <span className="text-xs font-bold text-foreground">{hourBlock.hourLabel}</span>
                    <span className="text-[10px] font-semibold text-muted-foreground font-mono bg-secondary px-2 py-0.5 rounded-full border border-border">
                      {hourBlock.slots.length} {hourBlock.slots.length === 1 ? 'capture' : 'captures'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground font-medium">Total Worked: {hourBlock.totalWorked}</span>
                    <button className="p-1 text-muted-foreground hover:text-foreground">
                      {isCollapsed ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
                    </button>
                  </div>
                </div>

                {!isCollapsed && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {hourBlock.slots.map(slot => {
                      const tags = slotTags[slot.id] || slot.tags || [];
                      const isTagging = taggingSlotId === slot.id;

                      return (
                        <div 
                          key={slot.id} 
                          className="group relative bg-secondary/30 rounded-xl border border-border p-2.5 space-y-2 hover:border-primary/50 transition-all shadow-2xs hover:shadow-xs flex flex-col justify-between"
                        >
                          {/* Image Box */}
                          <div 
                            onClick={() => { setSelectedScreenshot(slot.imageUrl); setZoomLevel(1); }}
                            className="relative aspect-video rounded-lg overflow-hidden bg-background border border-border cursor-pointer group-hover:brightness-105 transition-all"
                          >
                            <img 
                              src={slot.imageUrl} 
                              alt="Screenshot segment" 
                              className="w-full h-full object-cover" 
                            />
                            
                            {/* Hover Overlay Zoom Indicator */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <Maximize2 className="size-5" />
                            </div>
                          </div>

                          {/* Time & Activity Bar */}
                          <div className="space-y-1">
                            <p className="text-[11px] font-bold text-foreground truncate" title={slot.project}>
                              {slot.project}
                            </p>

                            <div className="flex justify-between items-center text-[10px] font-mono">
                              <span className="font-bold text-foreground">{slot.timeRange}</span>
                              {slot.activityDetails && (
                                <span className="text-[9px] text-muted-foreground font-mono truncate max-w-[110px]" title={slot.activityDetails}>
                                  {slot.activityDetails}
                                </span>
                              )}
                            </div>

                            {/* Progress bar */}
                            <div className="w-full bg-secondary h-1 rounded-full overflow-hidden">
                              <div 
                                className={cn(
                                  "h-full rounded-full transition-all",
                                  slot.activityPercent > 50 ? "bg-emerald-500" : slot.activityPercent > 20 ? "bg-amber-500" : "bg-red-500"
                                )} 
                                style={{ width: `${Math.max(5, slot.activityPercent)}%` }} 
                              />
                            </div>
                            <span className="text-[9px] text-muted-foreground block text-right font-mono font-semibold">
                              {slot.activityPercent}% activity
                            </span>
                          </div>

                          {/* Tags Pills */}
                          <div className="flex flex-wrap gap-1 items-center pt-1 border-t border-border/50">
                            {tags.map((tag: string, tIdx: number) => (
                              <span key={tIdx} className="inline-flex items-center gap-1 text-[9px] font-bold bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded-md">
                                {tag}
                                <button onClick={() => handleRemoveTag(slot.id, tag)} className="hover:text-destructive">
                                  <X className="size-2.5" />
                                </button>
                              </span>
                            ))}

                            <button
                              onClick={() => setTaggingSlotId(isTagging ? null : slot.id)}
                              className="text-[10px] font-bold text-muted-foreground hover:text-primary flex items-center gap-0.5 px-1.5 py-0.5 rounded-md hover:bg-secondary transition-all"
                            >
                              <Plus className="size-3" /> Tag
                            </button>
                          </div>

                          {/* Tagging Popover */}
                          <AnimatePresence>
                            {isTagging && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                className="absolute bottom-10 left-2 right-2 z-30 bg-card p-3 rounded-xl border border-border shadow-xl space-y-2"
                              >
                                <div className="flex justify-between items-center border-b border-border pb-1">
                                  <span className="text-[10px] font-bold text-foreground flex items-center gap-1">
                                    <Tag className="size-3 text-primary" /> Manager Tag
                                  </span>
                                  <button onClick={() => setTaggingSlotId(null)} className="text-muted-foreground hover:text-foreground">
                                    <X className="size-3" />
                                  </button>
                                </div>

                                <div className="flex flex-wrap gap-1">
                                  {PRESET_TAGS.map(pt => (
                                    <button
                                      key={pt}
                                      onClick={() => handleAddTag(slot.id, pt)}
                                      className="text-[9px] font-semibold bg-secondary hover:bg-primary/20 hover:text-primary px-1.5 py-0.5 rounded-md transition-colors"
                                    >
                                      {pt}
                                    </button>
                                  ))}
                                </div>

                                <div className="flex gap-1.5">
                                  <Input 
                                    value={customTagInput}
                                    onChange={e => setCustomTagInput(e.target.value)}
                                    placeholder="#CustomTag"
                                    className="h-7 text-[10px] bg-background border-border"
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') handleAddTag(slot.id, customTagInput);
                                    }}
                                  />
                                  <Button 
                                    size="sm"
                                    className="h-7 px-2 text-[10px] font-bold"
                                    onClick={() => handleAddTag(slot.id, customTagInput)}
                                  >
                                    Add
                                  </Button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Ultra-Sleek Full-Screen Lightbox Modal with Interactive Zoom */}
      {selectedScreenshot && (
        <div 
          className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6"
          onClick={() => { setSelectedScreenshot(null); setZoomLevel(1); }}
        >
          {/* Top Floating Toolbar */}
          <div 
            className="w-full max-w-6xl flex items-center justify-between bg-black/60 backdrop-blur-md p-3 px-5 rounded-2xl border border-white/10 shadow-2xl mb-4 z-10 text-white shrink-0"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <ImageIcon className="size-5 text-primary" />
              <span className="text-xs font-bold">Activity Screenshot Inspector</span>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-2 bg-white/10 p-1 rounded-xl border border-white/10">
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-white hover:bg-white/20 rounded-lg"
                onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
                title="Zoom Out"
              >
                <ZoomOut className="size-4" />
              </Button>

              <span className="text-xs font-bold font-mono px-2 min-w-[50px] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>

              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-white hover:bg-white/20 rounded-lg"
                onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.25))}
                title="Zoom In"
              >
                <ZoomIn className="size-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-white hover:bg-white/20 rounded-lg ml-1"
                onClick={() => setZoomLevel(1)}
                title="Reset Zoom"
              >
                <RotateCcw className="size-3.5" />
              </Button>
            </div>

            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-white hover:bg-red-500/80 rounded-xl transition-colors"
              onClick={() => { setSelectedScreenshot(null); setZoomLevel(1); }}
            >
              <X className="size-5" />
            </Button>
          </div>

          {/* Screenshot Image Frame */}
          <div 
            className="flex-1 w-full max-w-6xl overflow-auto rounded-2xl border border-white/10 bg-black/40 flex items-center justify-center p-4 relative custom-scrollbar"
            onClick={e => e.stopPropagation()}
          >
            <img 
              src={selectedScreenshot} 
              alt="Enlarged screenshot" 
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center', transition: 'transform 0.15s ease-out' }}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl select-none" 
            />
          </div>
        </div>
      )}
    </div>
  );
}
