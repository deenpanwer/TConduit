import { startOfDay, subDays, subMinutes, subHours, format } from "date-fns";
import { faker } from '@faker-js/faker';

// --- TYPES & HELPERS ---

const createTimestamp = (date: Date) => ({
  seconds: Math.floor(date.getTime() / 1000),
  nanoseconds: 0,
  toDate: () => date
});

// Helper for realistic random ranges
const randomRange = (min: number, max: number) => faker.number.int({ min, max });

// --- GENERATORS ---

const generateWorkShifts = (userId: string) => {
  const shifts = [];
  const now = new Date();

  // Define shift configurations for early and late shifts
  // Adjusted durations for more realistic aggregation as per user's example
  const shiftConfigs = [
    {
      startHour: 1, endHour: 4, idSuffix: "_0",
      minExpectedDurationSeconds: 2 * 3600, // 2 hours
      maxExpectedDurationSeconds: 3 * 3600, // 3 hours
      aiBrief: "Morning session analysis: Performance is exceptional, with minimal idle time recorded. Balanced task management observed, successfully utilizing chrome alongside secondary tools. Steady activity levels recorded. Output remains consistent."
    },
    {
      startHour: 16, endHour: 23, idSuffix: "_1",
      minExpectedDurationSeconds: 6 * 3600, // 6 hours
      maxExpectedDurationSeconds: 7 * 3600, // 7 hours
      aiBrief: "Evening wrap-up summary: Output is currently below baseline; monitoring for rhythm adjustment. High-intensity deep work detected. 93% of the session was dedicated exclusively to chrome. Low input velocity detected; likely a period of research or planning."
    },
  ];

  for (let i = 0; i < 5; i++) { // Generate shifts for 5 days
    const date = subDays(now, i);
    const dateStr = format(date, "yyyy-MM-dd");

    for (const config of shiftConfigs) { // Generate two shifts per day
      const shiftId = `${dateStr}${config.idSuffix}`;

      const isToday = i === 0;

      const startTime = new Date(date);
      startTime.setHours(config.startHour, 0, 0, 0);

      const endTime = new Date(date);
      // Handle potential overnight shifts if endHour is less than startHour, though not in current config
      if (config.endHour < config.startHour) {
        endTime.setDate(endTime.getDate() + 1);
      }
      endTime.setHours(config.endHour, 0, 0, 0);

      // Determine the actual duration for this specific shift
      let totalSecondsForShift: number;
      let shiftStatus: "active" | "completed" = "completed";
      let shiftEndTime: string | null = endTime.toISOString();


      if (isToday) {
        const nowMs = now.getTime();
        const startMs = startTime.getTime();
        const endMs = endTime.getTime();

        if (nowMs < startMs) { // Shift is in the future
          totalSecondsForShift = 0;
          shiftStatus = "completed"; // Or "scheduled" if we had that status
        } else if (nowMs >= startMs && nowMs < endMs) { // Shift is currently active
          totalSecondsForShift = Math.floor((nowMs - startMs) / 1000);
          shiftStatus = "active";
          shiftEndTime = null; // End time is null for active shifts
        } else { // Shift already completed today
          totalSecondsForShift = randomRange(config.minExpectedDurationSeconds, config.maxExpectedDurationSeconds);
          shiftStatus = "completed";
        }
      } else { // Past day, shift is completed for its expected duration
        totalSecondsForShift = randomRange(config.minExpectedDurationSeconds, config.maxExpectedDurationSeconds);
        shiftStatus = "completed";
      }

      // Ensure totalSecondsForShift is non-negative and within bounds
      totalSecondsForShift = Math.max(0, totalSecondsForShift);
      totalSecondsForShift = Math.min(totalSecondsForShift, config.maxExpectedDurationSeconds);


      const idleSeconds = Math.floor(totalSecondsForShift * (0.05 + Math.random() * 0.1));
      const activeSeconds = totalSecondsForShift - idleSeconds;

      const hourlyPulse: { [key: string]: { seconds: number; keystrokes: number; mouseClicks: number; mouseDistance: number; screenshotCount: number; appSwitches: number; } } = {};
      
      let actualActiveHours = 0;
      // Calculate actual hours between startHour and endHour (exclusive of endHour for simple case)
      if (config.endHour > config.startHour) {
          actualActiveHours = config.endHour - config.startHour;
      } else { // Overnight shift
          actualActiveHours = (24 - config.startHour) + config.endHour;
      }
      
      if (actualActiveHours === 0) actualActiveHours = 1; // Prevent division by zero if shift is less than an hour


      let remainingSecondsToDistribute = totalSecondsForShift;
      let distributedSeconds = 0;

      const hoursInShift = [];
      if (config.endHour > config.startHour) {
          for (let h = config.startHour; h < config.endHour; h++) hoursInShift.push(h);
      } else {
          for (let h = config.startHour; h < 24; h++) hoursInShift.push(h);
          for (let h = 0; h < config.endHour; h++) hoursInShift.push(h);
      }

      for (const h of hoursInShift) {
        const hourKey = h.toString().padStart(2, '0');
        let secondsInThisHour = Math.min(remainingSecondsToDistribute, Math.floor(totalSecondsForShift / actualActiveHours) + randomRange(-300, 300));
        secondsInThisHour = Math.max(0, secondsInThisHour); // Ensure non-negative
        
        if (isToday && h === now.getHours() && shiftStatus === "active") {
            const currentHourStartMs = new Date(date).setHours(h, 0, 0, 0);
            const elapsedSecondsInCurrentHour = Math.floor((now.getTime() - currentHourStartMs) / 1000);
            secondsInThisHour = Math.min(secondsInThisHour, elapsedSecondsInCurrentHour);
        } else if (isToday && h > now.getHours() && shiftStatus === "active") {
            secondsInThisHour = 0; // Future hours for an active shift
        }

        hourlyPulse[hourKey] = {
            seconds: Math.floor(secondsInThisHour),
            keystrokes: Math.floor(secondsInThisHour / 60 * randomRange(50, 200)), // Scale activity per minute
            mouseClicks: Math.floor(secondsInThisHour / 60 * randomRange(10, 50)),
            mouseDistance: Math.floor(secondsInThisHour / 60 * randomRange(500, 2000)),
            screenshotCount: Math.floor(secondsInThisHour / 300), // 1 every 5 mins
            appSwitches: Math.floor(secondsInThisHour / 3600 * randomRange(5, 15)) // Switched per hour
        };
        remainingSecondsToDistribute -= secondsInThisHour;
        distributedSeconds += secondsInThisHour;
      }
      // Distribute any remaining seconds (due to random factors) to the last hour or proportionally
      if (remainingSecondsToDistribute > 0 && hoursInShift.length > 0) {
        const lastHourKey = hoursInShift[hoursInShift.length - 1].toString().padStart(2, '0');
        if (hourlyPulse[lastHourKey]) {
            hourlyPulse[lastHourKey].seconds += Math.floor(remainingSecondsToDistribute);
        }
      }

      // Sum up hourlyPulse to get accurate liveMetrics
      let totalHourlyKeystrokes = 0;
      let totalHourlyMouseClicks = 0;
      let totalHourlyMouseDistance = 0;
      let totalHourlyScreenshotCount = 0;
      let totalHourlyAppSwitches = 0;
      let totalHourlySecondsAggregated = 0;

      for (const hourKey in hourlyPulse) {
          const hourData = hourlyPulse[hourKey];
          totalHourlySecondsAggregated += hourData.seconds;
          totalHourlyKeystrokes += hourData.keystrokes;
          totalHourlyMouseClicks += hourData.mouseClicks;
          totalHourlyMouseDistance += hourData.mouseDistance;
          totalHourlyScreenshotCount += hourData.screenshotCount;
          totalHourlyAppSwitches += hourData.appSwitches;
      }


      const liveMetrics = {
          totalSeconds: totalHourlySecondsAggregated,
          activeSeconds: Math.floor(totalHourlySecondsAggregated * (activeSeconds / totalSecondsForShift)), // Scale active based on ratio
          idleSeconds: Math.floor(totalHourlySecondsAggregated * (idleSeconds / totalSecondsForShift)), // Scale idle based on ratio
          keystrokes: totalHourlyKeystrokes,
          mouseClicks: totalHourlyMouseClicks,
          mouseDistance: totalHourlyMouseDistance,
          screenshotCount: totalHourlyScreenshotCount,
          appSwitches: totalHourlyAppSwitches
      };

      const shift = {
        id: shiftId,
        startTime: startTime.toISOString(),
        endTime: shiftEndTime,
        status: shiftStatus,
        baselineSeconds: 28800, // As per user's example, this remains 8 hours nominal
        liveMetrics,
        liveBreakdown: { // Random distribution for demo purposes, can be refined later
          "Visual_Studio_Code": Math.floor(liveMetrics.activeSeconds * (0.65 + Math.random() * 0.1)),
          "Google_Chrome": Math.floor(liveMetrics.activeSeconds * (0.20 + Math.random() * 0.05)),
          "Slack": Math.floor(liveMetrics.activeSeconds * (0.10 + Math.random() * 0.02)),
          "Terminal": Math.floor(liveMetrics.activeSeconds * (0.05 + Math.random() * 0.01))
        },
        hourlyPulse,
        cognitiveReport: {
          productivityScore: randomRange(50, 99),
          focusScore: randomRange(50, 99),
          velocity: randomRange(10, 70),
          aiBrief: config.aiBrief,
        },
        updatedAt: new Date().toISOString()
      };
      shifts.push(shift);
    }
  }
  return shifts;
};

const generateScreenshotsForEntry = (userId: string, entry: any, appName: string, windowTitle: string) => {
  const startTime = entry.startTime.toDate();
  const durationMins = Math.floor(entry.duration / 60);
  const screenshotCount = 20; // Generate exactly 20 screenshots per entry as requested
  
  return Array.from({ length: screenshotCount }, (_, i) => {
    // Distribute screenshots throughout the duration
    const timestamp = subMinutes(entry.endTime.toDate(), (screenshotCount - 1 - i) * Math.max(1, Math.floor(durationMins / screenshotCount)));
    
    // 20% chance of being idle
    const isIdle = Math.random() < 0.2;

    return {
      id: `scr_${userId}_${entry.id}_${i}`,
      timestamp: createTimestamp(timestamp),
      activity: {
        activeWindow: {
          owner: appName,
          title: windowTitle
        },
        keystrokes: isIdle ? 0 : randomRange(30, 150),
        mouseClicks: isIdle ? 0 : randomRange(5, 40),
        mouseDistance: isIdle ? 0 : randomRange(1000, 12000),
        base64: null,
        cloudinaryUrl: `https://images.unsplash.com/photo-${[
          '1461749280684-dccba630e2f6', // code
          '1498050108023-c5249f4df085', // workspace
          '1555066931-4365d14bab8c', // programming
          '1581291518633-83b4ebd1d83e', // app UI
          '1542831371-29b0f74f9713', // coding
          '1550439062-609e1531270e'  // tech
        ][randomRange(0, 5)]}?auto=format&fit=crop&w=800&q=80`,
        createdAt: timestamp.toISOString(),
        date: timestamp.toISOString().split('T')[0],
        id: `scr_${userId}_${entry.id}_${i}`,
        mode: "window",
        projectId: entry.projectId,
        timestamp: createTimestamp(timestamp)
      },
      url: `https://images.unsplash.com/photo-${[
        '1461749280684-dccba630e2f6',
        '1498050108023-c5249f4df085',
        '1555066931-4365d14bab8c',
        '1581291518633-83b4ebd1d83e',
        '1542831371-29b0f74f9713',
        '1550439062-609e1531270e'
      ][randomRange(0, 5)]}?auto=format&fit=crop&w=800&q=80`
    };
  });
};

const generateProjects = () => {
  const projTemplates = [
    { name: "chrome", color: "#3b82f6", app: "Google Chrome", title: "Trac AI Dashboard - Development" },
    { name: "figma", color: "#a855f7", app: "Figma", title: "Design System - Core Components" },
    { name: "vscode", color: "#10b981", app: "Visual Studio Code", title: "index.tsx - platform-core" },
    { name: "slack", color: "#f59e0b", app: "Slack", title: "Direct Message - Engineering" },
    { name: "notion", color: "#000000", app: "Notion", title: "Q1 Roadmap & Planning" },
    { name: "github", color: "#24292f", app: "Arc Browser", title: "Pull Request #442 - Trac AI" }
  ];

  return projTemplates
    .sort(() => 0.5 - Math.random())
    .slice(0, randomRange(3, 5))
    .map(p => ({
      id: `proj_${faker.string.alphanumeric(9)}`,
      name: p.name,
      color: p.color,
      totalTime: randomRange(10000, 50000),
      isRunning: false,
      createdAt: createTimestamp(subDays(new Date(), 10)),
      updatedAt: createTimestamp(new Date()),
      description: `Auto-tracked project for ${p.name}`,
      appName: p.app,
      windowTitle: p.title,
      defaultSource: {
        id: `win_${faker.string.alphanumeric(5)}`,
        name: p.app,
        type: "window",
        icon: ""
      }
    }));
};

const generateTimeEntries = (userId: string, projects: any[]) => {
  const now = new Date();
  return projects.map((p, i) => ({
    id: `entry_${userId}_${i}`,
    duration: randomRange(1800, 7200),
    projectName: p.name,
    projectId: p.id,
    startTime: createTimestamp(subHours(now, i + 1)),
    endTime: createTimestamp(subHours(now, i)),
    createdAt: createTimestamp(subHours(now, i)),
    userId: userId,
    description: `Working on ${p.name} tasks`,
    appName: p.appName,
    windowTitle: p.windowTitle
  }));
};

// --- ABSTRACTION ENGINE ---

const calculateAbstractions = (emp: any) => {
  const logs = emp.screenshots || [];
  const entries = emp.timeEntries || [];
  
  const totalSecondsClocked = entries.reduce((acc: number, curr: any) => acc + (curr.duration || 0), 0);
  const idleLogs = logs.filter((l: any) => 
    l.activity.keystrokes === 0 && 
    l.activity.mouseClicks === 0 && 
    l.activity.mouseDistance === 0
  );
  
  const idleRatio = logs.length > 0 ? idleLogs.length / logs.length : 0;
  const idleSeconds = totalSecondsClocked * idleRatio;
  const activeSeconds = totalSecondsClocked - idleSeconds;

  let switches = 0;
  for(let i=1; i<logs.length; i++) {
    if(logs[i].activity.activeWindow.owner !== logs[i-1].activity.activeWindow.owner) switches++;
  }

  const meanKeystrokes = logs.length > 0 
    ? logs.reduce((a: any, b: any) => a + b.activity.keystrokes, 0) / logs.length 
    : 0;

  return {
    ...emp,
    interactionDNA: logs.map((l: any) => ({ 
      keys: l.activity.keystrokes, 
      mouse: Math.round(l.activity.mouseDistance/100) 
    })),
    chronicle: logs.reduce((acc: any[], l: any) => {
      const title = l.activity.activeWindow.title;
      if (acc.length > 0 && acc[acc.length-1].title === title) acc[acc.length-1].duration += 1;
      else acc.push({ title, duration: 1, app: l.activity.activeWindow.owner, time: l.activity.createdAt });
      return acc;
    }, []),
    intensity: (meanKeystrokes / 80).toFixed(2),
    contextSwitches: switches,
    productivityScore: ((1 - idleRatio) * 100).toFixed(0),
    totalHoursClocked: (totalSecondsClocked / 3600).toFixed(1),
    activeHours: (activeSeconds / 3600).toFixed(1),
    idleHours: (idleSeconds / 3600).toFixed(1),
    idleRatio: (idleRatio * 100).toFixed(0),
    monthYield: randomRange(140, 180),
    focusRatio: randomRange(75, 95),
    stabilityScore: randomRange(80, 98)
  };
};

// --- THE FACTORY ---

export const createDemoUser = (name?: string, role?: string, avatar?: string, forceId?: string) => {
  const userId = forceId || `demo_${faker.string.alphanumeric(9)}`;
  
  // Seed faker with the userId so results are deterministic for this specific ID
  const seed = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  faker.seed(seed);

  const firstName = name ? name.split(' ')[0] : faker.person.firstName();
  const lastName = name ? name.split(' ')[1] || '' : faker.person.lastName();
  const fullName = name || `${firstName} ${lastName}`;
  
  const projects = generateProjects();
  const timeEntries = generateTimeEntries(userId, projects);
  const activeProject = projects[0];

  const aiSummaries = [
    `${fullName} is exhibiting high cognitive output in ${activeProject.appName}. Focus remains steady with minimal context switching detected in the last 20 minutes.`,
    `Execution velocity for ${fullName} is currently peaking. Deep work session in ${activeProject.name} is yielding high-density results.`,
    `Neural telemetry for ${fullName} shows a consistent rhythm. Project milestones are being addressed with standard efficiency in ${activeProject.appName}.`,
    `${fullName} has entered a state of hyper-focus. Interaction density in ${activeProject.windowTitle} suggests complex problem-solving in progress.`,
    `Deep analytical session detected for ${fullName}. Current activity in ${activeProject.appName} aligns with high-priority sprint objectives.`,
    `${fullName} is maintaining a balanced output. System audit indicates optimized task management within ${activeProject.windowTitle}.`,
    `Velocity spike detected for ${fullName} at ${activeProject.appName}. Rapid execution indicates a breakthrough phase in the current workflow.`
  ];
  
  const rawUser = {
    id: userId,
    name: fullName,
    email: faker.internet.email({ firstName, lastName, provider: 'trac.ai' }),
    role: role || faker.helpers.arrayElement(['Senior Engineer', 'UI Designer', 'Product Manager', 'Architect']),
    photoUrl: avatar || faker.image.avatar(),
    aiSummary: faker.helpers.arrayElement(aiSummaries),
    orgId: "org_3yv2n5xol",
    orgStatus: "active",
    createdAt: createTimestamp(subDays(new Date(), 30)),
    attachedAt: createTimestamp(subDays(new Date(), 5)),
    updatedAt: createTimestamp(new Date()),
    lastLoginTime: createTimestamp(subHours(new Date(), 1)),
    lastLoginAppVersion: "1.0.6",
    lastLoginIpAddress: faker.internet.ip(),
    lastLoginOs: faker.helpers.arrayElement([
        "Windows_NT 10.0.19045 (x64)",
        "Darwin 23.2.0 (arm64)",
        "Linux 6.5.0-21-generic (x86_64)"
    ]),
    lastLoginLocation: { 
        city: faker.location.city(), 
        country: faker.location.country(), 
        latitude: faker.location.latitude(), 
        longitude: faker.location.longitude(), 
        region: faker.location.state()
    },
    workShifts: generateWorkShifts(userId),
    projects: projects,
    timeEntries: timeEntries,
    screenshots: timeEntries.flatMap(entry => generateScreenshotsForEntry(userId, entry, entry.appName, entry.windowTitle))
  };

  // The heartbeat is conceptually a separate document: /users/{userId}/live/heartbeat
  const isRunning = Math.random() > 0.3; // 70% chance of being active
  const heartbeat = {
      isCurrentlyRunning: isRunning,
      lastActiveWindow: isRunning ? activeProject.windowTitle : "None (Idle)",
      currentLatency: isRunning ? randomRange(20, 400) : 0,
      updatedAt: createTimestamp(new Date())
  };

  return {
    ...calculateAbstractions(rawUser),
    heartbeat // We keep it in the returned object for the UI to consume, but it's now logically distinct
  };
};

// --- INITIAL DUMMY EXPORTS ---

export const DUMMY_EMPLOYEES = [
  createDemoUser("Deen Panwer", "Lead Architect", "https://lh3.googleusercontent.com/a/ACg8ocLZLwJYLJDy3PkVyYfhub8bjEtWIkv8bGuIVaAlBhmNS5aOfw=s96-c", "demo_deen"),
  createDemoUser("Sarah Chen", "Senior Designer", undefined, "demo_sarah"),
  createDemoUser(undefined, undefined, undefined, "demo_node_1"),
  createDemoUser(undefined, undefined, undefined, "demo_node_2")
];

export const getDemoUserById = (id: string) => {
  const existing = DUMMY_EMPLOYEES.find(e => e.id === id);
  if (existing) return existing;
  return createDemoUser(undefined, undefined, undefined, id);
};

export const DUMMY_STATS = {
  totalHoursToday: "28.4",
  velocity: 96,
  topApps: [
    { name: "Chrome", hours: 12.4, percentage: 44 }, 
    { name: "VS Code", hours: 8.2, percentage: 29 },
    { name: "Figma", hours: 7.8, percentage: 27 }
  ],
  activeEmployees: 4, totalStaff: 4, locationsCount: 3
};

export const DUMMY_ORG = {
  createdAt: createTimestamp(new Date(2026, 0, 28, 21, 58, 57)),
  inviteCode: "934445",
  name: "deens org",
  ownerId: "sq45K5QAnwbRZV7KZa2R9cqesEW2",
  orgName: "deens org",
  industry: "Technology",
  role: "Founder",
  logoUrl: null // Placeholder for base64 or URL
};

export const DUMMY_ORG_BRIEF = {
  peakState: "Organization velocity is currently peaking at high-impact benchmarks. Deep work clusters are concentrated in core development and research projects.",
  optimalState: "Steady operational momentum detected. Staff members are maintaining consistent throughput with balanced context-switching ratios.",
  standardState: "Standard operational flow. System audit indicates normal activity levels across all registered team members with minor pending milestones.",
  milestoneNote: "Primary milestones remain on a healthy delivery trajectory with a 4-day early completion projection."
};

export const DUMMY_OWNER = {
  uid: "sq45K5QAnwbRZV7KZa2R9cqesEW2",
  email: "deenkhan94.dk@gmail.com",
  name: "Deen Khan",
  role: "Founder",
  orgId: "org_3yv2n5xol",
  orgName: "deens org",
  ownedOrgId: "org_3yv2n5xol",
  onboardingCompleted: true,
  photoUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=Deen",
  createdAt: createTimestamp(subDays(new Date(), 5)),
  updatedAt: createTimestamp(new Date()),
  heartbeat: {
    lastActiveWindow: "Google Chrome",
    isCurrentlyRunning: true,
    currentLatency: 38,
    updatedAt: createTimestamp(new Date())
  },
  lastLoginLocation: {
    city: "Karachi",
    country: "Pakistan",
    latitude: 24.8591,
    longitude: 66.9983,
    region: "Sindh"
  }
};