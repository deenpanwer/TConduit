import { startOfDay, subDays, subMinutes, subHours } from "date-fns";

// Helper to create Firestore-like timestamps
const createTimestamp = (date: Date) => ({
  seconds: Math.floor(date.getTime() / 1000),
  nanoseconds: 0
});

const now = new Date();
const today = startOfDay(now);

// Generator for minute-by-minute activity
const generateScreenshots = (userId: string, project1Id: string, project2Id: string, app1: string, app2: string) => {
  return Array.from({ length: 15 }, (_, i) => {
    const isProj1 = i < 8;
    const projId = isProj1 ? project1Id : project2Id;
    const appName = isProj1 ? app1 : app2;
    const timestamp = subMinutes(now, 15 - i);
    
    // Injecting 3 "Idle" minutes (20% idle rate)
    const isIdle = i === 5 || i === 10 || i === 12;

    return {
      id: `${timestamp.toISOString()}-${userId.slice(0, 4)}`,
      activity: {
        activeWindow: {
          owner: isIdle ? "Desktop" : appName,
          title: isIdle ? "Idle" : (isProj1 ? `Development - Index.tsx` : `Research - Google Chrome`)
        }
      },
      keystrokes: isIdle ? 0 : Math.floor(Math.random() * 100) + (isProj1 ? 40 : 10),
      mouseClicks: isIdle ? 0 : Math.floor(Math.random() * 20) + 5,
      mouseDistance: isIdle ? 0 : Math.floor(Math.random() * 8000) + 500,
      base64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
      createdAt: timestamp.toISOString(),
      date: timestamp.toISOString().split('T')[0],
      mode: "window",
      projectId: projId,
      timestamp: createTimestamp(timestamp)
    };
  });
};

// --- HIGH FIDELITY ABSTRACTIONS (THE ENGINE) ---
const calculateAbstractions = (emp: any) => {
  const logs = emp.screenshots || [];
  const entries = emp.timeEntries || [];
  
  // 1. Total Clocked Time (From Time Entries)
  const totalSecondsClocked = entries.reduce((acc: number, curr: any) => acc + curr.duration, 0);
  const totalHoursClocked = (totalSecondsClocked / 3600).toFixed(1);

  // 2. Idle Detection (From Screenshots)
  // A minute is idle if NO keys, NO clicks, NO mouse movement
  const idleLogs = logs.filter((l: any) => l.keystrokes === 0 && l.mouseClicks === 0 && l.mouseDistance === 0);
  const idleRatio = idleLogs.length / logs.length;
  
  // 3. Extrapolated Yields
  const idleSeconds = totalSecondsClocked * idleRatio;
  const activeSeconds = totalSecondsClocked - idleSeconds;

  const idleHours = (idleSeconds / 3600).toFixed(1);
  const activeHours = (activeSeconds / 3600).toFixed(1);
  const productivityScore = ((1 - idleRatio) * 100).toFixed(0);

  // 4. Context Switch Penalty
  let switches = 0;
  for(let i=1; i<logs.length; i++) {
    if(logs[i].activity.activeWindow.owner !== logs[i-1].activity.activeWindow.owner) switches++;
  }

  // 5. Flow Rhythm
  const mean = logs.reduce((a: any, b: any) => a + b.keystrokes, 0) / logs.length;
  const variance = logs.reduce((a: any, b: any) => a + Math.pow(b.keystrokes - mean, 2), 0) / logs.length;
  const flowScore = Math.max(100 - Math.sqrt(variance), 40).toFixed(0);

  return {
    ...emp,
    interactionDNA: logs.map((l: any) => ({ keys: l.keystrokes, mouse: Math.round(l.mouseDistance/100) })),
    chronicle: logs.reduce((acc: any[], l: any) => {
      const title = l.activity.activeWindow.title;
      if (acc.length > 0 && acc[acc.length-1].title === title) acc[acc.length-1].duration += 1;
      else acc.push({ title, duration: 1, app: l.activity.activeWindow.owner, time: l.createdAt });
      return acc;
    }, []),
    intensity: (mean / 80).toFixed(2),
    contextSwitches: switches,
    flowScore,
    cognitiveLoad: (switches * 12 + (100 - parseInt(flowScore as string))).toFixed(0),
    
    // --- NEW PERFORMANCE YIELDS ---
    totalHoursClocked,
    activeHours,
    idleHours,
    productivityScore,
    idleRatio: (idleRatio * 100).toFixed(0),
    
    monthYield: 164.2,
    focusRatio: 88,
    stabilityScore: 94
  };
};

export const DUMMY_EMPLOYEES = [
  calculateAbstractions({
    id: "4aiZyPZso4WzTtTCMKEo6V0DROx1",
    name: "Deen Panwer",
    email: "deenpanwer@gmail.com",
    role: "Lead Architect",
    photoUrl: "https://lh3.googleusercontent.com/a/ACg8ocLZLwJYLJDy3PkVyYfhub8bjEtWIkv8bGuIVaAlBhmNS5aOfw=s96-c",
    orgId: "org_3yv2n5xl",
    orgStatus: "active",
    createdAt: createTimestamp(subDays(today, 25)),
    attachedAt: createTimestamp(subDays(today, 1)),
    updatedAt: createTimestamp(now),
    lastLoginTime: createTimestamp(subHours(now, 1)),
    lastLoginAppVersion: "1.0.4",
    lastLoginIpAddress: "68.166.184.55",
    lastLoginOs: "Windows_NT 10.0.19045 (x64)",
    lastLoginLocation: { city: "Karachi", country: "Pakistan", latitude: 24.8591, longitude: 66.9983, region: "Sindh" },
    heartbeat: { isCurrentlyRunning: true, lastActiveWindow: "Index.tsx - Visual Studio Code", currentLatency: 45 },
    projects: [
      { id: "Jt9gK2PiEY518kBCoUu7", name: "platform-core", color: "#3b82f6", totalTime: 45000, isRunning: true },
      { id: "vscode_proj", name: "chrome-research", color: "#10b981", totalTime: 12000, isRunning: false }
    ],
    timeEntries: [
      { id: "e1", duration: 12000, projectName: "platform-core", startTime: createTimestamp(subHours(now, 5)) },
      { id: "e2", duration: 6000, projectName: "chrome-research", startTime: createTimestamp(subHours(now, 8)) }
    ],
    screenshots: generateScreenshots("4aiZyPZso4WzTtTCMKEo6V0DROx1", "Jt9gK2PiEY518kBCoUu7", "vscode_proj", "Visual Studio Code", "Google Chrome")
  }),
  calculateAbstractions({
    id: "user_demo_2",
    name: "Sarah Chen",
    email: "sarah.c@trac.ai",
    role: "Senior UI Designer",
    photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
    orgId: "org_3yv2n5xl",
    orgStatus: "active",
    createdAt: createTimestamp(subDays(today, 30)),
    attachedAt: createTimestamp(subDays(today, 5)),
    updatedAt: createTimestamp(now),
    lastLoginTime: createTimestamp(subHours(now, 2)),
    lastLoginAppVersion: "1.0.4",
    lastLoginIpAddress: "142.250.190.46",
    lastLoginOs: "Darwin 23.2.0 (arm64)",
    lastLoginLocation: { city: "Toronto", country: "Canada", latitude: 43.6532, longitude: -79.3832, region: "Ontario" },
    heartbeat: { isCurrentlyRunning: true, lastActiveWindow: "Design System - Figma", currentLatency: 38 },
    projects: [
      { id: "figma_proj", name: "figma-design", color: "#8b5cf6", totalTime: 32000, isRunning: true },
      { id: "slack_proj", name: "slack-sync", color: "#f59e0b", totalTime: 8000, isRunning: false }
    ],
    timeEntries: [
      { id: "e3", duration: 18000, projectName: "figma-design", startTime: createTimestamp(subHours(now, 6)) }
    ],
    screenshots: generateScreenshots("user_demo_2", "figma_proj", "slack_proj", "Figma", "Slack")
  })
];

export const DUMMY_STATS = {
  totalHoursToday: "23.4",
  velocity: 114,
  topApps: [{ name: "Chrome", hours: 12.4, percentage: 53 }, { name: "Figma", hours: 11.0, percentage: 47 }],
  activeEmployees: 2, totalStaff: 2, locationsCount: 2
};

export const DUMMY_ORG = {
  orgName: "TRAC STUDIO DEMO",
  name: "TRAC STUDIO DEMO",
  inviteCode: "DEMO-773-XYZ",
  industry: "Technology",
  role: "Founder"
};
