import { faker } from "@faker-js/faker";
import { format, subMinutes, subDays } from "date-fns";

export interface DummyEmployee {
  id: string;
  name: string;
  email: string;
  role: string;
  photoUrl: string;
  orgId: string;
  active: boolean;
  attachedAt: any;
  lastLoginAppVersion: string;
  workShifts: any[];
  heartbeat: any;
  totalSeconds: number;
}

const ROLES = ["Engineer", "Designer", "Support", "Marketing", "Manager"];
const APPS = [
  "VS Code",
  "Google Chrome",
  "Slack",
  "Postman",
  "Figma",
  "Terminal",
];

export function generateDummyData(orgId: string, count: number = 6) {
  const employees: Record<string, DummyEmployee> = {};
  const today = new Date();

  for (let i = 0; i < count; i++) {
    const id = `dummy_${faker.string.uuid()}`;
    const name = faker.person.fullName();
    const role = faker.helpers.arrayElement(ROLES);
    const totalSecondsToday = faker.number.int({ min: 14400, max: 28800 }); // 4-8 hours

    // Generate mock breakdown for today
    const liveBreakdown: Record<string, any> = {};
    let remainingSecs = totalSecondsToday;
    const shuffledApps = faker.helpers.shuffle([...APPS]);

    shuffledApps.forEach((app, idx) => {
      const secs =
        idx === shuffledApps.length - 1
          ? remainingSecs
          : faker.number.int({ min: 0, max: remainingSecs });
      liveBreakdown[app.replace(/ /g, "_")] = {
        totalSeconds: secs,
        details: {
          [faker.lorem.words(3)]: secs,
        },
      };
      remainingSecs -= secs;
    });

    // Generate shifts for all workdays of current month up to today
    const workShifts: any[] = [];
    const startOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const dayCount = today.getDate();

    for (let day = 1; day <= dayCount; day++) {
      const shiftDate = new Date(today.getFullYear(), today.getMonth(), day);
      const isWeekend = shiftDate.getDay() === 0 || shiftDate.getDay() === 6;
      if (isWeekend) continue;

      const dateStr = format(shiftDate, "yyyy-MM-dd");
      const isTodayShift = day === dayCount;
      const secsThisDay = isTodayShift ? totalSecondsToday : faker.number.int({ min: 21600, max: 28800 });
      const activeSecs = Math.round(secsThisDay * 0.85);
      const idleSecs = Math.round(secsThisDay * 0.10);
      const breakSecs = secsThisDay - activeSecs - idleSecs;

      const startTime = new Date(shiftDate);
      startTime.setHours(9, 0, 0, 0);

      const endTime = new Date(shiftDate);
      endTime.setHours(17, 0, 0, 0);

      workShifts.push({
        id: `${dateStr}_${id}`,
        startTime: startTime,
        endTime: isTodayShift ? undefined : endTime,
        status: isTodayShift ? "active" : "completed",
        liveMetrics: {
          totalSeconds: secsThisDay,
          activeSeconds: activeSecs,
          idleSeconds: idleSecs,
          breakSeconds: breakSecs,
          keystrokes: secsThisDay * faker.number.float({ min: 0.5, max: 2 }),
          mouseClicks: secsThisDay * faker.number.float({ min: 0.1, max: 0.5 }),
          mouseDistance: secsThisDay * faker.number.float({ min: 1, max: 5 }),
          mouseScrolls: secsThisDay * faker.number.float({ min: 0.5, max: 3 }),
        },
        liveBreakdown: isTodayShift ? liveBreakdown : createMockBreakdown(secsThisDay),
        hourlyPulse: generateHourlyPulse(secsThisDay, startTime),
      });
    }

    employees[id] = {
      id,
      name,
      email: faker.internet.email(),
      role,
      photoUrl: `https://api.dicebear.com/9.x/avataaars/svg?seed=${name}`,
      orgId,
      active: true,
      attachedAt: { toDate: () => subDays(today, 30) },
      lastLoginAppVersion: "2.1.0",
      workShifts,
      heartbeat: {
        lastPulse: new Date(),
        status: "online",
        currentApp: faker.helpers.arrayElement(APPS),
      },
      totalSeconds: totalSecondsToday,
    };
  }

  return employees;
}

function createMockBreakdown(totalSecs: number) {
  const breakdown: Record<string, any> = {};
  let remaining = totalSecs;
  APPS.forEach((app, idx) => {
    const secs = idx === APPS.length - 1 ? remaining : Math.round(remaining * 0.3);
    breakdown[app.replace(/ /g, "_")] = { totalSeconds: secs };
    remaining -= secs;
  });
  return breakdown;
}

function generateHourlyPulse(totalSeconds: number, startTime: Date = new Date()) {
  const pulse: Record<string, any> = {};
  const startHour = startTime.getHours();
  const hoursWorked = Math.min(Math.ceil(totalSeconds / 3600), 8);

  for (let i = 0; i < hoursWorked; i++) {
    const hour = (startHour + i) % 24;
    const hourStr = hour.toString().padStart(2, "0");
    const hourSecs = i === hoursWorked - 1 ? (totalSeconds % 3600 || 3600) : 3600;
    const activeSecs = Math.round(hourSecs * 0.85);

    pulse[hourStr] = {
      metrics: {
        totalSeconds: hourSecs,
        seconds: hourSecs,
        activeSeconds: activeSecs,
        keystrokes: faker.number.int({ min: 500, max: 2000 }),
        mouseClicks: faker.number.int({ min: 100, max: 500 }),
        mouseDistance: faker.number.int({ min: 1000, max: 5000 }),
        mouseScrolls: faker.number.int({ min: 500, max: 3000 }),
      },
      detailedApps: {
        "VS_Code": {
          name: "VS Code",
          totalSeconds: Math.round(activeSecs * 0.5),
          activeSeconds: Math.round(activeSecs * 0.5),
          keystrokes: faker.number.int({ min: 300, max: 1200 }),
          mouseClicks: faker.number.int({ min: 50, max: 200 }),
        },
        "Google_Chrome": {
          name: "Google Chrome",
          totalSeconds: Math.round(activeSecs * 0.3),
          activeSeconds: Math.round(activeSecs * 0.3),
          keystrokes: faker.number.int({ min: 100, max: 500 }),
          mouseClicks: faker.number.int({ min: 30, max: 150 }),
        },
        "Slack": {
          name: "Slack",
          totalSeconds: Math.round(activeSecs * 0.2),
          activeSeconds: Math.round(activeSecs * 0.2),
          keystrokes: faker.number.int({ min: 50, max: 300 }),
          mouseClicks: faker.number.int({ min: 20, max: 100 }),
        }
      }
    };
  }
  return pulse;
}

const DUMMY_SCREENSHOT_IMAGES = [
  { url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80", title: "VS Code — main.tsx", owner: "VS Code" },
  { url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80", title: "Analytics Dashboard — Chrome", owner: "Google Chrome" },
  { url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80", title: "Figma — Design System", owner: "Figma" },
  { url: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=80", title: "Slack — #general", owner: "Slack" },
  { url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80", title: "Terminal — zsh", owner: "Terminal" },
  { url: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80", title: "Postman — API Testing", owner: "Postman" }
];

export function generateDummyScreenshots(selectedDate: Date = new Date()) {
  const baseDate = new Date(selectedDate);
  baseDate.setHours(9, 0, 0, 0);

  return DUMMY_SCREENSHOT_IMAGES.map((item, idx) => {
    const timestamp = new Date(baseDate.getTime() + idx * 45 * 60 * 1000);
    return {
      id: `dummy_shot_${idx}_${selectedDate.getTime()}`,
      url: item.url,
      redactedUrl: item.url,
      imageUrl: item.url,
      timestamp: timestamp,
      timestampLocal: format(timestamp, "M/d/yyyy, h:mm:ss a"),
      windowTitle: item.title,
      activeWindow: {
        owner: item.owner,
        title: item.title
      },
      keystrokes: 450 + idx * 30,
      mouseClicks: 120 + idx * 15,
      mouseDistance: 2500 + idx * 200,
      mouseScrolls: 180 + idx * 10,
      mode: "window",
      isBlurred: false
    };
  });
}

export function generateDummyTimeEntries(selectedDate: Date = new Date(), screenshots: any[] = []) {
  const baseDate = new Date(selectedDate);
  
  const entry1Start = new Date(baseDate);
  entry1Start.setHours(9, 0, 0, 0);
  const entry1End = new Date(baseDate);
  entry1End.setHours(12, 30, 0, 0);

  const entry2Start = new Date(baseDate);
  entry2Start.setHours(13, 30, 0, 0);
  const entry2End = new Date(baseDate);
  entry2End.setHours(17, 0, 0, 0);

  return [
    {
      id: `dummy_entry_1_${selectedDate.getTime()}`,
      startTime: entry1Start,
      endTime: entry1End,
      duration: 12600,
      projectName: "Core App Development",
      description: "Implemented new feature modules, optimized state management, and refactored UI components.",
      images: screenshots.slice(0, 3)
    },
    {
      id: `dummy_entry_2_${selectedDate.getTime()}`,
      startTime: entry2Start,
      endTime: entry2End,
      duration: 12600,
      projectName: "API Integration & Testing",
      description: "Designed endpoints, performed load testing, and reviewed pull requests.",
      images: screenshots.slice(3, 6)
    }
  ];
}
