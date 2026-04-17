"use client";

import { faker } from "@faker-js/faker";
import { storage } from "./storage";

// Collections
const COLLECTIONS = {
  USERS: "users",
  TASKS: "tasks",
  CRM_ENTITIES: "crm_entities",
  POS_PRODUCTS: "pos_products",
  POS_ORDERS: "pos_orders",
  SHIFTS: "shifts",
  CALENDAR_EVENTS: "calendar_events",
  ORGANIZATIONS: "organizations",
  SCREENSHOTS: "screenshots",
  TIME_ENTRIES: "time_entries",
  INVOICES: "invoices",
  NOTES: "notes",
  CALL_LOGS: "call_logs",
};

/**
 * seedMockData: Generates high-fidelity dummy data for all modules.
 * Anchored around 2026-04-16 to match user context.
 */
export function seedMockData(force = false, counts = { users: 15, tasks: 40, crm: 30, pos: 25, shifts: 100, invoices: 20, notes: 50, callLogs: 30 }) {
  if (typeof window === "undefined") return;

  // Only seed if empty or forced
  if (!force && storage.getCollection(COLLECTIONS.USERS).length > 0) return;

  console.log("Seeding high-fidelity mock data anchored to April 2026...");

  const mainOrgId = 'mock-org-123';
  const mockTodayDateStr = "2026-04-16";
  
  // Future date to prevent heartbeat from going stale in mock environment
  const futureHeartbeat = new Date('2026-12-31T23:59:59Z').toISOString();
  const pastDate = new Date('2026-01-01T00:00:00Z').toISOString();

  // 1. Organizations
  const orgs = [
    {
        id: mainOrgId,
        name: "TConduit Industries",
        industry: "Technology & Infrastructure",
        logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/J._Robert_Oppenheimer_at_the_Guest_Lodge%2C_Oak_Ridge%2C_in_1946_4.jpg/250px-J._Robert_Oppenheimer_at_the_Guest_Lodge%2C_Oak_Ridge%2C_in_1946_4.jpg",
        orgName: "TConduit Industries",
        subscriptionExpiry: new Date('2027-04-16').toISOString(),
    }
  ];
  storage.saveCollection(COLLECTIONS.ORGANIZATIONS, orgs);

  // 2. Users (Employees)
  const users = Array.from({ length: counts.users }).map((_, index) => {
    const id = index === 0 ? 'mock-owner-uid' : faker.string.uuid();
    const isOnline = index < 7; // Keep 7 online as requested/observed
    
    return {
      id,
      name: index === 0 ? "Project Owner" : faker.person.fullName(),
      email: index === 0 ? "deen@gmail.com" : faker.internet.email(),
      role: index === 0 ? "owner" : faker.helpers.arrayElement(["manager", "employee"]),
      avatar: index === 0 ? "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/J._Robert_Oppenheimer_at_the_Guest_Lodge%2C_Oak_Ridge%2C_in_1946_4.jpg/250px-J._Robert_Oppenheimer_at_the_Guest_Lodge%2C_Oak_Ridge%2C_in_1946_4.jpg" : faker.image.avatar(),
      photoUrl: index === 0 ? "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/J._Robert_Oppenheimer_at_the_Guest_Lodge%2C_Oak_Ridge%2C_in_1946_4.jpg/250px-J._Robert_Oppenheimer_at_the_Guest_Lodge%2C_Oak_Ridge%2C_in_1946_4.jpg" : faker.image.avatar(),
      status: isOnline ? "online" : "offline",
      orgId: mainOrgId,
      ownedOrgId: index === 0 ? mainOrgId : null,
      lastActive: futureHeartbeat,
      heartbeat: { 
        updatedAt: isOnline ? futureHeartbeat : pastDate,
        isCurrentlyRunning: isOnline 
      },
      department: faker.commerce.department(),
      position: faker.person.jobTitle(),
      phone: faker.phone.number(),
      attachedAt: pastDate,
      createdAt: pastDate,
      lastLoginLocation: {
          city: faker.location.city(),
          country: faker.location.country(),
          countryCode: faker.location.countryCode(),
          ip: faker.internet.ip(),
          timezone: faker.location.timeZone(),
      },
      stats: {
        totalHours: faker.number.int({ min: 100, max: 1000 }),
        productivity: faker.number.int({ min: 60, max: 100 }),
        tasksCompleted: faker.number.int({ min: 10, max: 200 }),
        rating: faker.number.float({ min: 3, max: 5, fractionDigits: 1 }),
      },
      skills: faker.helpers.arrayElements(["JavaScript", "React", "TypeScript", "Node.js", "UI/UX", "Project Management", "Sales", "Support"], 3),
      onboardingCompleted: true,
      trackingSettings: {
        shiftDefaults: {
          startTime: "09:00",
          endTime: "18:00",
        }
      },
    };
  });
  storage.saveCollection(COLLECTIONS.USERS, users);

  // 3. Shifts & Time Entries & Screenshots
  const shifts: any[] = [];
  const timeEntries: any[] = [];
  const screenshots: any[] = [];
  
  // Generate a pool of dates for the last 30 days
  const shiftDates = Array.from({ length: 30 }).map((_, i) => {
    const d = new Date('2026-04-16T12:00:00Z');
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  });

  Array.from({ length: counts.shifts }).forEach((_, index) => {
    const user = faker.helpers.arrayElement(users);
    const dateStr = faker.helpers.arrayElement(shiftDates);
    const isToday = dateStr === mockTodayDateStr;
    
    // Ensure at least some active shifts for today if requested
    const shiftIndexInDay = index % 2; 

    // For today, align with 09:00 AM scheduled start
    let startHour = 8 + (shiftIndexInDay * 4);
    let startMinute = faker.number.int(59);
    
    if (isToday && shiftIndexInDay === 0) {
        const variance = faker.helpers.arrayElement([-15, 0, 0, 10, 20]);
        startHour = 9;
        startMinute = variance >= 0 ? variance : 60 + variance;
        if (variance < 0) startHour = 8;
    }

    const durationHours = faker.number.float({ min: 4, max: 8, fractionDigits: 1 });
    const totalSeconds = Math.floor(durationHours * 3600);

    const shiftId = `shift_${index}_${user.id}`;
    const isOnline = user.heartbeat.isCurrentlyRunning && isToday;
    const status = (isToday && isOnline) ? 'active' : 'completed';
    
    const startTimeStr = `${dateStr}T${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}:00.000Z`;
    const endTimeStr = `${dateStr}T${String(Math.floor(startHour + durationHours)).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}:00.000Z`;

    const liveBreakdown: Record<string, any> = {};
    const apps = ['VS Code', 'Chrome', 'Slack', 'Terminal', 'Figma', 'Notion', 'Discord'];
    apps.forEach(app => {
        const appSecs = faker.number.int({ min: 500, max: Math.floor(totalSeconds / 3) });
        liveBreakdown[app] = {
            totalSeconds: appSecs,
            activeSeconds: Math.floor(appSecs * 0.85),
            focusScore: faker.number.int({ min: 70, max: 100 }),
            productivityScore: faker.number.int({ min: 70, max: 100 }),
        };
    });

    const hourlyPulse: Record<string, any> = {};
    for (let h = 0; h < 24; h++) {
        if (h >= startHour && h <= Math.floor(startHour + durationHours)) {
            const intensity = faker.number.int({ min: 0, max: 2 });
            const multipliers = [0.2, 1, 1.8];
            const mult = multipliers[intensity];

            hourlyPulse[h.toString()] = {
                metrics: {
                    seconds: 3600,
                    keystrokes: Math.floor(faker.number.int({ min: 2000, max: 6000 }) * mult),
                    mouseClicks: Math.floor(faker.number.int({ min: 400, max: 1200 }) * mult),
                    mouseDistance: Math.floor(faker.number.int({ min: 3000, max: 15000 }) * mult),
                }
            };
        }
    }

    const shift = {
        id: shiftId,
        userId: user.id,
        orgId: mainOrgId,
        startTime: startTimeStr,
        endTime: status === 'active' ? null : endTimeStr,
        status,
        totalSeconds,
        liveMetrics: {
            totalSeconds,
            keystrokes: faker.number.int({ min: 10000, max: 40000 }),
            mouseClicks: faker.number.int({ min: 2000, max: 8000 }),
            mouseDistance: faker.number.int({ min: 20000, max: 80000 }),
            idleSeconds: Math.floor(totalSeconds * 0.05),
            activeSeconds: Math.floor(totalSeconds * 0.95),
        },
        liveBreakdown,
        hourlyPulse,
        cognitiveReport: {
            velocity: faker.number.int({ min: 80, max: 100 }),
            focusScore: faker.number.int({ min: 80, max: 100 }),
            productivityScore: faker.number.int({ min: 80, max: 100 }),
            aiBrief: faker.lorem.sentence(),
        },
        focusScore: faker.number.int({ min: 80, max: 100 }),
        productivityScore: faker.number.int({ min: 80, max: 100 }),
        velocity: faker.number.int({ min: 80, max: 100 }),
        aiBrief: faker.lorem.sentence(),
    };
    shifts.push(shift);

    // Time Entries (1-3 per shift)
    const tCount = faker.number.int({ min: 1, max: 3 });
    for (let t = 0; t < tCount; t++) {
        timeEntries.push({
            id: faker.string.uuid(),
            userId: user.id,
            orgId: mainOrgId,
            startTime: `${dateStr}T${String(startHour + t).padStart(2, '0')}:00:00.000Z`,
            endTime: `${dateStr}T${String(startHour + t + 1).padStart(2, '0')}:00:00.000Z`,
            duration: 3600,
            projectName: faker.company.buzzPhrase(),
            description: faker.hacker.phrase(),
        });
    }

    // Screenshots (2-4 per shift)
    const sCount = faker.number.int({ min: 2, max: 4 });
    for (let j = 0; j < sCount; j++) {
        const sTimestamp = `${dateStr}T${String(startHour + Math.floor(j/2)).padStart(2, '0')}:${String((j%2)*30 + faker.number.int(20)).padStart(2, '0')}:00.000Z`;
        screenshots.push({
            id: faker.string.uuid(),
            userId: user.id,
            orgId: mainOrgId,
            url: faker.image.urlLoremFlickr({ category: 'business', width: 640, height: 360 }),
            timestamp: sTimestamp,
            isBlurred: false,
            activity: {
                windowTitle: faker.hacker.phrase(),
                appName: faker.helpers.arrayElement(['VS Code', 'Chrome', 'Slack', 'Figma', 'Terminal']),
                processName: faker.system.fileName(),
            }
        });
    }
  });
  storage.saveCollection(COLLECTIONS.SHIFTS, shifts);
  storage.saveCollection(COLLECTIONS.TIME_ENTRIES, timeEntries);
  storage.saveCollection(COLLECTIONS.SCREENSHOTS, screenshots);

  // 4. Tasks
  const tasks = Array.from({ length: counts.tasks }).map(() => ({
    id: faker.string.uuid(),
    title: faker.hacker.phrase(),
    description: faker.lorem.paragraph(),
    status: faker.helpers.arrayElement(["todo", "in-progress", "completed", "review", "blocked"]),
    priority: faker.helpers.arrayElement(["low", "medium", "high", "urgent"]),
    assignees: [faker.helpers.arrayElement(users).id],
    dueDate: faker.date.between({ from: '2026-04-10', to: '2026-05-30' }).toISOString(),
    createdAt: mockTodayDateStr + "T10:00:00.000Z",
    orgId: mainOrgId,
    tags: [faker.hacker.adjective(), faker.hacker.noun()],
    subtasks: Array.from({ length: 3 }).map(() => ({
        id: faker.string.uuid(),
        title: faker.hacker.ingverb() + " " + faker.hacker.noun(),
        completed: faker.datatype.boolean()
    })),
    resources: [{
        id: faker.string.uuid(),
        title: faker.system.fileName(),
        url: faker.internet.url(),
        type: 'file'
    }],
    voiceNotes: [{
        id: faker.string.uuid(),
        name: 'Voice Note ' + faker.number.int(100),
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        type: 'audio/mpeg',
        duration: 30
    }],
    images: [{
        id: faker.string.uuid(),
        title: 'Screenshot',
        url: faker.image.urlLoremFlickr({ category: 'abstract' })
    }],
    comments: [],
    history: []
  }));
  storage.saveCollection(COLLECTIONS.TASKS, tasks);

  // 5. CRM Entities
  const crmEntities = Array.from({ length: counts.crm }).flatMap(() => {
    const user = faker.helpers.arrayElement(users);
    return ["lead", "deal", "contact", "organization"].map(type => {
        const data: Record<string, any> = {};
        if (type === 'lead') {
            data.firstName = faker.person.firstName();
            data.lastName = faker.person.lastName();
            data.company = faker.company.name();
            data.status = faker.helpers.arrayElement(['new', 'contacted', 'qualified']);
            data.priority = faker.helpers.arrayElement(['low', 'medium', 'high']);
            data.estimatedValue = faker.number.int({ min: 1000, max: 20000 });
        } else if (type === 'deal') {
            data.name = faker.commerce.productName();
            data.organization = faker.company.name();
            data.status = faker.helpers.arrayElement(['qualification', 'demo', 'proposal', 'negotiation', 'ready', 'won', 'lost']);
            data.annualRevenue = faker.number.int({ min: 10000, max: 100000 });
            data.firstName = faker.person.firstName();
            data.lastName = faker.person.lastName();
            data.email = faker.internet.email();
        } else if (type === 'organization') {
            data.organizationName = faker.company.name();
            data.website = faker.internet.url();
            data.annualRevenue = 500000;
            data.employeeCount = '51-200';
            data.industry = 'Technology';
        } else if (type === 'contact') {
            data.firstName = faker.person.firstName();
            data.lastName = faker.person.lastName();
            data.email = faker.internet.email();
            data.mobile = faker.phone.number();
            data.company = faker.company.name();
        }

        return {
            id: faker.string.uuid(),
            type,
            orgId: mainOrgId,
            name: data.firstName ? `${data.firstName} ${data.lastName}` : (data.name || data.organizationName || "Unknown"),
            data,
            history: [],
            isDeleted: false,
            createdAt: mockTodayDateStr + "T09:00:00.000Z",
            updatedAt: mockTodayDateStr + "T09:00:00.000Z",
            lastEditedBy: user.id
        };
    });
  });
  storage.saveCollection(COLLECTIONS.CRM_ENTITIES, crmEntities);

  // 6. POS Products
  const products = Array.from({ length: counts.pos }).map(() => ({
    id: faker.string.uuid(),
    name: faker.commerce.productName(),
    basePrice: parseFloat(faker.commerce.price({ min: 10, max: 500 })),
    category: faker.commerce.department(),
    stockQuantity: faker.number.int({ min: 5, max: 100 }),
    imageUrl: faker.image.urlLoremFlickr({ category: 'technics', width: 640, height: 360 }),
    orgId: mainOrgId,
  }));
  storage.saveCollection(COLLECTIONS.POS_PRODUCTS, products);

  // 7. Invoices, 8. Notes, 9. Call Logs - All merged into CRM_ENTITIES
  const invoices = Array.from({ length: counts.invoices }).map(() => {
    const org = faker.helpers.arrayElement(crmEntities.filter(e => e.type === 'organization'));
    return {
      id: faker.string.uuid(),
      name: `Invoice for ${org.name}`,
      type: 'invoice',
      orgId: mainOrgId,
      data: {
        invoiceNumber: `INV-${faker.string.numeric(5)}`,
        clientName: org.name,
        clientId: org.id,
        amount: parseFloat(faker.commerce.price({ min: 100, max: 5000 })),
        status: faker.helpers.arrayElement(['paid', 'pending', 'overdue', 'sent', 'draft']),
        issueDate: faker.date.past().toISOString(),
        dueDate: faker.date.future().toISOString(),
        currency: '$',
        items: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }).map(() => ({
            description: faker.commerce.productName(),
            quantity: faker.number.int({ min: 1, max: 10 }),
            unitPrice: parseFloat(faker.commerce.price({ min: 10, max: 1000 })),
        })),
      },
      history: [],
      isDeleted: false,
      createdAt: faker.date.recent().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
      lastEditedBy: faker.helpers.arrayElement(users).id
    };
  });

  const notes = Array.from({ length: counts.notes }).map(() => {
    const entity = faker.helpers.arrayElement(crmEntities);
    return {
      id: faker.string.uuid(),
      name: faker.lorem.words(3),
      type: 'note',
      orgId: mainOrgId,
      data: {
        name: faker.lorem.words(3),
        content: faker.lorem.sentences(3),
        relatedTo: entity.name,
        relatedToId: entity.id,
        relatedToType: entity.type,
      },
      history: [],
      isDeleted: false,
      createdAt: faker.date.recent().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
      lastEditedBy: faker.helpers.arrayElement(users).id
    };
  });

  const callLogs = Array.from({ length: counts.callLogs }).map(() => {
    const contact = faker.helpers.arrayElement(crmEntities.filter(e => e.type === 'contact'));
    return {
      id: faker.string.uuid(),
      name: faker.lorem.sentence(),
      type: 'call',
      orgId: mainOrgId,
      data: {
        summary: faker.lorem.sentence(),
        type: faker.helpers.arrayElement(['Incoming', 'Outgoing']),
        from: faker.phone.number(),
        to: contact.name,
        duration: faker.number.int({ min: 30, max: 3600 }),
        status: faker.helpers.arrayElement(['completed', 'missed', 'voicemail', 'busy']),
        timestamp: faker.date.recent().toISOString(),
        relatedTo: contact.name,
        relatedToId: contact.id,
        relatedToType: 'contact',
        recordingUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      },
      history: [],
      isDeleted: false,
      createdAt: faker.date.recent().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
      lastEditedBy: faker.helpers.arrayElement(users).id
    };
  });

  // Combine all CRM related entities into one collection
  const allCrmEntities = [...crmEntities, ...invoices, ...notes, ...callLogs];
  storage.saveCollection(COLLECTIONS.CRM_ENTITIES, allCrmEntities);

  console.log("Mock data seeded successfully and anchored to April 16, 2026.");
}


