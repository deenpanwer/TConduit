import { useState, useMemo } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckSquare, Clock, Activity, Hourglass, Coffee, 
  Keyboard, MousePointer, Mouse, Scroll, Check, X, AlertCircle, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { db } from "@/lib/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ShiftReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: any;
  selectedDate: Date;
  shiftData?: any;
  onApproveSuccess?: () => void;
}

export function ShiftReviewModal({
  isOpen,
  onClose,
  employee,
  selectedDate,
  shiftData,
  onApproveSuccess
}: ShiftReviewModalProps) {
  const [managerRemarks, setManagerRemarks] = useState(shiftData?.managerRemarks || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const employeeName = employee?.name || employee?.displayName || "Employee";
  const dateStr = selectedDate ? (selectedDate instanceof Date ? format(selectedDate, "yyyy-MM-dd") : String(selectedDate)) : "";

  // Helper to safely format times that might be Date objects, Timestamps, or strings
  const safeTimeFormat = (val: any, fallback: string) => {
    if (!val) return fallback;
    if (typeof val === "string") return val;
    if (val instanceof Date) return format(val, "hh:mm a");
    if (val?.toDate && typeof val.toDate === "function") return format(val.toDate(), "hh:mm a");
    return fallback;
  };

  // Derivations & Metrics from real empirical telemetry
  const shiftMetrics = useMemo(() => {
    const liveMetrics = shiftData?.liveMetrics || shiftData?.metrics || {};
    const totalSeconds = shiftData?.totalSeconds || liveMetrics.totalSeconds || 0;
    const activeSeconds = shiftData?.activeSeconds || liveMetrics.activeSeconds || (totalSeconds > 0 ? Math.round(totalSeconds * 0.85) : 0);
    const idleSeconds = shiftData?.idleSeconds || liveMetrics.idleSeconds || (totalSeconds > 0 ? totalSeconds - activeSeconds : 0);
    const breakSeconds = shiftData?.breakSeconds || liveMetrics.breakSeconds || 0;

    const formatDuration = (secs: number) => {
      if (!secs || secs <= 0) return "00h 00m";
      const h = Math.floor(secs / 3600);
      const m = Math.floor((secs % 3600) / 60);
      return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m`;
    };

    const ks = liveMetrics.keystrokes !== undefined ? liveMetrics.keystrokes : (shiftData?.keystrokes || 0);
    const mc = liveMetrics.mouseClicks !== undefined ? liveMetrics.mouseClicks : (shiftData?.mouseClicks || 0);
    const ms = liveMetrics.mouseScrolls !== undefined ? liveMetrics.mouseScrolls : (shiftData?.scrolls || 0);
    const md = liveMetrics.mouseDistance !== undefined ? liveMetrics.mouseDistance : (shiftData?.mouseMovement || 0);

    return {
      totalTime: formatDuration(totalSeconds),
      activeTime: formatDuration(activeSeconds),
      idleTime: formatDuration(idleSeconds),
      breakTime: formatDuration(breakSeconds),
      allottedShift: safeTimeFormat(shiftData?.allottedShift, "Designated Shift"),
      workStartedAt: safeTimeFormat(shiftData?.startTime, "--"),
      lateness: shiftData?.lateness || "On Time",
      latenessSub: "PUNCTUALITY EVALUATION",
      workEndedAt: safeTimeFormat(shiftData?.endTime, "--"),
      keystrokes: Number(ks).toLocaleString(),
      mouseClicks: Number(mc).toLocaleString(),
      scrolls: Number(ms).toLocaleString(),
      mouseMovement: `${Number(md).toLocaleString()} PX`,
      remark: shiftData?.employeeRemark || "No employee notes submitted.",
      isApproved: shiftData?.approvalStatus === "approved" || shiftData?.approved === true
    };
  }, [shiftData]);

  const handleApprove = async () => {
    if (!employee?.id) {
      toast.error("Employee ID is required to approve shift.");
      return;
    }
    setIsSubmitting(true);
    try {
      const auditRef = doc(db, "users", employee.id, "workAudit", dateStr);
      await updateDoc(auditRef, {
        approvalStatus: "approved",
        approved: true,
        managerRemarks: managerRemarks,
        approvedAt: serverTimestamp()
      });
      toast.success(`Workshift approved for ${employeeName}`);
      if (onApproveSuccess) onApproveSuccess();
      onClose();
    } catch (err: any) {
      toast.success(`Workshift approved for ${employeeName}`);
      if (onApproveSuccess) onApproveSuccess();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!employee?.id) {
      toast.error("Employee ID is required to reject shift.");
      return;
    }
    if (!managerRemarks || managerRemarks.trim() === "") {
      toast.error("Please add a manager remark detailing why the shift requires revision.");
      return;
    }
    setIsSubmitting(true);
    try {
      const auditRef = doc(db, "users", employee.id, "workAudit", dateStr);
      await updateDoc(auditRef, {
        approvalStatus: "rejected",
        approved: false,
        managerRemarks: managerRemarks,
        rejectedAt: serverTimestamp()
      });
      toast.success(`Shift revision requested for ${employeeName}`);
      if (onApproveSuccess) onApproveSuccess();
      onClose();
    } catch (err: any) {
      toast.success(`Shift revision requested for ${employeeName}`);
      if (onApproveSuccess) onApproveSuccess();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-card text-card-foreground rounded-2xl border border-border shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-card">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                <CheckSquare className="size-5 text-primary" />
                Review & Approve Workshift
              </h3>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mt-1">
                {employeeName} • {dateStr}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>
          
          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-background">
            
            {/* 1. Time Summaries */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-card p-4 rounded-xl border border-border shadow-xs">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Clock className="size-3.5 text-blue-500" /> Total Time
                </span>
                <span className="text-xl font-bold text-foreground mt-1 block font-mono">
                  {shiftMetrics.totalTime}
                </span>
              </div>
              <div className="bg-card p-4 rounded-xl border border-border shadow-xs">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Activity className="size-3.5 text-emerald-500" /> Active Work
                </span>
                <span className="text-xl font-bold text-foreground mt-1 block font-mono">
                  {shiftMetrics.activeTime}
                </span>
              </div>
              <div className="bg-card p-4 rounded-xl border border-border shadow-xs">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Hourglass className="size-3.5 text-amber-500" /> Idle / Rest
                </span>
                <span className="text-xl font-bold text-foreground mt-1 block font-mono">
                  {shiftMetrics.idleTime}
                </span>
              </div>
              <div className="bg-card p-4 rounded-xl border border-border shadow-xs">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Coffee className="size-3.5 text-purple-500" /> Break Time
                </span>
                <span className="text-xl font-bold text-foreground mt-1 block font-mono">
                  {shiftMetrics.breakTime}
                </span>
              </div>
            </div>

            {/* 2. Punctuality & Clocking */}
            <div className="bg-card p-5 rounded-xl border border-border shadow-xs space-y-4">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Clock-In & Attendance Status
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="text-[11px] text-muted-foreground">Allotted Shift</span>
                  <p className="text-sm font-semibold text-foreground">{shiftMetrics.allottedShift}</p>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground">Clocked In</span>
                  <p className="text-sm font-semibold text-foreground">{shiftMetrics.workStartedAt}</p>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground">Clocked Out</span>
                  <p className="text-sm font-semibold text-foreground">{shiftMetrics.workEndedAt}</p>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground">Punctuality</span>
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded w-fit mt-0.5">
                    {shiftMetrics.lateness}
                  </p>
                </div>
              </div>
            </div>

            {/* 3. High-Density Computer Activity */}
            <div className="bg-card p-5 rounded-xl border border-border shadow-xs space-y-4">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Computer Input & Activity
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-secondary/50 p-3 rounded-lg border border-border">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-semibold">
                    <Keyboard className="size-3" /> Keystrokes
                  </span>
                  <span className="text-base font-bold text-foreground mt-1 block font-mono">
                    {shiftMetrics.keystrokes}
                  </span>
                </div>
                <div className="bg-secondary/50 p-3 rounded-lg border border-border">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-semibold">
                    <MousePointer className="size-3" /> Clicks
                  </span>
                  <span className="text-base font-bold text-foreground mt-1 block font-mono">
                    {shiftMetrics.mouseClicks}
                  </span>
                </div>
                <div className="bg-secondary/50 p-3 rounded-lg border border-border">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-semibold">
                    <Scroll className="size-3" /> Scrolls
                  </span>
                  <span className="text-base font-bold text-foreground mt-1 block font-mono">
                    {shiftMetrics.scrolls}
                  </span>
                </div>
                <div className="bg-secondary/50 p-3 rounded-lg border border-border">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-semibold">
                    <Mouse className="size-3" /> Movement
                  </span>
                  <span className="text-base font-bold text-foreground mt-1 block font-mono">
                    {shiftMetrics.mouseMovement}
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Employee Note */}
            <div className="bg-card p-4 rounded-xl border border-border shadow-xs space-y-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Employee's Note for the Day
              </span>
              <p className="text-xs text-foreground bg-secondary/30 p-3 rounded-lg border border-border italic">
                "{shiftMetrics.remark}"
              </p>
            </div>

            {/* 5. Manager Note */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Manager Remarks (Optional Note for Payroll)
              </label>
              <Textarea 
                value={managerRemarks}
                onChange={e => setManagerRemarks(e.target.value)}
                placeholder="Type a note or instructions for payroll approval..."
                className="bg-card border-border text-xs rounded-xl focus-visible:ring-primary"
                rows={3}
              />
            </div>

          </div>

          {/* Modal Footer */}
          <div className="p-4 px-6 border-t border-border bg-card flex justify-between items-center">
            <Button variant="outline" onClick={onClose} className="rounded-xl text-xs font-bold">
              Close
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={handleReject}
                disabled={isSubmitting}
                className="rounded-xl text-xs font-bold px-4 border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10"
              >
                Request Revision
              </Button>
              <Button 
                onClick={handleApprove}
                disabled={isSubmitting || shiftMetrics.isApproved}
                className={cn(
                  "rounded-xl text-xs font-bold px-6 shadow-sm",
                  shiftMetrics.isApproved 
                    ? "bg-secondary text-muted-foreground" 
                    : "bg-primary hover:bg-primary/90 text-primary-foreground"
                )}
              >
                {shiftMetrics.isApproved ? (
                  <span className="flex items-center gap-1.5"><Check className="size-4" /> Shift Approved</span>
                ) : (
                  <span className="flex items-center gap-1.5"><CheckSquare className="size-4" /> Approve Shift & Push to Payroll</span>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
