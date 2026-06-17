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
      painPoint: "Why pay $25/user just to take screenshots?",
      headline: "The Premium, Integrated Hubstaff Alternative Built for Founders",
      validation: "Hubstaff is an excellent tool if you *only* want to take screen pictures. But managing a modern business requires more than just tracking clicks. It requires managing sales, hiring team members, handling payroll, and chatting with staff. Instead of gluing 15 different apps together with brittle integrations, TRAC AI gives you everything in a single, blazing-fast operating system."
    },
    primarySpecs: [
      { label: "Base Monthly Price", competitorValue: "$25.00 / user", tracValue: "$39.00 / user", isWin: false },
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
      competitorBasePrice: 25,
      tracBasePrice: 39,
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
      { label: "Base Monthly Price", competitorValue: "$29.00 / user", tracValue: "$39.00 / user", isWin: false },
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
      competitorBasePrice: 29,
      tracBasePrice: 39,
      requiredExternalTools: [
        { name: "Hubstaff Track Plan", replaces: "Time Tracking & Screens", costPerUserMonth: 10 },
        { name: "Salesforce CRM", replaces: "CRM Module", costPerUserMonth: 150 },
        { name: "Greenhouse Recruiting", replaces: "ATS Module", costPerUserMonth: 300 },
        { name: "Slack Pro Plan", replaces: "Team Chats Module", costPerUserMonth: 8 },
        { name: "QuickBooks Online", replaces: "Accounting Module", costPerUserMonth: 30 }
      ]
    }
  },
  "hubstaff-pakistan": {
    id: "hubstaff-pakistan",
    name: "Hubstaff (Pakistan)",
    domain: "hubstaff.com",
    logo: "https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://hubstaff.com&size=128",
    seo: {
      title: "Best Hubstaff Alternative in Pakistan with PKR Pricing | Trac AI",
      description: "Tired of paying Hubstaff in USD? Discover Trac AI, the best Hubstaff alternative in Pakistan with screenshots, timesheets, and local bank transfers."
    },
    hero: {
      painPoint: "Stop paying $25 USD/user when you can pay in PKR.",
      headline: "The Best Hubstaff Alternative in Pakistan with PKR Local Billing",
      validation: "Paying international subscriptions in USD from Pakistan has become a nightmare due to strict banking limits, card blockages, and volatile exchange rates. TRAC AI solves this by offering dedicated local PKR pricing starting at just Rs 3,000/user/month, payable via direct local bank transfer (HBL, Meezan, Alfalah, etc.). You get screenshots, timesheets, CRM, ATS, and chats in a single platform, saving over 80% on software bills."
    },
    primarySpecs: [
      { label: "Base Monthly Price", competitorValue: "$25.00 / user (Rs 7,000+)", tracValue: "Rs 3,000 / user", isWin: true },
      { label: "Local Bank Payments (PKR)", competitorValue: "No (Requires USD credit cards)", tracValue: "Yes (HBL, Meezan, Alfalah, etc.)", isWin: true },
      { label: "State Bank Card Limits", competitorValue: "Blocked/Subject to international limits", tracValue: "Zero Limits (Direct PKR invoicing)", isWin: true },
      { label: "All-in-One CRM, ATS, Bookkeeping", competitorValue: "No (Requires additional external apps)", tracValue: "Included Natively", isWin: true }
    ],
    personaStories: [
      {
        tabId: "softwarehouses",
        tabLabel: "For Pakistani Software Houses",
        title: "Scale your remote team without card payment blockages.",
        description: "Software houses in Lahore, Karachi, and Islamabad face card transaction failures when paying USD subscription bills. Plus, the high exchange rate drains rupee profitability.",
        competitorPain: "Hubstaff forces you to pay in USD on foreign credit cards, which frequently fail bank compliance blocks and cost over Rs 7,000 per seat.",
        tracGain: "Pay locally in PKR, get tax-compliant invoices, and track remote developers with native screenshots, task boards, and automated client timesheets."
      },
      {
        tabId: "bpos",
        tabLabel: "For BPO & Call Centers",
        title: "Complete agent tracking and shift rosters in PKR.",
        description: "BPO agencies running remote campaigns require 24/7 accountability. Paying separate fees for time tracking, schedules, and chats is unsustainable under local margins.",
        competitorPain: "Hubstaff adds massive overheads for call center agents, forcing you to purchase separate platforms for rosters and chat communication.",
        tracGain: "Set shift schedules, track agent active screens, monitor client KPIs, and chat with team members in a single PKR plan."
      }
    ],
    switchMatrix: [
      {
        painPoint: "USD Exchange Rate Fluctuations",
        competitorShortcoming: "Your software costs go up every time the PKR depreciates against the USD. Budgeting becomes impossible.",
        tracSolution: "TRAC AI guarantees flat, localized PKR pricing that remains stable, allowing you to project margins accurately."
      },
      {
        painPoint: "International Transaction Card Blocks",
        competitorShortcoming: "State Bank of Pakistan's strict policies on commercial cards cause payment declines on global sites.",
        tracSolution: "Pay with local bank transfers or local card processing with direct tax-compliant local invoicing."
      }
    ],
    featuresComparison: [
      {
        category: "Tracking & Local Compliance",
        features: [
          { name: "Screenshot Capture", description: "Automated random capture of agent screens.", tracVal: true, compVal: true },
          { name: "Idle Time & Attendance", description: "Tracks active time vs away intervals.", tracVal: true, compVal: true },
          { name: "PKR Bank Payments", description: "Accepts direct local bank transfers.", tracVal: true, compVal: false },
          { name: "Tax Invoice (FBR)", description: "Local tax-compliant invoices for tax returns.", tracVal: true, compVal: false }
        ]
      }
    ],
    roiCalculator: {
      competitorBasePrice: 25,
      tracBasePrice: 5.35,
      requiredExternalTools: [
        { name: "HubSpot CRM", replaces: "CRM Module", costPerUserMonth: 150 },
        { name: "Greenhouse / Ashby", replaces: "ATS Module", costPerUserMonth: 300 },
        { name: "Slack Pro Plan", replaces: "Chats Module", costPerUserMonth: 8 }
      ]
    }
  },
  "hubstaff-india": {
    id: "hubstaff-india",
    name: "Hubstaff (India)",
    domain: "hubstaff.com",
    logo: "https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://hubstaff.com&size=128",
    seo: {
      title: "Best Hubstaff Alternative in India with INR Pricing & GST | Trac AI",
      description: "Tired of paying Hubstaff in USD? Discover Trac AI, the best Hubstaff alternative in India with screenshots, GST invoices, UPI, and local net banking."
    },
    hero: {
      painPoint: "Stop paying $25 USD/user when you can pay in INR.",
      headline: "The Best Hubstaff Alternative in India with INR localized Billing",
      validation: "Indian IT companies, agencies, and software developers lose substantial margins to USD-to-INR conversion fees and international card processing charges. TRAC AI solves this by offering flat INR pricing starting at just ₹450/user/month, payable via local payment modes (UPI, Net Banking, credit/debit cards) with full GST tax compliance invoices. You get screenshot tracking, task boards, chats, CRM, ATS, and bookkeeping in a single flat rate, reducing overall SaaS tool costs by 80%."
    },
    primarySpecs: [
      { label: "Base Monthly Price", competitorValue: "$25.00 / user (₹2,100+)", tracValue: "₹450 / user", isWin: true },
      { label: "Local UPI/Net Banking (INR)", competitorValue: "No (Requires USD credit cards)", tracValue: "Yes (UPI, GPay, local banks)", isWin: true },
      { label: "GST Tax Invoicing", competitorValue: "No", tracValue: "Yes (Full 18% GST invoice)", isWin: true },
      { label: "All-in-One CRM, ATS, Bookkeeping", competitorValue: "No (Requires additional external apps)", tracValue: "Included Natively", isWin: true }
    ],
    personaStories: [
      {
        tabId: "softwarehouses",
        tabLabel: "For Indian Software Houses",
        title: "Scale your software agency with local INR invoicing.",
        description: "IT exporters in Bangalore, Noida, Pune, and Hyderabad need tax compliance. Paying foreign subscriptions in USD makes GST reconciliation difficult.",
        competitorPain: "Hubstaff charges in USD without localized Indian GST billing, leading to complex tax reconciliation issues.",
        tracGain: "Receive standard Indian tax-compliant GST invoices, pay via local net banking, and track developers with native timesheets and screen captures."
      }
    ],
    switchMatrix: [
      {
        painPoint: "High Subscription Costs & GST Reclaim",
        competitorShortcoming: "Paying Hubstaff in USD means you cannot claim Input Tax Credit (ITC) easily since they don't supply localized GST invoices.",
        tracSolution: "TRAC AI provides local Indian billing with full GST invoices, enabling simple ITC claims and tax compliance."
      }
    ],
    featuresComparison: [
      {
        category: "Tracking & Local Compliance",
        features: [
          { name: "Screenshot Capture", description: "Automated random capture of agent screens.", tracVal: true, compVal: true },
          { name: "Idle Time & Attendance", description: "Tracks active time vs away intervals.", tracVal: true, compVal: true },
          { name: "UPI & Net Banking", description: "Accepts direct local Indian payments.", tracVal: true, compVal: false },
          { name: "GST Invoice", description: "Local tax-compliant invoices for tax filings.", tracVal: true, compVal: false }
        ]
      }
    ],
    roiCalculator: {
      competitorBasePrice: 25,
      tracBasePrice: 5.40,
      requiredExternalTools: [
        { name: "HubSpot CRM", replaces: "CRM Module", costPerUserMonth: 150 },
        { name: "Greenhouse / Ashby", replaces: "ATS Module", costPerUserMonth: 300 },
        { name: "Slack Pro Plan", replaces: "Chats Module", costPerUserMonth: 8 }
      ]
    }
  },
  "hubstaff-uae": {
    id: "hubstaff-uae",
    name: "Hubstaff (UAE)",
    domain: "hubstaff.com",
    logo: "https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://hubstaff.com&size=128",
    seo: {
      title: "Best Hubstaff Alternative in UAE with AED Pricing | Trac AI",
      description: "Discover Trac AI, the best Hubstaff alternative in the UAE with screenshots, AED corporate billing, and local currency transfers."
    },
    hero: {
      painPoint: "Stop paying $25 USD/user when you can pay in AED.",
      headline: "The Best Hubstaff Alternative in the UAE with AED localized Billing",
      validation: "Agencies and remote hubs operating in Dubai and Abu Dhabi benefit from localized pricing. TRAC AI offers dedicated local AED billing starting at just 20 AED/user/month, payable via direct local transfers or credit cards. You get high-fidelity screenshots, timesheets, CRM, ATS, and chats in a single flat rate, reducing overall SaaS tool costs by 80%."
    },
    primarySpecs: [
      { label: "Base Monthly Price", competitorValue: "$25.00 / user (92 AED)", tracValue: "20 AED / user", isWin: true },
      { label: "Local Corporate Transfer (AED)", competitorValue: "No (Requires USD credit cards)", tracValue: "Yes (AED local bank transfers)", isWin: true },
      { label: "All-in-One CRM, ATS, Bookkeeping", competitorValue: "No (Requires additional external apps)", tracValue: "Included Natively", isWin: true }
    ],
    personaStories: [
      {
        tabId: "softwarehouses",
        tabLabel: "For UAE Remote Teams",
        title: "Scale your remote team in UAE with AED invoicing.",
        description: "Companies in Dubai need tax compliance. Trac AI allows paying in AED, keeping payments aligned with local accounting procedures.",
        competitorPain: "Hubstaff forces payment in USD, resulting in additional foreign exchange conversion fees.",
        tracGain: "Invoiced directly in AED, allowing simple local accounting reconciliations and lower fees."
      }
    ],
    switchMatrix: [
      {
        painPoint: "FX Conversion Fees",
        competitorShortcoming: "Foreign card transactions incur up to 3% conversion markup on top of USD subscription costs.",
        tracSolution: "TRAC AI bills flat in AED, eliminating all currency exchange surcharges and simplifying corporate audits."
      }
    ],
    featuresComparison: [
      {
        category: "Tracking & Local Compliance",
        features: [
          { name: "Screenshot Capture", description: "Automated random capture of agent screens.", tracVal: true, compVal: true },
          { name: "Idle Time & Attendance", description: "Tracks active time vs away intervals.", tracVal: true, compVal: true },
          { name: "AED Card & Transfers", description: "Accepts direct local UAE payments.", tracVal: true, compVal: false }
        ]
      }
    ],
    roiCalculator: {
      competitorBasePrice: 25,
      tracBasePrice: 5.45,
      requiredExternalTools: [
        { name: "HubSpot CRM", replaces: "CRM Module", costPerUserMonth: 150 },
        { name: "Greenhouse / Ashby", replaces: "ATS Module", costPerUserMonth: 300 },
        { name: "Slack Pro Plan", replaces: "Chats Module", costPerUserMonth: 8 }
      ]
    }
  }
};
