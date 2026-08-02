import { create } from 'zustand';

export interface ErrorUserMeta {
  uid?: string;
  name?: string;
  email?: string;
  role?: string;
  orgId?: string;
  companyName?: string;
}

interface ErrorReportState {
  isOpen: boolean;
  errorMessage: string;
  stackTrace?: string;
  userMeta?: ErrorUserMeta;
  reportId: string | null;
  isAutoSending: boolean;
  openReport: (errorMessage: string, stackTrace?: string, userMeta?: ErrorUserMeta) => void;
  closeReport: () => void;
  setReportId: (id: string | null) => void;
}

export const useErrorReportStore = create<ErrorReportState>((set) => ({
  isOpen: false,
  errorMessage: '',
  stackTrace: undefined,
  userMeta: undefined,
  reportId: null,
  isAutoSending: false,
  openReport: (errorMessage, stackTrace, userMeta) => {
    set({ isOpen: true, errorMessage, stackTrace, userMeta, reportId: null, isAutoSending: true });

    if (typeof window !== "undefined") {
      try {
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
        
        let deviceType = "Desktop";
        if (/Mobile|Android|iP(hone|od)/i.test(ua)) deviceType = "Mobile";
        else if (/Tablet|iPad/i.test(ua)) deviceType = "Tablet";

        const deviceInfo = {
          device: deviceType,
          os: os,
          browser: browser,
          memory: memory,
          cpu: cpu,
          screen: typeof window !== "undefined" ? `${window.screen.width}x${window.screen.height}` : "N/A",
          language: navigator.language
        };

        const appContext = {
          url: typeof window !== "undefined" ? window.location.href : "N/A",
          path: typeof window !== "undefined" ? window.location.pathname : "N/A",
          referrer: typeof document !== "undefined" ? (document.referrer || "direct") : "direct",
          timestamp: new Date().toLocaleTimeString() + " " + new Date().toLocaleDateString(),
          online: navigator.onLine ? "Online" : "Offline",
          windowSize: typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight}` : "N/A"
        };

        fetch("/api/error-report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            errorMessage,
            stackTrace: stackTrace || "No trace available",
            additionalContext: null,
            deviceInfo,
            appContext,
            userMeta: userMeta || null
          })
        })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.reportId) {
            set({ reportId: data.reportId, isAutoSending: false });
          } else {
            set({ isAutoSending: false });
          }
        })
        .catch((err) => {
          console.error("Auto-reporting error failed:", err);
          set({ isAutoSending: false });
        });
      } catch (err) {
        console.error("Error building auto-report context:", err);
        set({ isAutoSending: false });
      }
    }
  },
  closeReport: () => set({ isOpen: false, errorMessage: '', stackTrace: undefined, userMeta: undefined, reportId: null, isAutoSending: false }),
  setReportId: (id) => set({ reportId: id })
}));
