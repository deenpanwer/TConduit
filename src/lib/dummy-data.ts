import { faker } from "@faker-js/faker";
import { format, subMinutes } from "date-fns";

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
  const dateStr = format(new Date(), "yyyy-MM-dd");

  for (let i = 0; i < count; i++) {
    const id = `dummy_${faker.string.uuid()}`;
    const name = faker.person.fullName();
    const role = faker.helpers.arrayElement(ROLES);
    const totalSecondsToday = faker.number.int({ min: 14400, max: 28800 }); // 4-8 hours

    // Generate mock breakdown
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

    const workShifts = [
      {
        id: `${dateStr}_${id}`,
        startTime: subMinutes(new Date(), totalSecondsToday / 60),
        status: "active",
        liveMetrics: {
          totalSeconds: totalSecondsToday,
          keystrokes:
            totalSecondsToday * faker.number.float({ min: 0.5, max: 2 }),
          mouseClicks:
            totalSecondsToday * faker.number.float({ min: 0.1, max: 0.5 }),
          mouseDistance:
            totalSecondsToday * faker.number.float({ min: 1, max: 5 }),
        },
        liveBreakdown,
        hourlyPulse: generateHourlyPulse(totalSecondsToday),
      },
    ];

    employees[id] = {
      id,
      name,
      email: faker.internet.email(),
      role,
      photoUrl: `https://api.dicebear.com/9.x/avataaars/svg?seed=${name}`,
      orgId,
      active: true,
      attachedAt: { toDate: () => subMinutes(new Date(), 10000) },
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

function generateHourlyPulse(totalSeconds: number) {
  const pulse: Record<string, any> = {};
  const currentHour = new Date().getHours();
  const hoursWorked = Math.ceil(totalSeconds / 3600);

  for (let i = 0; i < hoursWorked; i++) {
    const hour = (currentHour - i + 24) % 24;
    const hourStr = hour.toString().padStart(2, "0");
    pulse[hourStr] = {
      metrics: {
        totalSeconds: faker.number.int({ min: 1800, max: 3600 }),
        keystrokes: faker.number.int({ min: 500, max: 2000 }),
        mouseClicks: faker.number.int({ min: 100, max: 500 }),
      },
    };
  }
  return pulse;
}
