"use client";

import { useState, useEffect, useMemo } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { format } from "date-fns";
import { generateTemporalCollage } from "@/lib/ai-helpers";
import { Shimmer } from "@/components/ems/main/shared/Shimmer";
import { Zap, Clock, MousePointer2, Keyboard } from "lucide-react";
import { motion } from "framer-motion";

interface AuditVisualizerProps {
  employeeId: string;
  employeeName: string;
  date: string;
}

interface ScreenshotData {
  id: string;
  url: string;
  isBlurred?: boolean;
  timestamp?: any;
}

export function AuditVisualizer({ employeeId, employeeName, date }: AuditVisualizerProps) {
  const [screenshots, setScreenshots] = useState<ScreenshotData[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [collage, setCollage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!employeeId || !date) return;

    setLoading(true);

    // 1. Fetch Shifts
    const shiftsRef = collection(db, "users", employeeId, "workShifts");
    const shiftsQuery = query(shiftsRef, orderBy("__name__"), where("__name__", ">=", date), where("__name__", "<=", date + "\uf8ff"));
    
    const unsubShifts = onSnapshot(shiftsQuery, (snap) => {
      setShifts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 2. Fetch Screenshots
    const screenRef = collection(db, "users", employeeId, "screenshots", date, "images");
    const screenQuery = query(screenRef, orderBy("timestamp", "desc"), limit(16));
    
    const unsubScreenshots = onSnapshot(screenQuery, async (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() })) as ScreenshotData[];
      setScreenshots(docs);
      
      const urls = docs.filter(s => !s.isBlurred && s.url).map(s => s.url);
      if (urls.length > 0) {
        const base64 = await generateTemporalCollage(urls);
        setCollage(base64);
      }
      setLoading(false);
    });

    return () => {
      unsubShifts();
      unsubScreenshots();
    };
  }, [employeeId, date]);

  const stats = useMemo(() => {
    let totalSecs = 0;
    let keystrokes = 0;
    let clicks = 0;

    shifts.forEach(s => {
      const metrics = s.liveMetrics || s.metrics || {};
      totalSecs += metrics.totalSeconds || s.totalSeconds || 0;
      keystrokes += metrics.keystrokes || s.keystrokes || 0;
      clicks += metrics.mouseClicks || s.mouseClicks || 0;
    });

    return {
      hours: (totalSecs / 3600).toFixed(1),
      keystrokes,
      clicks
    };
  }, [shifts]);

  if (loading) {
    return (
      <div className="w-full bg-secondary/20 rounded-[2.5rem] p-6 space-y-4 border border-border/50">
        <div className="flex items-center gap-3">
          <Shimmer className="size-5 rounded-full" />
          <Shimmer className="h-4 w-32 rounded-full" />
        </div>
        <Shimmer className="w-full aspect-video rounded-3xl" />
        <div className="grid grid-cols-3 gap-2">
          <Shimmer className="h-10 rounded-2xl" />
          <Shimmer className="h-10 rounded-2xl" />
          <Shimmer className="h-10 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full bg-card border-2 border-border/50 rounded-[2.5rem] overflow-hidden shadow-xl"
    >
      <div className="p-4 border-b border-border/50 bg-secondary/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Zap size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-black uppercase tracking-tighter">{employeeName}</span>
            <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">{date} Audit Context</span>
          </div>
        </div>
      </div>

      <div className="p-2">
        {collage ? (
            <img src={collage} alt="Audit Collage" className="w-full aspect-video object-cover rounded-[2rem] border border-border/50" />
        ) : (
            <div className="w-full aspect-video bg-secondary/20 rounded-[2rem] flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-border/20">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">No Visual Evidence Found</p>
            </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-1 p-2 pt-0">
        <div className="bg-secondary/20 p-3 rounded-2xl flex flex-col items-center justify-center text-center">
            <Clock size={12} className="text-muted-foreground/60 mb-1" />
            <span className="text-sm font-black tracking-tighter">{stats.hours}h</span>
            <span className="text-[7px] font-bold text-muted-foreground uppercase tracking-widest">Worked</span>
        </div>
        <div className="bg-secondary/20 p-3 rounded-2xl flex flex-col items-center justify-center text-center">
            <Keyboard size={12} className="text-muted-foreground/60 mb-1" />
            <span className="text-sm font-black tracking-tighter">{stats.keystrokes}</span>
            <span className="text-[7px] font-bold text-muted-foreground uppercase tracking-widest">Keys</span>
        </div>
        <div className="bg-secondary/20 p-3 rounded-2xl flex flex-col items-center justify-center text-center">
            <MousePointer2 size={12} className="text-muted-foreground/60 mb-1" />
            <span className="text-sm font-black tracking-tighter">{stats.clicks}</span>
            <span className="text-[7px] font-bold text-muted-foreground uppercase tracking-widest">Clicks</span>
        </div>
      </div>
    </motion.div>
  );
}
