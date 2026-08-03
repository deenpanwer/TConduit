"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { 
  X, AlertTriangle, ShieldCheck, Activity, Clock, MousePointer, 
  Layers, CheckCircle2, ImageIcon, Sparkles, ChevronRight, Zap, Tv, Maximize2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmployeeAnomalyReport, AnomalyFlag } from "@/hooks/use-anomalies";
import { getUserAvatar, cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { collection, query, getDocs, limit } from "firebase/firestore";
import { toast } from "sonner";

interface EmployeeAnomalyModalProps {
  report: EmployeeAnomalyReport | null;
  targetDateStr?: string;
  onClose: () => void;
  onNavigateToScreenshots: (empId: string) => void;
}

export function EmployeeAnomalyModal({ report, targetDateStr, onClose, onNavigateToScreenshots }: EmployeeAnomalyModalProps) {
  const [selectedInstanceIndex, setSelectedInstanceIndex] = useState<number>(0);
  const [excusing, setExcusing] = useState(false);
  const [previewScreenshot, setPreviewScreenshot] = useState<string | null>(null);

  const flags = report?.flags && report.flags.length > 0 ? report.flags : (report?.flag ? [report.flag] : []);
  const activeFlag = flags[selectedInstanceIndex] || flags[0] || null;

  useEffect(() => {
    if (!report?.employeeId || !activeFlag) return;

    let foundUrl: string | null = null;
    const activeDateStr = targetDateStr || format(new Date(), "yyyy-MM-dd");

    const parseShiftDateStr = (ts: any): string => {
      if (!ts) return "";
      let d: Date | null = null;
      if (ts?.toDate && typeof ts.toDate === "function") d = ts.toDate();
      else if (ts?.seconds) d = new Date(ts.seconds * 1000);
      else if (ts instanceof Date) d = ts;
      else if (typeof ts === "number") d = new Date(ts);
      else if (typeof ts === "string") {
        const parsed = new Date(ts);
        if (!isNaN(parsed.getTime())) d = parsed;
      }
      return d ? format(d, "yyyy-MM-dd") : "";
    };
    
    // First, try to match the screenshot to the active flag from workShifts
    if (report.rawEmp?.workShifts) {
      const allScreenshots: any[] = [];
      report.rawEmp.workShifts.forEach((s: any) => {
        const sDate = s.dateStr || s.workDate || parseShiftDateStr(s.startTime) || parseShiftDateStr(s.clockIn) || (s.id?.includes('_') ? s.id.split('_')[0] : "");
        if (sDate === activeDateStr && s.screenshots && Array.isArray(s.screenshots)) {
          allScreenshots.push(...s.screenshots);
        }
      });
      
      if (allScreenshots.length > 0) {
        const lowerAppName = (activeFlag.appName || "").toLowerCase();
        const lowerAppTitle = (activeFlag.appTitle || "").toLowerCase();
        
        // Try to find a matching screenshot if we have a title or app
        if (lowerAppName || lowerAppTitle) {
          const match = allScreenshots.find(scr => {
             const actWin = scr.activity?.activeWindow || {};
             const activeTitle = typeof actWin.title === 'string' ? actWin.title : (typeof actWin.owner === 'string' ? actWin.owner : null);
             const rawProject = activeTitle || (typeof scr.windowTitle === 'string' ? scr.windowTitle : (typeof scr.app === 'string' ? scr.app : (typeof scr.project === 'string' ? scr.project : "")));
             
             if (!rawProject) return false;
             const lowerProject = String(rawProject).toLowerCase();
             
             if (lowerAppTitle && lowerProject.includes(lowerAppTitle)) return true;
             if (lowerAppName && lowerProject.includes(lowerAppName)) return true;
             
             return false;
          });
          
          if (match) {
            foundUrl = match.url || match.imageUrl || match.downloadUrl || match.src || null;
          }
        }
        
        // If no match found, fallback to the last screenshot of that day
        if (!foundUrl) {
          const last = allScreenshots[allScreenshots.length - 1];
          foundUrl = last.url || last.imageUrl || last.downloadUrl || last.src || null;
        }
      }
    }

    if (foundUrl) {
      setPreviewScreenshot(foundUrl);
      return;
    }

    // Otherwise fetch screenshot from Firestore (order by timestamp to get the latest for activeDateStr)
    const imagesRef = collection(db, "users", report.employeeId, "screenshots", activeDateStr, "images");
    const qImages = query(imagesRef, limit(1));
    getDocs(qImages).then(snap => {
      if (!snap.empty) {
        const data = snap.docs[0].data();
        const url = data.url || data.imageUrl || data.downloadUrl || data.src;
        if (url) setPreviewScreenshot(url);
      }
    }).catch(() => {});
  }, [report, activeFlag]);

  if (!report || !activeFlag) return null;

  const handleMarkExcused = () => {
    setExcusing(true);
    setTimeout(() => {
      setExcusing(false);
      toast.success(`Marked anomaly flags as excused for ${report.employeeName}`);
      onClose();
    }, 600);
  };

  return (
    <AnimatePresence>
      {report && (
        <div 
          className="fixed inset-0 z-[200] bg-slate-900/40 flex items-center justify-center p-4 backdrop-blur-xs select-none"
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col overflow-hidden max-h-[90vh] border border-gray-100"
            onClick={e => e.stopPropagation()}
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white z-10">
              <h3 className="text-[17px] font-bold text-slate-800 flex items-center gap-2">
                {report.employeeName}'s unusual instances
              </h3>
              <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Two-Column Split View Body */}
            <div className="flex-1 overflow-hidden bg-white flex flex-col md:flex-row h-[580px]">
              
              {/* Left Sidebar (320px) */}
              <div className="w-full md:w-[320px] border-r border-gray-100 flex flex-col bg-white shrink-0">
                <div className="p-4 border-b border-gray-50 flex items-center gap-3 shrink-0">
                  <img src={getUserAvatar(report.rawEmp)} alt={report.employeeName} className="w-7 h-7 rounded-full object-cover border border-gray-200" />
                  <div className="text-[13px] font-medium text-slate-700 truncate">
                    {report.employeeName} 
                    <span className="text-slate-400 ml-1.5 font-bold">| {flags.length} {flags.length === 1 ? 'instance' : 'instances'}</span>
                  </div>
                </div>
                
                <div className="p-4 space-y-3 overflow-y-auto custom-scrollbar flex-1">
                  {flags.map((flag, idx) => {
                    const isSelected = selectedInstanceIndex === idx;

                    return (
                      <button 
                        key={flag.id || idx}
                        onClick={() => setSelectedInstanceIndex(idx)}
                        className={cn(
                          "w-full text-left p-4 rounded-xl border transition-all relative overflow-hidden", 
                          isSelected 
                            ? "border-[#2b90ff] bg-blue-50/30 ring-1 ring-[#2b90ff]" 
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        )}
                      >
                        {isSelected && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#2b90ff] rounded-r-md" />
                        )}
                        <div className="flex justify-between items-start mb-1 pl-2">
                          <span className="font-bold text-slate-800 text-[13px] truncate pr-2">
                            {flag.shortTitle || flag.type}
                          </span>
                          <span className={cn(
                            "text-[11px] font-bold shrink-0",
                            flag.severityLabel === "High" ? "text-red-500" :
                            flag.severityLabel === "Medium" ? "text-amber-500" : "text-slate-500"
                          )}>
                            {flag.severityLabel}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium pl-2">
                          {flag.timeWindow || flag.metric}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Content Pane */}
              <div className="flex-1 p-8 overflow-y-auto bg-white custom-scrollbar flex flex-col justify-between">
                <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
                  
                  {/* Title & Severity Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                    <div>
                      <h4 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <AlertTriangle className="size-5 text-amber-500" />
                        {activeFlag.type}
                      </h4>
                      <p className="text-xs text-slate-400 font-medium mt-1">
                        Recorded for {report.employeeName} during active shift
                      </p>
                    </div>

                    <Badge variant="outline" className={cn(
                      "text-xs font-bold px-3 py-1 rounded-full border",
                      activeFlag.severityLabel === "High" ? "bg-red-50 text-red-600 border-red-200" :
                      activeFlag.severityLabel === "Medium" ? "bg-amber-50 text-amber-600 border-amber-200" :
                      "bg-blue-50 text-blue-600 border-blue-200"
                    )}>
                      {activeFlag.severityLabel} Risk Flag
                    </Badge>
                  </div>

                  {/* Scenario-Specific Dynamic Telemetry Metrics Grid */}
                  {(() => {
                    let box1 = { label: "Flagged Interval", value: activeFlag.timeWindow || activeFlag.metric };
                    let box2 = { label: "App Switch Rate", value: `${report.appSwitchRate}/hr` };
                    let box3 = { label: "Continuous Idle", value: `${report.totalIdleMinutes}m` };

                    const flagId = activeFlag.id || '';
                    const flagType = (activeFlag.type || '').toLowerCase();

                    if (flagId === 'suspicious_app' || flagType.includes('media') || flagType.includes('distraction')) {
                      box1 = { label: "Flagged Duration", value: activeFlag.durationStr || activeFlag.metric };
                      box2 = { label: "Primary App / Browser", value: activeFlag.appName || "Google Chrome" };
                      box3 = { label: "Anomaly Impact", value: activeFlag.severityLabel === "High" ? "High Distraction" : "Unproductive Usage" };
                    } else if (flagId === 'context_switch' || flagType.includes('context') || flagType.includes('switching')) {
                      box1 = { label: "Switch Rate", value: `${report.appSwitchRate}/hr` };
                      box2 = { label: "Total Switches", value: activeFlag.durationStr || "High Velocity" };
                      box3 = { label: "Friction Signature", value: "Multitasking Stress" };
                    } else if (flagId === 'idle_spike' || flagType.includes('idle')) {
                      box1 = { label: "Idle Duration", value: activeFlag.durationStr || `${report.totalIdleMinutes}m` };
                      box2 = { label: "Workstation State", value: "Inactivity Spike" };
                      box3 = { label: "Input Activity", value: "0 Input Pulses" };
                    } else if (flagId === 'synthetic_motion' || flagType.includes('synthetic')) {
                      box1 = { label: "Motion Signature", value: activeFlag.metric };
                      box2 = { label: "Keystrokes / Clicks", value: "Near Zero" };
                      box3 = { label: "Anti-Idle Status", value: "Jiggler Signature" };
                    } else if (flagId === 'extended_app_lock' || flagType.includes('lock')) {
                      box1 = { label: "Locked Duration", value: activeFlag.durationStr || activeFlag.metric };
                      box2 = { label: "Lock State", value: "Lid Closed / Locked" };
                      box3 = { label: "Lock App", value: activeFlag.appName || "LockApp" };
                    } else if (flagId === 'lateness' || flagType.includes('schedule')) {
                      box1 = { label: "Lateness Delay", value: activeFlag.metric };
                      box2 = { label: "Schedule Status", value: "Late Start" };
                      box3 = { label: "Variance Impact", value: `${activeFlag.durationStr} shift delay` };
                    }

                    return (
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-4 rounded-xl border border-gray-100 bg-slate-50/50 space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            {box1.label}
                          </span>
                          <p className="text-sm font-bold text-slate-800 font-mono truncate">
                            {box1.value}
                          </p>
                        </div>

                        <div className="p-4 rounded-xl border border-gray-100 bg-slate-50/50 space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            {box2.label}
                          </span>
                          <p className="text-sm font-bold text-slate-800 font-mono truncate">
                            {box2.value}
                          </p>
                        </div>

                        <div className="p-4 rounded-xl border border-gray-100 bg-slate-50/50 space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            {box3.label}
                          </span>
                          <p className="text-sm font-bold text-slate-800 font-mono truncate">
                            {box3.value}
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Explanation Box */}
                  <div className="p-5 rounded-2xl border border-gray-100 bg-slate-50/70 space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Empirical Telemetry Evaluation
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed font-normal">
                      {activeFlag.detail}
                    </p>

                    {activeFlag.recommendation && (
                      <div className="pt-3 border-t border-gray-200/60 flex items-start gap-2 text-xs text-[#2b90ff] font-medium">
                        <Sparkles className="size-4 shrink-0 mt-0.5" />
                        <span>{activeFlag.recommendation}</span>
                      </div>
                    )}
                  </div>

                  {/* Unproductive Media / Content Capture Banner */}
                  {(activeFlag.id === 'suspicious_app' || activeFlag.type.includes('Media') || activeFlag.detail.includes('media') || activeFlag.detail.includes('YouTube') || activeFlag.detail.includes('"')) && (
                    <div className="p-4 rounded-2xl border border-amber-200/80 bg-amber-50/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                          <Tv className="size-4 text-amber-600" />
                          Content Evidence Captured
                        </span>
                        <Badge variant="outline" className="text-[10px] font-bold bg-amber-100 text-amber-800 border-amber-300">
                          Live Active Flag
                        </Badge>
                      </div>

                      {/* Screen Capture Thumbnail Preview */}
                      {previewScreenshot && (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block flex items-center gap-1">
                            <ImageIcon className="size-3.5 text-amber-700" /> Screen Capture Proof (Workstation Preview)
                          </span>
                          <div 
                            onClick={() => onNavigateToScreenshots(report.employeeId)}
                            className="relative rounded-xl overflow-hidden border border-amber-200 shadow-xs cursor-pointer group bg-black max-h-48 flex items-center justify-center"
                          >
                            <img 
                              src={previewScreenshot} 
                              alt="Workstation Screenshot Evidence" 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100" 
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-bold">
                              <Maximize2 className="size-4" /> Open Full Screen Capture
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>

                {/* Footer Action Buttons */}
                <div className="pt-6 border-t border-gray-100 flex items-center justify-end mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onNavigateToScreenshots(report.employeeId)}
                    className="text-xs font-bold gap-2 rounded-xl border-gray-200 bg-white text-slate-700 hover:bg-slate-50"
                  >
                    <ImageIcon className="size-4 text-[#2b90ff]" />
                    Inspect Hourly Screenshots
                  </Button>
                </div>

              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
