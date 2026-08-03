"use client";

import { useMemo } from "react";
import { format } from "date-fns";

export interface AnomalyFlag {
  id: string;
  type: string;
  shortTitle: string;
  detail: string;
  severity: "High Flag" | "Medium Flag" | "Low Flag";
  severityLabel: "High" | "Medium" | "Low";
  color: string;
  metric: string;
  timeWindow?: string;
  durationStr?: string;
  recommendation?: string;
  appName?: string;
  appTitle?: string;
}

export interface EmployeeAnomalyReport {
  id: string;
  employeeId: string;
  employeeName: string;
  name: string;
  displayName?: string;
  employeeEmail: string;
  email: string;
  role: string;
  department?: string;
  avatarUrl?: string;
  flag: AnomalyFlag;
  flags: AnomalyFlag[];
  highestSeverity: "High Flag" | "Medium Flag" | "Low Flag" | "Clean";
  highestSeverityLabel: "High" | "Medium" | "Low" | "Clean";
  riskScore: number; // 0 to 100
  totalIdleMinutes: number;
  totalLatenessMinutes: number;
  appSwitchRate: number;
  rawEmp: any;
}

export interface UseAnomaliesResult {
  flaggedEmployees: EmployeeAnomalyReport[];
  cleanEmployees: any[];
  totalFlaggedMembers: number;
  totalSuspiciousInstances: number;
  totalFlaggedMinutes: number;
  cleanWorkforceCount: number;
  orgRiskScore: number;
  orgHealthStatus: "Low Risk" | "Moderate Risk" | "High Risk";
}

const DISTRACTION_KEYWORDS = [
  "youtube", "netflix", "spotify", "twitch", "steam", "facebook", "instagram", 
  "tiktok", "twitter", "x.com", "reddit", "hulu", "prime video", "disney", 
  "vimeo", "dailymotion", "soundcloud", "gaming", "roblox", "discord", 
  "kick.com", "rumble", "hotstar", "zee5", "primevideo", "hbo", "max.com"
];

const FAKE_ACTIVITY_KEYWORDS = [
  "mouse jiggler", "jiggler", "auto clicker", "autoclicker", "move mouse", "mouse mover", 
  "anti idle", "caffeine", "stay awake", "dont sleep", "mouse spoofer", "mouse-jiggler", 
  "keepawake", "idle buster", "key presser", "auto key", "mousejiggler", "webjiggler", 
  "mouse-mover", "jiggle", "fakeactivity", "autokey"
];

/**
 * Empirical 8-Facet Anomaly Detection Engine Hook
 */
export function useAnomalies(employees: any[], empAudits: Record<string, any> = {}, targetDateStr?: string): UseAnomaliesResult {
  return useMemo(() => {
    if (!employees || employees.length === 0) {
      return {
        flaggedEmployees: [],
        cleanEmployees: [],
        totalFlaggedMembers: 0,
        totalSuspiciousInstances: 0,
        totalFlaggedMinutes: 0,
        cleanWorkforceCount: 0,
        orgRiskScore: 0,
        orgHealthStatus: "Low Risk"
      };
    }

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

    const flaggedEmployees: EmployeeAnomalyReport[] = [];
    const cleanEmployees: any[] = [];
    let grandFlaggedMinutes = 0;
    let grandSuspiciousInstances = 0;

    employees.forEach(emp => {
      const audit = empAudits[emp.id];
      
      // Filter workShifts for targetDateStr if provided
      const allShifts = emp.workShifts || [];
      const matchingShifts = targetDateStr 
        ? allShifts.filter((s: any) => {
            if (!s) return false;
            const sDate = s.dateStr || s.workDate || parseShiftDateStr(s.startTime) || parseShiftDateStr(s.clockIn) || (s.id?.includes('_') ? s.id.split('_')[0] : "");
            return sDate === targetDateStr;
          })
        : allShifts;

      const shift = matchingShifts[0] || {};
      const shiftMetrics = shift.liveMetrics || shift.metrics || {};
      const liveBreakdown = shift.liveBreakdown || {};

      const totalSecs = audit?.metrics?.totalSeconds || shiftMetrics.totalSeconds || 0;
      const activeSecs = audit?.metrics?.activeSeconds || shiftMetrics.activeSeconds || 0;
      const idleSecs = audit?.metrics?.idleSeconds || shiftMetrics.idleSeconds || 0;
      const lateness = audit?.metrics?.latenessMinutes || shift.latenessMinutes || 0;
      const switches = shiftMetrics.appSwitches?.total || 0;
      const keystrokes = shiftMetrics.keystrokes || 0;
      const clicks = shiftMetrics.mouseClicks || 0;
      const mouseDist = shiftMetrics.mouseDistance || 0;
      const isAbsent = audit?.metrics?.isAbsent === true || shift.isAbsent === true;
      const startTime = shift.startTime || shift.clockIn || null;

      const flags: AnomalyFlag[] = [];
      let empRiskScore = 0;

      // 1. Facet: Non-Work App & Web Streaming Monopolization (Distraction App / Web Video / YouTube)
      let distractionSecs = 0;
      let topDistractionApp = "";
      let topDistractionTitle = "";

      Object.entries(liveBreakdown).forEach(([appName, data]: [string, any]) => {
        const lowerAppName = appName.toLowerCase();
        const appSecs = typeof data === 'number' ? data : (data?.totalSeconds || 0);
        const isAppDistraction = DISTRACTION_KEYWORDS.some(k => lowerAppName.includes(k));

        if (isAppDistraction && appSecs > 30) {
          distractionSecs += appSecs;
          if (!topDistractionApp || appSecs > distractionSecs) topDistractionApp = appName;
        }

        // Deep inspection into browser window titles and URLs (e.g. YouTube video title, Netflix stream)
        const details = typeof data === 'object' && data?.details ? data.details : {};
        if (Array.isArray(details)) {
          details.forEach((d: any) => {
            const title = typeof d === 'string' ? d : d?.title || d?.activeWindow || d?.name || "";
            const lowerTitle = title.toLowerCase();
            const timeVal = d?.seconds || d?.duration || 0;
            const titleSecs = typeof timeVal === 'number' ? timeVal : (parseInt(timeVal) || 0);
            if (DISTRACTION_KEYWORDS.some(k => lowerTitle.includes(k))) {
              distractionSecs += (titleSecs > 0 ? titleSecs : appSecs);
              if (!topDistractionTitle) topDistractionTitle = title;
              if (!topDistractionApp) topDistractionApp = appName;
            }
          });
        } else if (typeof details === 'object' && details !== null) {
          Object.entries(details).forEach(([title, time]: [string, any]) => {
            const lowerTitle = title.toLowerCase();
            const isTitleDistraction = DISTRACTION_KEYWORDS.some(k => lowerTitle.includes(k));
            const titleSecs = typeof time === 'number' ? time : (time?.totalSeconds || 0);

            if (isTitleDistraction) {
              const effectiveSecs = titleSecs > 0 ? titleSecs : appSecs;
              distractionSecs += effectiveSecs;
              if (!topDistractionTitle) topDistractionTitle = title;
              if (!topDistractionApp) topDistractionApp = appName;
            }
          });
        }
      });

      if (distractionSecs >= 30) { // >=30s of YouTube/media streaming or non-work app
        const distMins = Math.floor(distractionSecs / 60);
        const distSecs = distractionSecs % 60;
        const durationDisplay = distMins > 0 ? `${distMins}m` : `${distSecs}s`;
        const isHigh = distractionSecs > 900 || (totalSecs > 0 && distractionSecs / totalSecs > 0.25);

        empRiskScore += isHigh ? 30 : 15;
        grandFlaggedMinutes += Math.max(1, distMins);

        const cleanEvidenceTitle = topDistractionTitle 
          ? topDistractionTitle.substring(0, 80)
          : (topDistractionApp || 'Media Streaming');

        flags.push({
          id: 'suspicious_app',
          type: "Non-Work Web & Media Streaming",
          shortTitle: "Media streaming / Distraction",
          detail: topDistractionTitle 
            ? `Non-work media streaming detected on browser: "${cleanEvidenceTitle}" (${durationDisplay} logged)`
            : `Excessive usage of distraction application (${topDistractionApp || 'Social Media/Media'}) for ${durationDisplay} during shift`,
          severity: isHigh ? "High Flag" : "Medium Flag",
          severityLabel: isHigh ? "High" : "Medium",
          color: isHigh ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20",
          metric: `${durationDisplay} ${topDistractionApp || 'Media'}`,
          timeWindow: `Active Shift (${durationDisplay} logged)`,
          durationStr: durationDisplay,
          appName: topDistractionApp || "Media Application",
          appTitle: topDistractionTitle || "",
          recommendation: "Review web & media streaming activity policies with team member."
        });
      }

      // 2. Facet: Protracted Idle Spike Inactivity
      const idleMins = Math.round(idleSecs / 60);
      if (idleSecs > 1200) {
        const isHigh = idleMins > 30;
        empRiskScore += isHigh ? 35 : 20;
        grandFlaggedMinutes += idleMins;

        flags.push({
          id: 'idle_spike',
          type: "Unusual Idle Spike",
          shortTitle: "Continuous idle spike",
          detail: `${idleMins}m continuous idle inactivity logged during workstation shift`,
          severity: isHigh ? "High Flag" : "Medium Flag",
          severityLabel: isHigh ? "High" : "Medium",
          color: isHigh ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20",
          metric: `${idleMins}m idle`,
          timeWindow: `Shift Interval (${idleMins}m continuous)`,
          durationStr: `${idleMins}m`,
          recommendation: "Inspect hourly screenshot captures to verify physical workstation presence."
        });
      }

      // 3. Facet: Focus Fragmentation (Hyper Context Switching)
      const activeHours = activeSecs / 3600;
      let switchRate = 0;
      if (activeHours >= 0.25 && switches > 0) {
        switchRate = Math.round(switches / activeHours);
        if (switchRate > 40) {
          empRiskScore += 15;
          flags.push({
            id: 'context_switch',
            type: "Hyper Context Switching",
            shortTitle: "Focus fragmentation",
            detail: `High app switching velocity (${switchRate} switches/hr) indicates focus fragmentation and multitasking friction`,
            severity: "Medium Flag",
            severityLabel: "Medium",
            color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
            metric: `${switchRate} switches/hr`,
            timeWindow: `Shift Average (${switchRate} switches/hr)`,
            durationStr: `${switches} total switches`,
            recommendation: "Discuss task priority alignment to reduce multi-tasking context switching."
          });
        }
      }

      // 4. Facet: Synthetic Motion (Mouse Jiggler / Anti-Idle Detection)
      if (mouseDist > 4000 && (keystrokes + clicks) < 10) {
        empRiskScore += 40;
        flags.push({
          id: 'synthetic_motion',
          type: "Synthetic Motion Signature",
          shortTitle: "Long single input activity",
          detail: `High cursor movement (${Math.round(mouseDist)}px) detected without corresponding keyboard/click activity (anti-idle jiggler signature)`,
          severity: "High Flag",
          severityLabel: "High",
          color: "bg-red-500/10 text-red-500 border-red-500/20",
          metric: `${Math.round(mouseDist)}px motion`,
          timeWindow: `Automated Motion Interval`,
          durationStr: `${Math.round(mouseDist)}px`,
          recommendation: "Inspect active app breakdown for automated anti-idle utilities or background mouse jigglers."
        });
      }

      // 5. Facet: Schedule Variance & Lateness
      if (lateness > 15) {
        empRiskScore += 10;
        grandFlaggedMinutes += lateness;
        flags.push({
          id: 'lateness',
          type: "Schedule Variance",
          shortTitle: "Late clock-in",
          detail: `Shift started ${lateness}m past scheduled start time`,
          severity: "Low Flag",
          severityLabel: "Low",
          color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
          metric: `${lateness}m late`,
          timeWindow: `Shift Clock-In (${lateness}m delay)`,
          durationStr: `${lateness}m`,
          recommendation: "Check shift schedule preferences or approve tardiness excuse."
        });
      }

      // 6. Facet: Dead-Channel / Zero Input Activity Freeze
      if (totalSecs > 1800 && (keystrokes + clicks) === 0) {
        empRiskScore += 30;
        flags.push({
          id: 'zero_input',
          type: "Zero Input Activity Freeze",
          shortTitle: "Zero telemetry logged",
          detail: `Active clock-in recorded for ${Math.round(totalSecs / 60)}m with zero keyboard or mouse click inputs`,
          severity: "High Flag",
          severityLabel: "High",
          color: "bg-red-500/10 text-red-500 border-red-500/20",
          metric: "0 inputs",
          timeWindow: `Logged Shift (${Math.round(totalSecs / 60)}m duration)`,
          durationStr: `${Math.round(totalSecs / 60)}m`,
          recommendation: "Verify desktop tracker client connectivity and background process status."
        });
      }

      // 7. Facet: Unexcused Absence
      if (isAbsent) {
        empRiskScore += 50;
        flags.push({
          id: 'absence',
          type: "Unexcused Absence",
          shortTitle: "Unexcused absence",
          detail: "No work shift activity logged for scheduled work day",
          severity: "High Flag",
          severityLabel: "High",
          color: "bg-red-500/10 text-red-500 border-red-500/20",
          metric: "Absent",
          timeWindow: "Full Work Day",
          durationStr: "0h worked",
          recommendation: "Contact staff member or mark leave request."
        });
      }

      // 8. Facet: Extended App Lock / Workstation Locked Screen (Lid Closed / PC Locked)
      let appLockSecs = audit?.metrics?.appLockSeconds || shiftMetrics.appLockSeconds || shiftMetrics.lockScreenSeconds || 0;
      let appLockTool = "";

      // Also detect from liveBreakdown for "Lockapp", "Windows Lock Screen", "LockApp.exe", "LogonUI"
      Object.entries(liveBreakdown).forEach(([appName, data]: [string, any]) => {
        const lowerName = appName.toLowerCase();
        const secs = typeof data === 'number' ? data : (data?.totalSeconds || 0);
        if (lowerName.includes("lockapp") || lowerName.includes("lock screen") || lowerName.includes("logonui") || lowerName.includes("screen lock")) {
          appLockSecs += secs;
          if (!appLockTool) appLockTool = appName;
        }
      });

      const appLockMins = Math.round(appLockSecs / 60);
      if (appLockSecs > 900) { // >15 mins locked
        const isHigh = appLockMins > 45;
        empRiskScore += isHigh ? 35 : 20;
        grandFlaggedMinutes += appLockMins;
        flags.push({
          id: 'extended_app_lock',
          type: "Extended App Lock / Workstation Locked",
          shortTitle: "Workstation locked",
          detail: `${appLockMins}m spent in locked screen / laptop lid closed during active shift`,
          severity: isHigh ? "High Flag" : "Medium Flag",
          severityLabel: isHigh ? "High" : "Medium",
          color: isHigh ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20",
          metric: `${appLockMins}m locked`,
          timeWindow: `Active Shift (${appLockMins}m locked)`,
          durationStr: `${appLockMins}m`,
          appName: appLockTool || "Workstation Lock Screen",
          recommendation: "Check if employee left workstation locked without ending shift or closing desktop tracker."
        });
      }

      // 9. Facet: Anti-Idle / Fake Activity Software & Websites (Mouse Jigglers / Auto-Clickers)
      let detectedFakeTool = "";
      let fakeToolSecs = 0;
      Object.entries(liveBreakdown).forEach(([appName, data]: [string, any]) => {
        const lowerName = appName.toLowerCase();
        const isFake = FAKE_ACTIVITY_KEYWORDS.some(k => lowerName.includes(k));
        const secs = typeof data === 'number' ? data : (data?.totalSeconds || 0);
        if (isFake) {
          detectedFakeTool = appName;
          fakeToolSecs += secs;
        }
      });

      if (detectedFakeTool || fakeToolSecs > 0) {
        empRiskScore += 45;
        flags.push({
          id: 'fake_activity_tool',
          type: "Anti-Idle / Fake Activity Software",
          shortTitle: "Fake activity tool detected",
          detail: `Detected active anti-idle/mouse jiggler utility or site (${detectedFakeTool || 'Mouse Jiggler'}) during shift`,
          severity: "High Flag",
          severityLabel: "High",
          color: "bg-red-500/10 text-red-500 border-red-500/20",
          metric: detectedFakeTool || "Anti-Idle Tool",
          timeWindow: `Active Work Session`,
          durationStr: `${Math.round(fakeToolSecs / 60)}m`,
          appName: detectedFakeTool,
          recommendation: "Immediate manager review required. Employee utilized automated input simulation software/site to spoof work."
        });
      }

      // 10. Facet: Input Disproportionality Anomaly (Huge Keystroke / Input Spike without Scroll or Clicks)
      const scrolls = shiftMetrics.scrolls || shiftMetrics.scrollDistance || 0;
      const totalSecondaryInputs = clicks + scrolls + (mouseDist > 0 ? 1 : 0);
      
      if (keystrokes > 3000 && totalSecondaryInputs < 15) {
        empRiskScore += 40;
        flags.push({
          id: 'input_disproportionality',
          type: "Input Disproportionality Anomaly",
          shortTitle: "Unbalanced input spike",
          detail: `Huge keystroke spike (${keystrokes} keys) with near-zero mouse/scroll activity (${clicks} clicks, ${scrolls} scrolls) suggesting automated macro or key repeat script`,
          severity: "High Flag",
          severityLabel: "High",
          color: "bg-red-500/10 text-red-500 border-red-500/20",
          metric: `${keystrokes} keys / ${clicks} clicks`,
          timeWindow: `Workstation Telemetry Window`,
          durationStr: `${keystrokes} keystrokes`,
          recommendation: "Inspect active app window for macro scripts, key-repeat loops, or synthetic keypress tools."
        });
      }

      if (flags.length > 0) {
        grandSuspiciousInstances += flags.length;
        const highestSeverity: "High Flag" | "Medium Flag" | "Low Flag" = flags.some(f => f.severity === "High Flag") 
          ? "High Flag" 
          : flags.some(f => f.severity === "Medium Flag") 
          ? "Medium Flag" 
          : "Low Flag";

        const highestSeverityLabel: "High" | "Medium" | "Low" = highestSeverity === "High Flag" ? "High" : highestSeverity === "Medium Flag" ? "Medium" : "Low";

        const empName = emp.name || emp.displayName || emp.email || "Employee";
        const primaryFlag = flags[0] || { detail: "Unusual activity flag", severity: highestSeverity, shortTitle: "Unusual activity" };
        
        flaggedEmployees.push({
          id: emp.id,
          employeeId: emp.id,
          employeeName: empName,
          name: empName,
          displayName: emp.displayName || empName,
          employeeEmail: emp.email || "",
          email: emp.email || "",
          role: emp.role || "Member",
          department: emp.department,
          avatarUrl: emp.photoUrl || emp.avatar,
          flag: primaryFlag,
          flags,
          highestSeverity,
          highestSeverityLabel,
          riskScore: Math.min(100, empRiskScore),
          totalIdleMinutes: idleMins,
          totalLatenessMinutes: lateness,
          appSwitchRate: switchRate,
          rawEmp: {
            ...emp,
            flag: primaryFlag,
            flags
          }
        });
      } else {
        cleanEmployees.push(emp);
      }
    });

    const totalFlaggedMembers = flaggedEmployees.length;
    const cleanWorkforceCount = cleanEmployees.length;
    
    // Org Risk Score
    const avgEmpRisk = totalFlaggedMembers > 0 
      ? Math.round(flaggedEmployees.reduce((acc, e) => acc + e.riskScore, 0) / employees.length) 
      : 0;

    const orgHealthStatus = avgEmpRisk > 30 ? "High Risk" : avgEmpRisk > 10 ? "Moderate Risk" : "Low Risk";

    return {
      flaggedEmployees,
      cleanEmployees,
      totalFlaggedMembers,
      totalSuspiciousInstances: grandSuspiciousInstances,
      totalFlaggedMinutes: grandFlaggedMinutes,
      cleanWorkforceCount,
      orgRiskScore: avgEmpRisk,
      orgHealthStatus
    };
  }, [employees, empAudits, targetDateStr]);
}
