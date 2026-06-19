import { db } from "./firebase";
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";

export const playNoisyAlert = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5 note (clear alert pitch)
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.45); // Play for 450ms
  } catch (e) {
    console.error("Audio chime failed", e);
  }
};

export const scanMissedFollowups = async (
  leads: any[],
  user: any,
  orgId: string,
  fields: any[]
) => {
  if (!user || !orgId) return;

  // Find Next Follow Up field dynamically
  const followUpField = fields.find(f => 
    (f.label.toLowerCase().includes("follow") || f.key.toLowerCase().includes("follow")) &&
    f.type === "date"
  );
  const followUpKey = followUpField ? followUpField.key : "lastInteraction";

  // Filter leads assigned to the logged-in user that have a missed follow-up date
  const myMissedLeads = leads.filter(lead => {
    const isAssigned = lead.data?.assignedTo === user.uid || lead.assignedTo === user.uid;
    const isDeleted = lead.isDeleted;
    if (!isAssigned || isDeleted) return false;

    const followUpVal = lead.data?.[followUpKey] || lead[followUpKey];
    if (!followUpVal) return false;

    // Safe parse date (supporting Timestamp objects, plain objects, or strings)
    let followUpDate: Date | null = null;
    if (followUpVal && typeof followUpVal.toDate === 'function') {
      followUpDate = followUpVal.toDate();
    } else if (followUpVal && followUpVal.seconds !== undefined) {
      followUpDate = new Date(followUpVal.seconds * 1000);
    } else {
      const cleanVal = typeof followUpVal === 'string' ? followUpVal.replace(/(\d+)(st|nd|rd|th)/gi, '$1') : followUpVal;
      const parsed = new Date(cleanVal);
      if (!isNaN(parsed.getTime())) {
        followUpDate = parsed;
      }
    }

    if (!followUpDate) return false;
    const now = new Date();
    return followUpDate.getTime() < now.getTime();
  });

  if (myMissedLeads.length === 0) return;

  // Query existing missed follow-up notifications under users/{userId}/notifications
  const notifQuery = query(
    collection(db, "users", user.uid, "notifications"),
    where("type", "==", "crm_missed_followup")
  );
 
  try {
    const snapshot = await getDocs(notifQuery);
    
    // Map leadId -> Set of follow-up dates already notified
    const notifiedDates = new Map<string, Set<string>>();
    snapshot.docs.forEach(d => {
      const data = d.data();
      if (data.leadId && data.followUpDate) {
        if (!notifiedDates.has(data.leadId)) {
          notifiedDates.set(data.leadId, new Set());
        }
        notifiedDates.get(data.leadId)!.add(data.followUpDate);
      }
    });
 
    let notificationsCreated = 0;
 
    for (const lead of myMissedLeads) {
      const leadDateVal = lead.data?.[followUpKey] || lead[followUpKey];
      const dateStr = typeof leadDateVal.toDate === 'function' ? leadDateVal.toDate().toISOString() : String(leadDateVal);
      const isAlreadyNotified = notifiedDates.get(lead.id)?.has(dateStr);
 
      if (!isAlreadyNotified) {
        // Create missed follow-up notification doc under users/{userId}/notifications
        const notificationRef = doc(collection(db, "users", user.uid, "notifications"));
        await setDoc(notificationRef, {
          id: notificationRef.id,
          orgId,
          type: 'crm_missed_followup',
          leadId: lead.id,
          leadName: lead.name,
          followUpDate: dateStr, // Track the specific follow-up date
          title: `Missed Follow-up on ${lead.name}`,
          body: `You have missed your scheduled follow-up for ${lead.name}. Click to submit a reason.`,
          senderId: 'system',
          recipientId: user.uid,
          status: 'pending',
          createdAt: serverTimestamp()
        });
 
        // Trigger Toast (website notification toast)
        toast.error(`Scheduled follow-up for ${lead.name} has been missed.`, {
          duration: 8000,
          action: {
            label: "Details",
            onClick: () => {
              window.location.href = `/crm/leads/${lead.id}`;
            }
          }
        });
 
        // Trigger native desktop alert (max 3 popups to prevent a barrage during bulk uploads)
        if (notificationsCreated < 3 && typeof window !== 'undefined' && 'Notification' in window) {
          if (Notification.permission === 'granted') {
            new Notification("Missed CRM Follow-up", {
              body: `Scheduled follow-up for ${lead.name} has been missed.`,
            });
          }
        }
        notificationsCreated++;
      }
    }
  } catch (error) {
    console.error("Error scanning missed follow-ups:", error);
  }
};
