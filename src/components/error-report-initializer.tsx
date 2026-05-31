"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useErrorReportStore } from "@/store/use-error-report-store";
import { shouldShowReportButton } from "@/lib/error-filter";

export function ErrorReportInitializer() {
  const { openReport } = useErrorReportStore();

  useEffect(() => {
    if (typeof window !== "undefined" && !(toast as any).__isPatched) {
      let isToastInterceptorActive = false;

      // Patch Sonner toast.error globally
      const originalError = toast.error;

      toast.error = (message: any, options: any) => {
        // Prevent infinite loops if any toast triggers error callbacks recursively
        if (isToastInterceptorActive) {
          return originalError(message, options);
        }

        try {
          isToastInterceptorActive = true;

          let msgString = "";
          let errorStack = "";

          if (message instanceof Error) {
            msgString = message.message;
            errorStack = message.stack || "";
          } else if (typeof message === "object" && message !== null) {
            msgString = message.message || JSON.stringify(message);
            errorStack = message.stack || "";
          } else {
            msgString = String(message);
          }

          // Apply our filter to exclude hydration and firebase permission errors
          const eligible = shouldShowReportButton(msgString);

          // Capture a clean call stack trace if eligible and none is present
          if (eligible && !errorStack) {
            try {
              throw new Error(msgString);
            } catch (e: any) {
              errorStack = e.stack || "";
              if (typeof errorStack === 'string') {
                const lines = errorStack.split('\n');
                if (lines.length > 2) {
                  errorStack = [lines[0], ...lines.slice(2)].join('\n');
                }
              }
            }
          }

          const toastOptions = { ...options };

          if (eligible) {
            toastOptions.action = options?.action || {
              label: "Report",
              onClick: () => {
                openReport(msgString, errorStack);
              },
            };
          }

          return originalError(message, toastOptions);
        } catch (err) {
          // Fallback to standard error toast if anything fails
          return originalError(message, options);
        } finally {
          isToastInterceptorActive = false;
        }
      };

      (toast as any).__isPatched = true;
    }
  }, [openReport]);

  return null;
}
