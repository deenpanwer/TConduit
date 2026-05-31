"use client";

import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogClose 
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useErrorReportStore } from "@/store/use-error-report-store";
import { AlertCircle, Cpu, Info, Loader2, ChevronDown, ChevronUp, X } from "lucide-react";
import { toast } from "sonner";

export function ErrorReportModal() {
  const { isOpen, errorMessage, stackTrace, closeReport } = useErrorReportStore();
  
  // Only the device configuration has a checkbox and can be opted out of
  const [includeDeviceInfo, setIncludeDeviceInfo] = useState(true);
  
  // Technical details (stack trace + page info) are always sent, but collapsible for clean UI
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  // Additional context (optional)
  const [additionalContext, setAdditionalContext] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Metadata states
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [appContext, setAppContext] = useState<any>(null);

  // Gather metadata on open
  useEffect(() => {
    if (isOpen) {
      // Gather Device Info
      const ua = navigator.userAgent;
      let browser = "Browser";
      if (ua.includes("Chrome")) browser = "Chrome";
      else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
      else if (ua.includes("Firefox")) browser = "Firefox";
      else if (ua.includes("Edge")) browser = "Edge";

      let os = "Operating System";
      if (ua.includes("Windows")) os = "Windows";
      else if (ua.includes("Mac")) os = "macOS";
      else if (ua.includes("Linux")) os = "Linux";
      else if (ua.includes("Android")) os = "Android";
      else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

      const memory = (navigator as any).deviceMemory ? `${(navigator as any).deviceMemory} GB` : "N/A";
      const cpu = navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} cores` : "N/A";
      
      setDeviceInfo({
        device: "Desktop",
        os: os,
        browser: browser,
        memory: memory,
        cpu: cpu,
        screen: typeof window !== "undefined" ? `${window.screen.width}x${window.screen.height}` : "N/A",
        language: navigator.language
      });

      // Gather App Context
      setAppContext({
        url: typeof window !== "undefined" ? window.location.href : "N/A",
        path: typeof window !== "undefined" ? window.location.pathname : "N/A",
        referrer: typeof document !== "undefined" ? (document.referrer || "direct") : "direct",
        timestamp: new Date().toLocaleTimeString() + " " + new Date().toLocaleDateString(),
        online: navigator.onLine ? "Online" : "Offline",
        windowSize: typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight}` : "N/A"
      });

      // Reset states
      setAdditionalContext("");
      setIsSubmitting(false);
      setShowTechnicalDetails(false);
      setIncludeDeviceInfo(true);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Stack trace and App Context are always sent as they are crucial diagnostics
      const payload = {
        errorMessage,
        stackTrace: stackTrace || "No trace available",
        additionalContext: additionalContext.trim() || null,
        deviceInfo: includeDeviceInfo ? deviceInfo : null,
        appContext: appContext
      };

      const res = await fetch("/api/error-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }

      toast.success("Thank you for your report. Our technical team has been notified.");
      closeReport();
    } catch (err: any) {
      console.error("Submission failed:", err);
      toast.error("Unable to send report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeReport()}>
      <DialogContent className="max-w-[460px] w-[90vw] p-0 border border-border bg-background text-foreground rounded-2xl shadow-2xl z-[101] flex flex-col max-h-[82vh] overflow-hidden">
        
        {/* Pinned Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/10 shrink-0">
          <DialogTitle className="text-sm font-semibold tracking-tight text-foreground">
            Report an Issue
          </DialogTitle>
        </div>

        {/* Scrollable Body (Guarantees no infinite expansion, header/footer remain pinned) */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0 custom-scrollbar">
          
          {/* Guide Text */}
          <p className="text-xs text-muted-foreground leading-relaxed">
            Help us improve Trac AI by letting us know what went wrong. Diagnostic details and page links will be included automatically to help our team solve the issue.
          </p>

          {/* Issue Details Box */}
          <div className="p-3.5 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive-foreground">
            <div className="flex items-center gap-1.5 mb-1 text-[10px] font-semibold text-destructive/80 uppercase tracking-wider">
              <AlertCircle className="w-3.5 h-3.5 text-destructive" />
              Issue Details
            </div>
            <p className="text-xs font-semibold leading-relaxed break-words text-foreground font-mono">
              {errorMessage || "An unexpected error occurred"}
            </p>
          </div>

          {/* Device Configuration Toggle (The only checkbox) */}
          <div className="space-y-2 pt-1">
            <div className="flex items-start gap-3">
              <Checkbox 
                id="device-info" 
                checked={includeDeviceInfo} 
                onCheckedChange={(checked) => setIncludeDeviceInfo(!!checked)}
                className="mt-0.5"
              />
              <div className="grid gap-0.5 flex-1">
                <Label htmlFor="device-info" className="text-xs font-semibold cursor-pointer">
                  Include device configuration
                </Label>
                <span className="text-[10px] text-muted-foreground leading-normal">
                  Share browser type, screen resolution, and operating system.
                </span>
              </div>
            </div>

            {includeDeviceInfo && deviceInfo && (
              <div className="ml-7 rounded-xl border border-border bg-muted/30 p-3 text-[10px] text-muted-foreground space-y-1.5">
                <div className="flex justify-between items-center border-b border-border/40 pb-1">
                  <span>Device / OS</span>
                  <span className="font-semibold text-foreground">{deviceInfo.device} ({deviceInfo.os})</span>
                </div>
                <div className="flex justify-between items-center border-b border-border/40 pb-1">
                  <span>Browser</span>
                  <span className="font-semibold text-foreground">{deviceInfo.browser}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Screen Resolution</span>
                  <span className="font-semibold text-foreground">{deviceInfo.screen}</span>
                </div>
              </div>
            )}
          </div>

          {/* Technical Diagnostic Details Drawer (Always included, collapsed by default) */}
          <div className="pt-2 border-t border-border/40">
            <button 
              type="button"
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              {showTechnicalDetails ? (
                <>Hide technical details <ChevronUp className="w-3.5 h-3.5" /></>
              ) : (
                <>View technical details <ChevronDown className="w-3.5 h-3.5" /></>
              )}
            </button>
            
            {showTechnicalDetails && (
              <div className="mt-2.5 space-y-2.5">
                {/* Stack Trace */}
                {stackTrace && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      📁 Call Stack Trace
                    </span>
                    <div className="rounded-lg border border-border bg-muted/40 p-2.5 font-mono text-[9px] text-muted-foreground overflow-x-auto max-h-[100px] whitespace-pre leading-normal select-all">
                      {stackTrace}
                    </div>
                  </div>
                )}
                
                {/* Page details */}
                {appContext && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      🌐 Page Parameters
                    </span>
                    <div className="rounded-lg border border-border bg-muted/40 p-2.5 font-mono text-[9px] text-muted-foreground overflow-x-auto max-h-[100px] leading-normal">
                      {JSON.stringify(appContext, null, 2)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tell us what happened (optional) */}
          <div className="space-y-1.5 pt-2 border-t border-border/40">
            <Label htmlFor="comments" className="text-xs font-semibold">
              Tell us what happened (optional)
            </Label>
            <Textarea
              id="comments"
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              placeholder="Describe what you were doing when the issue occurred..."
              className="min-h-[70px] max-h-[120px] rounded-xl border-input bg-background text-foreground text-xs focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0 leading-relaxed placeholder:text-muted-foreground shrink-0"
            />
          </div>

        </div>

        {/* Pinned Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-border bg-muted/10 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={closeReport}
            className="flex-1 rounded-xl font-semibold py-3 text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 rounded-xl font-semibold py-3 text-xs flex items-center justify-center gap-1.5"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Report"
            )}
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
