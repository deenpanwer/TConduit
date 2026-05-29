export interface CompetitorData {
  id: string;
  name: string;
  logo: string;
  domain: string;
  seo: {
    title: string;
    description: string;
  };
  hero: {
    painPoint: string;
    headline: string;
    validation: string;
  };
  primarySpecs: {
    label: string;
    tracValue: string;
    competitorValue: string;
    isWin: boolean;
  }[];
  personaStories: {
    tabId: string;
    tabLabel: string;
    title: string;
    description: string;
    competitorPain: string;
    tracGain: string;
  }[];
  switchMatrix: {
    painPoint: string;
    competitorShortcoming: string;
    tracSolution: string;
  }[];
  featuresComparison: {
    category: string;
    features: {
      name: string;
      description: string;
      tracVal: string | boolean; // true = checkmark, false = cross, string = value
      compVal: string | boolean;
      jargonTooltip?: string;
    }[];
  }[];
  roiCalculator: {
    competitorBasePrice: number;
    tracBasePrice: number;
    requiredExternalTools: {
      name: string;
      replaces: string;
      costPerUserMonth: number;
    }[];
  };
}

export const COMPETITORS_CONFIG: Record<string, CompetitorData> = {
  hubstaff: {
    id: "hubstaff",
    name: "Hubstaff",
    domain: "hubstaff.com",
    logo: "https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://hubstaff.com&size=128",
    seo: {
      title: "TRAC AI vs Hubstaff Alternative | Complete Productivity OS",
      description: "Tired of expensive, one-dimensional screenshot trackers? Discover why TRAC AI is the best Hubstaff alternative for high-performance teams, consolidating tracking, CRM, ATS, and accounting."
    },
    hero: {
      painPoint: "Why pay $10/user just to take screenshots?",
      headline: "The Premium, Integrated Hubstaff Alternative Built for Founders",
      validation: "Hubstaff is an excellent tool if you *only* want to take screen pictures. But managing a modern business requires more than just tracking clicks. It requires managing sales, hiring team members, handling payroll, and chatting with staff. Instead of gluing 15 different apps together with brittle integrations, TRAC AI gives you everything in a single, blazing-fast operating system."
    },
    primarySpecs: [
      { label: "Base Monthly Price", competitorValue: "$10.00 / user", tracValue: "$19.99 / user", isWin: false },
      { label: "Replaces External Tools", competitorValue: "No (Requires Slack, HubSpot, QuickBooks, Ashby)", tracValue: "Yes (Replaces 20+ standalone apps)", isWin: true },
      { label: "AI Copilots & Insights", competitorValue: "None", tracValue: "Included (Standard & Premium)", isWin: true },
      { label: "Total Software Costs", competitorValue: "~$2,528 / mo", tracValue: "One Flat Rate", isWin: true }
    ],
    personaStories: [
      {
        tabId: "agencies",
        tabLabel: "For Global Agencies",
        title: "Stop chasing timesheets and API keys across five platforms.",
        description: "Agencies managing remote developers or operations spent hours reconciling Hubstaff screenshots with QuickBooks billing spreadsheets and Slack discussions. Any mismatch results in client disputes.",
        competitorPain: "Hubstaff only records screenshots, leaving your PMs to manually copy hour logs into invoicing sheets and track project updates on ClickUp.",
        tracGain: "TRAC AI maps work-logs, task boards, customer CRM pipelines, and invoicing instantly. Clients click one link to view proof, approvals, and their bills."
      },
      {
        tabId: "startups",
        tabLabel: "For Tech Startups",
        title: "Consolidate your seed round spending in one sweep.",
        description: "Fast-growing tech companies need speed. Paying Ashby for ATS, Salesforce for CRM, Hubstaff for contractors, and Slack for chats drains capital before product-market fit.",
        competitorPain: "Gluing separate tools means paying multiple bills, managing compliance, and losing developer focus.",
        tracGain: "Launch recruitment, hire contractors, sign NDAs, track screens, run sprint boards, and invoice founders—all within one central database."
      }
    ],
    switchMatrix: [
      {
        painPoint: "Exploding Software Costs",
        competitorShortcoming: "You pay Hubstaff for time tracking, HubSpot for CRM, Ashby for recruiting, and Slack for chats. Costs scale exponentially to thousands.",
        tracSolution: "TRAC AI embeds CRM, POS, ATS, chats, shifts, time tracking, and accounting into one flat subscription. Save up to $2,500/month instantly."
      },
      {
        painPoint: "Fragmented Data & Blind Spots",
        competitorShortcoming: "Hubstaff reports show 'hours worked' but don't show what deals were closed, what invoice was sent, or what code was pushed.",
        tracSolution: "Providence tracking links screenshots directly to CRM deals, bookkeeping ledger entries, and active tasks. Total absolute accountability."
      },
      {
        painPoint: "Contractor Onboarding Friction",
        competitorShortcoming: "Signing a new contractor requires sending agreements on DocuSign, adding them to Slack, configuring Hubstaff, and importing bank details.",
        tracSolution: "One-click contractor portals. Send legal agreements (NDAs), run automated clock-ins, review work pipelines, and issue local bank transfer payrolls."
      }
    ],
    featuresComparison: [
      {
        category: "Work Monitoring & Provenance",
        features: [
          { name: "Screenshot Capture", description: "Automated random capture of contractor screens.", tracVal: true, compVal: true, jargonTooltip: "Takes high-fidelity image proofs of the active screen monitor." },
          { name: "Idle Time Detection", description: "Detects away time and stops timer if inactive.", tracVal: true, compVal: true, jargonTooltip: "Triggers inactive alerts if mouse and keyboard activity stops." },
          { name: "Work Provenance Logs", description: "Links screenshot proof directly to client invoice lines.", tracVal: true, compVal: false, jargonTooltip: "Creates audit trials matching invoice requests with screen timestamps." },
          { name: "On-Premise Private Hosting", description: "Host your monitoring logs on your own secure enterprise servers.", tracVal: "Available (Enterprise)", compVal: false, jargonTooltip: "Self-hosting option for maximum defense compliance." }
        ]
      },
      {
        category: "Enterprise ERP Features",
        features: [
          { name: "Built-in CRM & Pipelines", description: "Lead tracking, pipeline deals, and customer profiles.", tracVal: true, compVal: false, jargonTooltip: "Customer Relationship Management for capturing and closing clients." },
          { name: "Applicant Tracking System (ATS)", description: "Job boards, candidate review sheets, and contractor hiring portals.", tracVal: true, compVal: false, jargonTooltip: "Unified module to publish listings and screen resumes." },
          { name: "Multi-Currency Bookkeeping", description: "Reconciliation of invoices and calendars directly to balance sheets.", tracVal: true, compVal: false, jargonTooltip: "Local and global accounting entries matching tax codes." },
          { name: "Point of Sale (POS) Checkout", description: "Physical and digital checkout registers synced with inventory.", tracVal: true, compVal: false, jargonTooltip: "Cash registers matching in-store sales." }
        ]
      },
      {
        category: "Collaboration & Safety",
        features: [
          { name: "Integrated Team Chats", description: "Secure Slack-like 1-on-1 and group channels.", tracVal: true, compVal: false, jargonTooltip: "Built-in secure messenger replacing third-party Slack accounts." },
          { name: "Gamified Leaderboards", description: "Points and contests based on completed tasks.", tracVal: true, compVal: false, jargonTooltip: "Friendly office scoreboards to motivate productivity." },
          { name: "Legal NDA & Contracts Sync", description: "Pre-approved contractor legal forms ready for e-signatures.", tracVal: true, compVal: false, jargonTooltip: "Generates custom contracts for immediate digital signing." }
        ]
      }
    ],
    roiCalculator: {
      competitorBasePrice: 10,
      tracBasePrice: 19.99,
      requiredExternalTools: [
        { name: "Salesforce / HubSpot", replaces: "CRM Module", costPerUserMonth: 150 },
        { name: "Ashby / Greenhouse", replaces: "ATS & Hiring Module", costPerUserMonth: 300 },
        { name: "Slack Pro Plan", replaces: "Team Chats Module", costPerUserMonth: 8 },
        { name: "QuickBooks Online", replaces: "Accounting Module", costPerUserMonth: 30 }
      ]
    }
  },
  clickup: {
    id: "clickup",
    name: "ClickUp",
    domain: "clickup.com",
    logo: "https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://clickup.com&size=128",
    seo: {
      title: "TRAC AI vs ClickUp Alternative | Consolidated Productivity OS",
      description: "Frustrated with ClickUp lag and separate tracking extensions? Discover why TRAC AI is the best ClickUp alternative for unified project and operations management."
    },
    hero: {
      painPoint: "Tired of bloated boards and heavy lag?",
      headline: "The Premium, Blazing-Fast ClickUp Alternative with Built-in Tracking",
      validation: "ClickUp is highly custom, but it runs notoriously slow under heavy load and requires buying separate time-trackers like Hubstaff. TRAC AI is engineered for instant FCP performance, native remote screenshot logs, and a complete ERP ecosystem."
    },
    primarySpecs: [
      { label: "Base Monthly Price", competitorValue: "$12.00 / user", tracValue: "$19.99 / user", isWin: false },
      { label: "Screenshot & Activity Proof", competitorValue: "No (Requires integration)", tracValue: "Included Natively", isWin: true },
      { label: "FCP / Speed Performance", competitorValue: "Laggy on large datasets", tracValue: "Sub-0.4s Instant Hydration", isWin: true },
      { label: "Full Operations CRM/ATS", competitorValue: "Basic templates only", tracValue: "Included (Full Grade)", isWin: true }
    ],
    personaStories: [
      {
        tabId: "agencies",
        tabLabel: "For Global Agencies",
        title: "Consolidate task tracking with real contractor accountability.",
        description: "Agencies need to prove to clients that hours logged actually match work done. ClickUp shows task states, but doesn't guarantee proof.",
        competitorPain: "Paying for ClickUp + separate contractor monitoring tools splits focus and makes clients double-check spreadsheets.",
        tracGain: "Contractors view their tasks, clock in, and upload screen proofs in one click. Clients see the full pipeline with proof attached."
      },
      {
        tabId: "startups",
        tabLabel: "For Tech Startups",
        title: "High-speed developer boards without the dashboard bloat.",
        description: "Startups need clean boards that load in milliseconds, not customizable configurations that take weeks to manage.",
        competitorPain: "ClickUp's endless menu options distract from ship speed and cause heavy interface lag.",
        tracGain: "A clean, Montserrat-styled dashboard containing clear project lists, AI lead hunters, and built-in chats."
      }
    ],
    switchMatrix: [
      {
        painPoint: "Interface Lag and Sluggishness",
        competitorShortcoming: "ClickUp uses heavy clientside JavaScript that takes seconds to initialize, stalling contractor efficiency.",
        tracSolution: "TRAC AI is built with server-first SSR and deferred hydration, yielding rapid sub-second interaction speeds."
      },
      {
        painPoint: "Fragmented Tracking",
        competitorShortcoming: "ClickUp tracks project states but forces you to integrate external apps to see contractor screens and idle times.",
        tracSolution: "Native screenshot capture is baked directly into TRAC AI's tasks. Total task accountability."
      },
      {
        painPoint: "Disjointed Messaging Channels",
        competitorShortcoming: "ClickUp comments get buried inside individual tickets, forcing you to pay for Slack to hold team meetings.",
        tracSolution: "TRAC AI hosts standard Slack-like group chat channels natively in the platform. Total unified communication."
      }
    ],
    featuresComparison: [
      {
        category: "Task & Project Management",
        features: [
          { name: "Kanban Columns & Lists", description: "Standard project boards for agile sprint planning.", tracVal: true, compVal: true, jargonTooltip: "Visual column boards representing task progression." },
          { name: "Built-in Screenshot Proof", description: "Captures screen intervals directly inside tasks.", tracVal: true, compVal: false, jargonTooltip: "Links tracking proof directly with board cards." },
          { name: "AI Lead Hunter Integration", description: "Deliver 5,000 to 50,000 warm leads directly to sales lists.", tracVal: true, compVal: false, jargonTooltip: "AI-driven prospect lead extraction." }
        ]
      },
      {
        category: "Enterprise Operations & ERP",
        features: [
          { name: "Unified Team Chats", description: "Built-in real-time group chats and direct messages.", tracVal: true, compVal: false, jargonTooltip: "Messenger channels directly inside the same environment." },
          { name: "Multi-Currency Bookkeeping", description: "Payroll, invoices, and expenses reconciled dynamically.", tracVal: true, compVal: false, jargonTooltip: "Replaces external QuickBooks subscriptions." },
          { name: "Integrated ATS & Hiring", description: "Custom job pipelines and candidate resume parsing.", tracVal: true, compVal: false, jargonTooltip: "Complete candidate onboarding tracker." }
        ]
      }
    ],
    roiCalculator: {
      competitorBasePrice: 12,
      tracBasePrice: 19.99,
      requiredExternalTools: [
        { name: "Hubstaff Track Plan", replaces: "Time Tracking & Screens", costPerUserMonth: 10 },
        { name: "Salesforce CRM", replaces: "CRM Module", costPerUserMonth: 150 },
        { name: "Greenhouse Recruiting", replaces: "ATS Module", costPerUserMonth: 300 },
        { name: "Slack Pro Plan", replaces: "Team Chats Module", costPerUserMonth: 8 },
        { name: "QuickBooks Online", replaces: "Accounting Module", costPerUserMonth: 30 }
      ]
    }
  },
  monday: {
    id: "monday",
    name: "Monday.com",
    domain: "monday.com",
    logo: "https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://monday.com&size=128",
    seo: {
      title: "TRAC AI vs Monday.com Alternative | Unified Operations OS",
      description: "Frustrated with Monday.com's high integration licensing costs? Discover why TRAC AI is the best Monday.com alternative for complete business operation and lead tracking."
    },
    hero: {
      painPoint: "Why pay thousands for colorful tables that don't track work?",
      headline: "The Premium, High-Performance Monday.com Alternative for Fast Teams",
      validation: "Monday.com has colorful grids, but it behaves as a simple spreadsheet system until you integrate multiple external apps. TRAC AI combines task pipelines and lists with native contractor screen tracking, multi-currency accounting, group chats, and hiring portals out of the box."
    },
    primarySpecs: [
      { label: "Base Monthly Price", competitorValue: "$15.00 / user", tracValue: "$19.99 / user", isWin: false },
      { label: "Work Provenance Screenshots", competitorValue: "No (Requires integration)", tracValue: "Included Natively", isWin: true },
      { label: "Built-in Team Messaging", competitorValue: "No (Requires Slack)", tracValue: "Yes (Slack-like channels)", isWin: true },
      { label: "ERP Accounting & POS", competitorValue: "No", tracValue: "Included (Full Stack)", isWin: true }
    ],
    personaStories: [
      {
        tabId: "agencies",
        tabLabel: "For Global Agencies",
        title: "Ditch the manual spreadsheets and API key puzzles.",
        description: "Monday.com is great for basic tracking, but managing an agency requires paying for time logs, CRM, and team chats. TRAC AI consolidates all contractor data instantly.",
        competitorPain: "Paying for Monday.com + Slack + Hubstaff splits contractor attention and leads to invoice errors.",
        tracGain: "Roster contractors, manage agile projects, track screenshots, and run ledger accounts in one place."
      },
      {
        tabId: "startups",
        tabLabel: "For Tech Startups",
        title: "High-velocity pipelines with direct lead lists.",
        description: "Startups must close deals fast. Running a CRM outside of task management requires paying massive HubSpot fees.",
        competitorPain: "Integrating HubSpot pipelines with Monday.com tasks is complex and expensive.",
        tracGain: "Extract qualified warm leads with the AI Lead Hunter and pass them directly to active pipeline columns."
      }
    ],
    switchMatrix: [
      {
        painPoint: "High Integration Costs",
        competitorShortcoming: "Monday.com behaves like a static table unless you buy integrations for Slack, QuickBooks, and Hubstaff, costing thousands.",
        tracSolution: "TRAC AI hosts CRM, POS, ATS, chats, and accounting natively, saving you up to $2,500/month in separate bills."
      },
      {
        painPoint: "Zero Native Activity Proof",
        competitorShortcoming: "Monday.com doesn't capture contractor screen proofs, forcing you to rely on trust or complex external extensions.",
        tracSolution: "Native screenshot capture is integrated directly into the workspace, yielding automated, audit-proof timesheets."
      }
    ],
    featuresComparison: [
      {
        category: "Grid & Workspace Management",
        features: [
          { name: "Columns & Custom Lists", description: "Customizable columns to track tasks and updates.", tracVal: true, compVal: true, jargonTooltip: "Spreadsheet-like interactive boards." },
          { name: "Native Screen Evidence", description: "Takes screen captures directly inside task rows.", tracVal: true, compVal: false, jargonTooltip: "Tracks screen state at random intervals." },
          { name: "AI Lead Hunter Integration", description: "Deliver 5,000 to 50,000 warm leads directly to sales lists.", tracVal: true, compVal: false, jargonTooltip: "AI-driven prospect lead extraction." }
        ]
      },
      {
        category: "Unified Operations Suite",
        features: [
          { name: "Slack-like Chats", description: "Secure real-time group chats and direct messages.", tracVal: true, compVal: false, jargonTooltip: "Real-time communication channels inside the app." },
          { name: "Global Bookkeeping Suite", description: "Auto-reconciles invoices directly to ledger balances.", tracVal: true, compVal: false, jargonTooltip: "Replaces QuickBooks." }
        ]
      }
    ],
    roiCalculator: {
      competitorBasePrice: 15,
      tracBasePrice: 19.99,
      requiredExternalTools: [
        { name: "Hubstaff Track Plan", replaces: "Time Tracking & Screens", costPerUserMonth: 10 },
        { name: "Salesforce CRM", replaces: "CRM Module", costPerUserMonth: 150 },
        { name: "Greenhouse Recruiting", replaces: "ATS Module", costPerUserMonth: 300 },
        { name: "Slack Pro Plan", replaces: "Team Chats Module", costPerUserMonth: 8 },
        { name: "QuickBooks Online", replaces: "Accounting Module", costPerUserMonth: 30 }
      ]
    }
  }
};
