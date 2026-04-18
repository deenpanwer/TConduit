"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Zap, RefreshCcw } from "lucide-react";
import { Shimmer } from "@/components/ems/main/shared/Shimmer";
import { format } from "date-fns";
import { useTeam } from "@/hooks/use-team";

interface AIPersonnelPulseProps {
  employee: any;
  workShifts: any[];
  screenshots: any[];
}

/**
 * generateTemporalCollage: Client-side "Context Clustering".
 * Combines up to 16 images into a single temporal map.
 */
async function generateTemporalCollage(urls: string[]): Promise<string> {
  if (!urls || urls.length === 0) return "";
  
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const size = 1024; // Balanced resolution
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return reject("Canvas context error");

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, size, size);

    let loadedCount = 0;
    const images: HTMLImageElement[] = [];
    const limit = Math.min(urls.length, 16);
    
    // Grid Math: Determine rows/cols (e.g., 4x4 for 16, 3x3 for 9)
    const cols = Math.ceil(Math.sqrt(limit)) || 1;
    const rows = Math.ceil(limit / cols) || 1;
    const cellW = size / cols;
    const cellH = size / rows;

    urls.slice(0, limit).forEach((url, i) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        images[i] = img;
        loadedCount++;
        if (loadedCount === limit) draw();
      };
      img.onerror = () => {
        loadedCount++;
        if (loadedCount === limit) draw();
      };
      img.src = url;
    });

    function draw() {
      if (!ctx) return;
      for (let i = 0; i < limit; i++) {
        const img = images[i];
        if (!img) continue;
        const x = (i % cols) * cellW;
        const y = Math.floor(i / cols) * cellH;
        
        // Use Math.min (contain) instead of Math.max (cover) to prevent cropping
        const ratio = Math.min(cellW / img.width, cellH / img.height);
        const nw = img.width * ratio;
        const nh = img.height * ratio;
        const nx = x + (cellW - nw) / 2;
        const ny = y + (cellH - nh) / 2;
        ctx.drawImage(img, 0, 0, img.width, img.height, nx, ny, nw, nh);
      }
      const base64 = canvas.toDataURL("image/jpeg", 0.8);
      console.log(`[Trac Audit] Temporal Collage Generated (${limit} images):`, base64);
      resolve(base64);
    }
  });
}

export function AIPersonnelPulse({ employee, workShifts, screenshots }: AIPersonnelPulseProps) {
  const { selectedDate } = useTeam();
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);

  const dateStr = format(selectedDate, "yyyy-MM-dd");
  
  const relevantShifts = useMemo(() => {
    if (!workShifts) return [];
    return workShifts.filter(s => {
        const sStart = s.startTime?.toDate ? s.startTime.toDate() : new Date(s.startTime);
        return format(sStart, "yyyy-MM-dd") === dateStr;
    });
  }, [workShifts, dateStr]);

  const fetchAnalysis = async () => {
    if (!employee) return;
    
    setLoading(true);
    setAnalysis(null);

    // Filter screenshots - still useful even without shifts
    const validScreenshots = (screenshots || [])
      .filter(s => !s.isBlurred && (s.url || s.activity?.cloudinaryUrl))
      .slice(0, 16);

    const urls = validScreenshots.map(s => s.url || s.activity?.cloudinaryUrl || "");

    try {
      const collageBase64 = await generateTemporalCollage(urls);

      const payload = {
        employeeName: employee?.name || "Member",
        date: dateStr,
        shifts: relevantShifts.map(s => ({
          id: s.id,
          status: s.status,
          startTime: s.startTime,
          endTime: s.endTime,
          liveMetrics: s.liveMetrics,
          liveBreakdown: s.liveBreakdown,
          cognitiveReport: s.cognitiveReport,
          velocity: s.velocity,
          productivityScore: s.productivityScore,
          focusScore: s.focusScore,
          hourlyPulse: s.hourlyPulse,
        })),
        screenshotUrls: collageBase64 ? [collageBase64] : [],
        screenshotMetadata: validScreenshots.map(s => ({
          timestamp: s.timestamp?.toDate ? s.timestamp.toDate().toISOString() : s.timestamp,
          activeWindow: s.activity?.windowTitle || s.activity?.activeWindow || "Unknown Window",
          appName: s.activity?.appName || s.activity?.processName || "Unknown App",
          isBlurred: !!s.isBlurred,
        })),
      };

      const res = await fetch("/api/employee/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();
      if (data.text) setAnalysis(data.text);
    } catch (error) {
      console.error("Failed to fetch AI analysis", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (employee) {
      fetchAnalysis();
    }
  }, [employee?.id, dateStr]);

  if (loading) {
    return (
      <div className="w-full bg-card/30 border border-primary/10 rounded-[2.5rem] p-8 space-y-4 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="text-primary animate-pulse" size={20} />
          <h3 className="text-xs font-black uppercase tracking-widest opacity-60">What {employee?.name || 'Member'} Did Report / Analyzing Temporal Context...</h3>
        </div>
        <Shimmer className="h-4 w-3/4 rounded-full" />
        <Shimmer className="h-4 w-1/2 rounded-full" />
      </div>
    );
  }

  if (!analysis) {
    if (relevantShifts.length === 0) {
      return (
        <div className="w-full bg-card/20 border border-dashed border-border/50 rounded-[3rem] p-10 mb-12 flex flex-col items-center justify-center text-center space-y-4">
           <div className="p-4 rounded-2xl bg-muted/50 text-muted-foreground/30"><Zap size={32} /></div>
           <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">No Session Logs</h3>
              <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mt-1">{employee?.name} has no recorded output for {format(selectedDate, 'MMMM dd')}</p>
           </div>
        </div>
      );
    }
    
    return (
      <div className="w-full bg-card/20 border border-primary/10 rounded-[3rem] p-10 mb-12 flex flex-col items-center justify-center text-center space-y-4">
         <div className="p-4 rounded-2xl bg-primary/5 text-primary/40"><RefreshCcw size={32} /></div>
         <div className="space-y-4">
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Audit Standby</h3>
              <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mt-1">Ready to audit {employee?.name}'s temporal data for {format(selectedDate, 'MMMM dd')}</p>
            </div>
            <Button onClick={fetchAnalysis} variant="outline" size="sm" className="rounded-xl font-black uppercase text-[10px] tracking-widest h-10 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10">Run AI Audit Now</Button>
         </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full bg-card/40 border border-primary/20 rounded-[3rem] p-10 mb-12 shadow-2xl backdrop-blur-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-6 opacity-10"><Zap size={64} className="text-primary" /></div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center"><Zap className="text-primary" size={16} /></div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">What {employee?.name || 'Member'} Did Report</h3>
        </div>
      </div>
      <div className="prose dark:prose-invert max-w-none text-lg font-medium leading-relaxed tracking-tight text-foreground/90"><ReactMarkdown>{analysis}</ReactMarkdown></div>
    </motion.div>
  );
}
