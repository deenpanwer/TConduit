"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  ToastAction,
} from "@/components/ui/toast"
import { useErrorReportStore } from "@/store/use-error-report-store"
import { shouldShowReportButton } from "@/lib/error-filter"

export function Toaster() {
  const { toasts } = useToast()
  const { openReport } = useErrorReportStore()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        const isDestructive = props.variant === "destructive";
        const messageText = `${title || ""} ${description || ""}`.trim();
        const eligible = isDestructive && shouldShowReportButton(messageText);

        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {eligible && !action && (
              <ToastAction
                altText="Report"
                onClick={() => {
                  let errorStack = "";
                  try {
                    throw new Error(messageText || "Radix destructive toast error");
                  } catch (e: any) {
                    errorStack = e.stack || "";
                  }
                  openReport(messageText || "System Error", errorStack);
                }}
              >
                Report
              </ToastAction>
            )}
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}

