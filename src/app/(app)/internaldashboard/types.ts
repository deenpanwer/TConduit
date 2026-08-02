export interface InternalUser {
    id: string;
    name: string;
    email: string;
    role: string;
    ownedOrgId?: string;
    orgName?: string;
    totalVisits?: number;
    visits?: Record<string, any>;
    createdAt?: string;
    updatedAt?: string;
    orgData?: any;
    lastActivity?: string | null;
    talked?: boolean;
    recentSessions?: any[];
    whatsAppNumber?: string | null;
  }
  
  export interface OrgDetails {
    org: any;
    staff: StaffMember[];
    clientShares?: any[];
  }
  
  export interface StaffMember {
    id: string;
    name: string;
    email: string;
    role: string;
    photoUrl?: string;
    totalVisits: number;
    recentSessions: any[];
    lastLoginLocation?: {
      city: string;
      country: string;
      region: string;
    };
    lastLoginAppVersion?: string;
    lastLoginOs?: string;
    lastLoginIpAddress?: string;
    currentVersion?: string;
    isPWA?: boolean;
    notificationsEnabled?: boolean;
    whatsAppNumber?: string;
    accessLocked?: boolean;
    active?: boolean;
    screenshotInterval?: number;
    shiftSyncInterval?: number;
    blurScreenshots?: boolean;
    onboardingProfile?: any;
    heartbeat?: {
      isCurrentlyRunning: boolean;
      lastActive: string;
    };
    createdAt?: string;
    updatedAt?: string;
    lastActivity?: string | null;
  }
  
  export interface DownloadEvent {
    id: string;
    timestamp: string;
    version?: string;
    platform: string;
    ip: string;
    geo: {
      city: string;
      country: string;
      region: string;
      latitude: string;
      longitude: string;
    };
    userAgent: string;
    screenResolution?: string;
    viewportSize?: string;
    devicePixelRatio?: number;
    timeZone?: string;
    language?: string;
    vendor?: string;
    isPWA?: boolean;
  }
  