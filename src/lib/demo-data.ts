import { format } from 'date-fns';

const today = new Date();
const todayStr = format(today, 'yyyy-MM-dd');
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);
const yesterdayStr = format(yesterday, 'yyyy-MM-dd');

export const demoOwnerData = {
  id: "demo-owner",
  name: "Sarah Chen",
  email: "sarah@nextgenmedia.com",
  role: "CEO",
  orgName: "NextGen Media",
  orgId: "demo-org",
  ownedOrgId: "demo-org",
  createdAt: new Date("2024-01-15T08:00:00Z"),
  photoUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=Sarah",
};

export const demoOrgData = {
  id: "demo-org",
  name: "NextGen Media",
  createdAt: new Date("2024-01-15T08:00:00Z"),
  selectedModules: ["ems", "sales"],
  subscriptionExpiry: new Date("2026-01-01T00:00:00Z"),
};

// Generate realistic dummy shifts
function generateShift(dateStr: string, activeHours: number, topApp: string, secondaryApp: string) {
  const activeSeconds = activeHours * 3600;
  const totalSeconds = activeSeconds + 1800; // adding 30 mins idle
  
  const hourlyPulse: any = {};
  for (let i = 9; i < 9 + activeHours; i++) {
    hourlyPulse[i.toString()] = {
      seconds: 3600,
      keystrokes: Math.floor(Math.random() * 500) + 200,
      mouseClicks: Math.floor(Math.random() * 300) + 100,
      mouseDistance: Math.floor(Math.random() * 5000) + 1000,
      scrollDistance: Math.floor(Math.random() * 3000) + 500,
      mouseScrolls: Math.floor(Math.random() * 3000) + 500,
    };
  }

  return {
    id: `${dateStr}_shift1`,
    date: dateStr,
    startTime: new Date(`${dateStr}T09:00:00Z`),
    endTime: new Date(`${dateStr}T${9 + activeHours}:00:00Z`),
    status: activeHours < 8 ? "active" : "completed",
    totalSeconds,
    liveMetrics: {
      totalSeconds,
      activeSeconds,
      idleSeconds: totalSeconds - activeSeconds,
      keystrokes: activeHours * 350,
      mouseClicks: activeHours * 200,
      mouseDistance: activeHours * 3000,
      mouseScrolls: activeHours * 2000,
    },
    liveBreakdown: {
      [topApp]: { totalSeconds: activeSeconds * 0.7 },
      [secondaryApp]: { totalSeconds: activeSeconds * 0.3 },
    },
    hourlyPulse
  };
}

function generateHistory(days: number, topApp: string, secondaryApp: string) {
  const shifts = [];
  for (let i = 2; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    // skip weekends
    if (d.getDay() !== 0 && d.getDay() !== 6) {
      const hrs = Math.floor(Math.random() * 3) + 6; // 6-8 hours
      shifts.push(generateShift(format(d, 'yyyy-MM-dd'), hrs, topApp, secondaryApp));
    }
  }
  return shifts;
}

export const demoEmployees = [
  {
    id: "e1",
    name: "Alex Rivera",
    email: "alex@nextgenmedia.com",
    role: "Senior Engineer",
    photoUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=Alex",
    lastLoginLocation: { city: "San Francisco" },
    attachedAt: new Date("2024-01-15T08:00:00Z"),
    workShifts: [
      generateShift(todayStr, 8, "VS_Code", "GitHub"),
      generateShift(yesterdayStr, 7.5, "VS_Code", "Slack"),
      ...generateHistory(15, "VS_Code", "Chrome")
    ]
  },
  {
    id: "e2",
    name: "Marcus Thorne",
    email: "marcus@nextgenmedia.com",
    role: "Account Executive",
    photoUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=Marcus",
    lastLoginLocation: { city: "New York" },
    attachedAt: new Date("2024-01-15T08:00:00Z"),
    workShifts: [
      generateShift(todayStr, 6, "Salesforce", "Zoom"),
      generateShift(yesterdayStr, 7, "Salesforce", "Gmail"),
      ...generateHistory(15, "Salesforce", "HubSpot")
    ]
  },
  {
    id: "e3",
    name: "Elena Rostova",
    email: "elena@nextgenmedia.com",
    role: "UX Designer",
    photoUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=Elena",
    lastLoginLocation: { city: "London" },
    attachedAt: new Date("2024-01-15T08:00:00Z"),
    workShifts: [
      generateShift(todayStr, 4, "Figma", "Slack"), // Coasting today
      generateShift(yesterdayStr, 8, "Figma", "Jira"),
      ...generateHistory(15, "Figma", "Slack")
    ]
  }
];

export const demoStats = {
  totalStaff: 3,
  activeEmployees: 3,
  totalHoursToday: "18.0",
  totalOrgHours: "1340.5",
  velocity: 92,
  topApps: [
    { name: "VS_Code", hours: 8, percentage: 44, duration: 8 * 3600 },
    { name: "Salesforce", hours: 6, percentage: 33, duration: 6 * 3600 },
    { name: "Figma", hours: 4, percentage: 22, duration: 4 * 3600 },
  ]
};

export const demoScreenshots = [
  { id: "s1", url: "https://api.dicebear.com/9.x/shapes/svg?seed=VSCode1", timestamp: new Date(), windowTitle: "VS Code - Project", appName: "VS_Code" },
  { id: "s2", url: "https://api.dicebear.com/9.x/shapes/svg?seed=VSCode2", timestamp: new Date(Date.now() - 3600000), windowTitle: "VS Code - API", appName: "VS_Code" },
  { id: "s3", url: "https://api.dicebear.com/9.x/shapes/svg?seed=Slack", timestamp: new Date(Date.now() - 7200000), windowTitle: "Slack - General", appName: "Slack" },
];

export const demoTimeEntries = [
  { id: "t1", startTime: new Date(Date.now() - 7200000), endTime: new Date(), taskName: "Frontend Development", status: "completed" },
  { id: "t2", startTime: new Date(Date.now() - 14400000), endTime: new Date(Date.now() - 7200000), taskName: "API Integration", status: "completed" },
];