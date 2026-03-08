import { faker } from '@faker-js/faker';
import { Timestamp } from 'firebase/firestore'; // Still use Timestamp for consistency
import { format, subDays, startOfDay, addSeconds, setHours, setMinutes } from 'date-fns';

/**
 * DEMO DATA GENERATOR (MODERN SCHEMA)
 * ----------------------------------
 * Generates highly randomized productivity data for a virtual employee.
 * Follows the TRAC AI v2.0 nested schema.
 * This version *does not* write to Firestore; it returns plain JS objects.
 */

const APPS = [
  { id: 'vscode', name: 'Visual Studio Code', color: '#6366f1', icon: 'https://www.google.com/s2/favicons?domain=visualstudio.com&sz=32' },
  { id: 'chrome', name: 'Google Chrome', color: '#0084ff', icon: 'https://www.google.com/s2/favicons?domain=google.com&sz=32' },
  { id: 'slack', name: 'Slack', color: '#4a154b', icon: 'https://www.google.com/s2/favicons?domain=slack.com&sz=32' },
  { id: 'figma', name: 'Figma', color: '#f24e1e', icon: 'https://www.google.com/s2/favicons?domain=figma.com&sz=32' },
  { id: 'zoom', name: 'Zoom', color: '#2d8cff', icon: 'https://www.google.com/s2/favicons?domain=zoom.us&sz=32' },
  { id: 'spotify', name: 'Spotify', color: '#1db954', icon: 'https://www.google.com/s2/favicons?domain=spotify.com&sz=32' },
  { id: 'terminal', name: 'iTerm2', color: '#000000', icon: null },
  { id: 'notion', name: 'Notion', color: '#ffffff', icon: 'https://www.google.com/s2/favicons?domain=notion.so&sz=32' },
];

const WINDOW_TITLES: Record<string, string[]> = {
  vscode: ['index.tsx - studio', 'use-team.tsx - studio', 'demo-data.ts - studio', 'package.json', 'README.md'],
  chrome: ['GitHub - Pull Requests', 'Stack Overflow - How to mock firestore', 'Next.js Documentation', 'ChatGPT', 'Linear - Sprint Planning'],
  slack: ['#engineering-team', '#product-updates', 'Direct Message: Founder', '#general'],
  figma: ['TRAC AI - Mobile App v2', 'Design System - Components', 'User Flow - Onboarding'],
  zoom: ['Weekly Sync', 'Interview: Senior Engineer', 'Product Demo'],
};

export function generateDemoEmployeesData(orgId: string, count: number = 1) {
  const employeesData = [];
  
  for (let i = 0; i < count; i++) {
    const uid = `demo_${faker.string.alphanumeric(8)}`;
    const name = faker.person.fullName();
    const employee: any = {
      id: uid,
      name,
      email: faker.internet.email(),
      role: 'Member',
      orgId,
      active: true,
      avatar: faker.image.avatar(),
      lastLoginAppVersion: '2.0.0', // Signal modern schema compatibility
      attachedAt: Timestamp.now(),
      totalSeconds: 0, // This will be calculated from shifts
      lastLoginLocation: {
        country: faker.location.country(),
        city: faker.location.city()
      },
      // Initialize sub-collections as empty arrays for now
      workShifts: [], 
      timeEntries: [],
      screenshots: {}, // Keyed by dateStr
      heartbeat: null,
    };

    let totalSecondsAllTime = 0;

    // Generate Data for the last 3 days
    for (let d = 0; d < 3; d++) {
      const date = subDays(new Date(), d);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // --- WORK SHIFT ---
      const shiftId = `${dateStr}-09-00-00`;
      
      const hourlyPulse: Record<string, any> = {};
      const liveBreakdown: Record<string, any> = {};
      let totalSecondsToday = 0;
      
      // Simulate 9 AM to 6 PM (9 hours)
      for (let h = 9; h < 18; h++) {
        const hourKey = h.toString().padStart(2, '0');
        const detailedApps: Record<string, any> = {};
        let hourSeconds = 0;
        
        // Select 2-4 random apps for this hour
        const hourApps = faker.helpers.arrayElements(APPS, { min: 2, max: 4 });
        
        hourApps.forEach(app => {
          const secs = faker.number.int({ min: 300, max: 1200 });
          const active = Math.floor(secs * faker.number.float({ min: 0.6, max: 0.95 }));
          const idle = secs - active;
          
          const appData = {
            name: app.name,
            totalSeconds: secs,
            activeSeconds: active,
            idleSeconds: idle,
            keystrokes: faker.number.int({ min: active * 0.5, max: active * 2 }),
            mouseClicks: faker.number.int({ min: active * 0.1, max: active * 0.5 }),
          };
          
          detailedApps[app.id] = appData;
          hourSeconds += secs;
          
          // Accumulate in liveBreakdown
          if (!liveBreakdown[app.name]) {
            liveBreakdown[app.name] = { totalSeconds: 0, activeSeconds: 0, idleSeconds: 0 };
          }
          liveBreakdown[app.name].totalSeconds += secs;
          liveBreakdown[app.name].activeSeconds += active;
          liveBreakdown[app.name].idleSeconds += idle;
        });

        hourlyPulse[hourKey] = {
          metrics: {
            totalSeconds: hourSeconds,
            keystrokes: faker.number.int({ min: hourSeconds, max: hourSeconds * 2 }),
            mouseClicks: faker.number.int({ min: hourSeconds * 0.2, max: hourSeconds * 0.6 }),
          },
          detailedApps
        };
        totalSecondsToday += hourSeconds;
      }

      const shiftData = {
        id: shiftId,
        startTime: Timestamp.fromDate(setHours(setMinutes(startOfDay(date), 0), 9)),
        endTime: Timestamp.fromDate(setHours(setMinutes(startOfDay(date), 0), 18)),
        status: 'finalized',
        velocity: faker.number.int({ min: 70, max: 100 }),
        hourlyPulse,
        liveBreakdown,
        liveMetrics: {
          totalSeconds: totalSecondsToday,
          activeSeconds: Math.floor(totalSecondsToday * 0.85),
          idleSeconds: Math.floor(totalSecondsToday * 0.15)
        }
      };
      
      employee.workShifts.push(shiftData);
      totalSecondsAllTime += totalSecondsToday;

      // --- TIME ENTRIES ---
      for (let j = 0; j < faker.number.int({ min: 3, max: 5 }); j++) {
        const entryId = faker.string.uuid();
        
        const startH = 9 + (j * 2);
        const entryStart = setHours(setMinutes(startOfDay(date), faker.number.int({ min: 0, max: 45 })), startH);
        const duration = faker.number.int({ min: 1800, max: 5400 });
        const entryEnd = addSeconds(entryStart, duration);
        
        const app = faker.helpers.arrayElement(APPS);
        const title = faker.helpers.arrayElement(WINDOW_TITLES[app.id] || ['Working...']);

        employee.timeEntries.push({
          id: entryId,
          startTime: Timestamp.fromDate(entryStart),
          endTime: Timestamp.fromDate(entryEnd),
          duration,
          taskName: faker.helpers.arrayElement(['Development', 'Meeting', 'Design Review', 'Documentation', 'Bug Fixing']),
          appName: app.name,
          windowName: title,
          title: title
        });
      }

      // --- SCREENSHOTS ---
      if (d === 0 || d === 1) { // Generate for current and previous day
          const screenshotsForDay: any[] = [];
          
          // Assign a random sequence (1, 2, or 3) to this employee if not already assigned
          // For demo purposes, we can just pick one based on employee ID
          const sequenceNum = (parseInt(uid.split('_')[1], 36) % 3) + 1;
          const maxFrames = (sequenceNum === 1 || sequenceNum === 2) ? 240 : 220;
          
          for (let k = 0; k < faker.number.int({ min: 12, max: 20 }); k++) {
            const screenId = faker.string.uuid();
            
            const app = faker.helpers.arrayElement(APPS);
            const title = faker.helpers.arrayElement(WINDOW_TITLES[app.id] || ['Working...']);
            
            // Pick a random frame from the assigned sequence
            const frameNum = faker.number.int({ min: 1, max: maxFrames }).toString().padStart(3, '0');
            const localUrl = `/sequence_${sequenceNum}/ezgif-frame-${frameNum}.jpg`;
            
            screenshotsForDay.push({
              id: screenId,
              url: localUrl,
              imageUrl: localUrl, // Alias for backward compatibility
              timestamp: Timestamp.fromDate(addSeconds(setHours(startOfDay(date), 9), k * 1800)), // Every ~30 mins
              appName: app.name,
              windowTitle: title,
              productivityScore: faker.number.int({ min: 60, max: 100 })
            });
          }
          employee.screenshots[dateStr] = screenshotsForDay;
      }
    }

    // 3. Heartbeat (Live)
    const randomApp = faker.helpers.arrayElement(APPS);
    employee.heartbeat = {
      isCurrentlyRunning: true,
      lastHeartbeat: Timestamp.now(),
      currentApp: randomApp.name,
      currentTitle: faker.helpers.arrayElement(WINDOW_TITLES[randomApp.id] || ['Active Session']),
      startTime: Timestamp.fromDate(subDays(new Date(), 0))
    };

    employee.totalSeconds = totalSecondsAllTime;
    employeesData.push(employee);
  }

  return employeesData;
}
