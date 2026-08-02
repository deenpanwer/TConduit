"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useErrorReportStore } from "@/store/use-error-report-store";
import { useAuth } from "@/hooks/use-auth";
import { shouldShowReportButton } from "@/lib/error-filter";

export function ErrorReportInitializer() {
  const { openReport } = useErrorReportStore();
  const { user, userData } = useAuth();

  // Use refs so the patched toast closure always reads the latest auth state
  const userRef = useRef(user);
  const userDataRef = useRef(userData);
  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => { userDataRef.current = userData; }, [userData]);

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
            const userMeta = {
              uid: userRef.current?.uid,
              name: userDataRef.current?.name || userRef.current?.displayName || undefined,
              email: userDataRef.current?.email || userRef.current?.email || undefined,
              role: userDataRef.current?.role,
              orgId: userDataRef.current?.ownedOrgId || userDataRef.current?.orgId,
              companyName: userDataRef.current?.companyName,
            };

            // Trigger immediate background error reporting
            openReport(msgString, errorStack, userMeta);

            toastOptions.action = options?.action || {
              label: "Add Details",
              onClick: () => {
                useErrorReportStore.setState({ isOpen: true });
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
