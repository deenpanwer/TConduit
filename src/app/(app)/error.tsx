"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useErrorReportStore } from "@/store/use-error-report-store";
import { useAuth } from "@/hooks/use-auth";
import { AlertCircle, RotateCcw, Send } from "lucide-react";

export default function AppErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { openReport } = useErrorReportStore();
  const { user, userData } = useAuth();

  useEffect(() => {
    // Log the error to console for local developer debugging
    console.error("Uncaught application error boundary:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] w-full px-4 py-12 text-center bg-background text-foreground font-sans">
      <div className="max-w-[440px] w-full p-8 rounded-2xl border border-border bg-card shadow-lg space-y-6">
        
        {/* Warning Icon */}
        <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h2 className="text-lg font-bold tracking-tight">Something went wrong</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            An unexpected error occurred while loading this page. We have captured the diagnostic details and are ready to help.
          </p>
        </div>

        {/* Display Simplified Error Message */}
        <div className="p-3.5 rounded-xl border border-border bg-muted/40 font-mono text-[11px] text-muted-foreground break-words text-left leading-normal">
          {error.message || "Unknown rendering exception"}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            onClick={() => reset()}
            variant="outline"
            className="flex-1 rounded-xl font-medium py-5 text-sm flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Try again
          </Button>
          <Button
            onClick={() => {
              const userMeta = {
                uid: user?.uid,
                name: userData?.name || user?.displayName || undefined,
                email: userData?.email || user?.email || undefined,
                role: userData?.role,
                orgId: userData?.ownedOrgId || userData?.orgId,
                companyName: userData?.companyName,
              };
              openReport(error.message, error.stack, userMeta);
            }}
            className="flex-1 rounded-xl font-semibold py-5 text-sm flex items-center justify-center gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            Report Issue
          </Button>
        </div>

      </div>
    </div>
  );
}
