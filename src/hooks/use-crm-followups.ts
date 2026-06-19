import { useEffect } from "react";
import { scanMissedFollowups } from "@/lib/crmFollowUpService";

export function useCrmFollowups(
  leads: any[],
  user: any,
  orgId: string | undefined,
  fields: any[]
) {
  useEffect(() => {
    if (!leads || !user || !orgId || !fields || fields.length === 0) return;

    // Check permissions and request if needed
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }

    // Run the scan
    scanMissedFollowups(leads, user, orgId, fields);
  }, [leads, user, orgId, fields]);
}
