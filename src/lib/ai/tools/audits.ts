import { tool } from 'ai';
import { z } from 'zod';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export const auditEmployeeTool = tool({
  description: 'Perform a truthful audit of an employee performance for a specific date',
  inputSchema: z.object({
    orgId: z.string().describe('The organization ID'),
    employeeId: z.string().describe('The unique ID of the employee'),
    employeeName: z.string().describe('The name of the employee'),
    date: z.string().describe('The date to audit (YYYY-MM-DD)'),
  }),
  execute: async ({ orgId, employeeId, employeeName, date }) => {
    const admin = getFirebaseAdmin();
    if (!admin) return { success: false, error: "Database connection failed" };

    const db = admin.firestore();

    // Verify employee belongs to org
    const userDoc = await db.collection('users').doc(employeeId).get();
    if (!userDoc.exists || userDoc.data()?.orgId !== orgId) {
        return { success: false, error: "Employee not found in this organization" };
    }

    const shiftsRef = db.collection('users').doc(employeeId).collection('workShifts');
    
    // Query shifts for the date
    // Note: The ID of the shift doc is usually the date (YYYY-MM-DD)
    const snapshot = await shiftsRef.where('__name__', '>=', date).where('__name__', '<=', date + '\uf8ff').get();

    if (snapshot.empty) {
        return { 
            success: true, 
            employeeId, 
            employeeName, 
            date, 
            summary: "No work records found for this date. The employee did not log any activity." 
        };
    }

    const shifts = snapshot.docs.map(doc => doc.data());
    
    // Simple analysis of the shifts
    let totalSeconds = 0;
    let totalKeystrokes = 0;
    let totalMouseClicks = 0;
    const apps: Record<string, number> = {};

    shifts.forEach(s => {
        const metrics = s.liveMetrics || s.metrics || {};
        totalSeconds += metrics.totalSeconds || s.totalSeconds || 0;
        totalKeystrokes += metrics.keystrokes || s.keystrokes || 0;
        totalMouseClicks += metrics.mouseClicks || s.mouseClicks || 0;

        if (s.liveBreakdown) {
            Object.entries(s.liveBreakdown).forEach(([app, data]) => {
                const secs = typeof data === 'number' ? data : (data as any).totalSeconds || 0;
                apps[app] = (apps[app] || 0) + secs;
            });
        }
    });

    const hours = (totalSeconds / 3600).toFixed(1);
    const topApps = Object.entries(apps)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, secs]) => `${name} (${(secs / 60).toFixed(0)}m)`)
        .join(', ');

    return {
        success: true,
        employeeId,
        employeeName,
        date,
        metrics: {
            totalHours: hours,
            keystrokes: totalKeystrokes,
            mouseClicks: totalMouseClicks,
            topApps
        },
        summary: `Analyzed ${shifts.length} shift(s). Total work time: ${hours} hours. Activity: ${totalKeystrokes} keystrokes, ${totalMouseClicks} clicks. Primary focus: ${topApps}.`
    };
  },
});
