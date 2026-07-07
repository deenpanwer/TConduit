"use client";

import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { faker } from '@faker-js/faker';
import { 
  Monitor, Calendar, Target, Wallet, Briefcase, Compass,
  ChevronLeft, ChevronRight, Activity, Clock, FileText,
  Users, CalendarDays, DollarSign, ListTodo, PieChart, Check, Settings,
  BarChart2, Server, Smartphone, Layers, Globe, Hourglass, X, CheckSquare, Coffee, MessageSquare, Bell,
  MoreVertical, Search, Plus, Folder, Star, FastForward, ChevronDown, Fingerprint, Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// --- Data for Steps ---
const TEAM_SIZES = ["1 - 2", "3 - 5", "6 - 10", "11 - 50", "51 - 250", "251 - 500", "500+"];

const COMMON_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Calcutta",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "UTC"
];

const TRACKING_MODES = [
  { 
    id: 'desktop', 
    title: 'Desktop Based', 
    badge: 'Recommended, most used', 
    icon: Monitor, 
    desc: "You'll get team activity, URL logging, and screenshots out of the box." 
  },
  { 
    id: 'chrome', 
    title: 'Chrome Based', 
    icon: Globe, 
    desc: "Track time directly from the browser using our extension." 
  },
  { 
    id: 'mobile', 
    title: 'Mobile Based', 
    icon: Smartphone, 
    desc: "Biometric attendance, internal communications, and location tracking." 
  },
  { 
    id: 'silent', 
    title: 'Silent App', 
    icon: Server, 
    desc: "Silently track time and block websites on company-owned devices." 
  },
];

const GOALS = [
  {
    id: "monitor",
    title: "Monitor our employees",
    description: "Track time, see what your team is working on, view screenshots, better understand how you can improve your performance, and more.",
    icon: Monitor,
    badge: "Most popular"
  },
  {
    id: "schedules",
    title: "Manage our schedules",
    description: "Set time off policies, approve and deny overtime requests, and more.",
    icon: Calendar
  },
  {
    id: "crm",
    title: "CRM",
    description: "Manage your sales pipeline, track leads, close deals, and generate invoices effortlessly.",
    icon: Target
  },
  {
    id: "pay",
    title: "Pay our staff",
    description: "Set pay rates, send payments to staff, connect with third-party payroll providers, and streamline back office operations.",
    icon: Wallet
  },
  {
    id: "projects",
    title: "Track projects, cost & budgeting",
    description: "Track work against projects and set budget limits.",
    icon: Briefcase
  },
  {
    id: "explore",
    title: "Just exploring",
    description: "Explore our range of features and discover the tools that will best enhance your team's productivity.",
    icon: Compass
  }
];

export default function TestOnboardingPage() {
  const [step, setStep] = useState(0); // 0: Welcome, 1: Create Org, 2: Tracking Mode, 3: Goals

  // Step 1 State
  const [orgName, setOrgName] = useState("");
  const [website, setWebsite] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [customerValue, setCustomerValue] = useState("");
  const [avgSalary, setAvgSalary] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [whatsapp, setWhatsapp] = useState("");
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York");
  const [shiftLength, setShiftLength] = useState("8h");
  const [workdays, setWorkdays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setLogoFile(e.dataTransfer.files[0]);
    }
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0]);
    }
  };

  // Step 2 State
  const [trackingMode, setTrackingMode] = useState("desktop");

  // Step 3 State
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  // Step 4 State
  const [enableDummyData, setEnableDummyData] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const copyLink = (type: string) => {
    setCopiedLink(type);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  // Step 5 State (Screenshots)
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState('John Doe');

  const dummyScreenshotData = useMemo(() => {
    faker.seed(selectedEmployee === 'John Doe' ? 123 : 456);
    return [
      {
         hour: "9:00 am - 10:00 am",
         totalWorked: "1:00:00",
          slots: Array.from({ length: 6 }).map((_, i) => ({
             id: faker.string.uuid(),
             project: faker.helpers.arrayElement(["SEO", "Video production", "Mobile app design", "Web app design"]) as string,
             task: "No to-dos",
             timeRange: `09:${i}0 am - 09:${i+1}0 am`,
             activityPercent: faker.number.int({ min: 0, max: 100 }),
             hasScreenshot: Math.random() > 0.2,
             imageUrl: faker.image.url({ width: 400, height: 250 }),
          }))
       },
      {
         hour: "10:00 am - 11:00 am",
         totalWorked: "1:00:00",
         slots: Array.from({ length: 6 }).map((_, i) => ({
            id: faker.string.uuid(),
            project: faker.helpers.arrayElement(["SEO", "Video production", "App development", "Social media", "Website"]) as string,
            task: "No to-dos",
            timeRange: `10:${i}0 am - 10:${i+1}0 am`,
            activityPercent: faker.number.int({ min: 0, max: 100 }),
            hasScreenshot: Math.random() > 0.2,
            imageUrl: faker.image.url({ width: 400, height: 250 }),
         }))
      }
    ];
  }, [selectedEmployee]);

  const allScreenshots = useMemo(() => {
    return dummyScreenshotData.flatMap(b => b.slots).filter(s => s.hasScreenshot).map(s => s.imageUrl);
  }, [dummyScreenshotData]);

  const handleNextScreenshot = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedScreenshot) return;
    const idx = allScreenshots.indexOf(selectedScreenshot);
    if (idx !== -1 && idx < allScreenshots.length - 1) {
      setSelectedScreenshot(allScreenshots[idx + 1]);
    } else {
      setSelectedScreenshot(allScreenshots[0]);
    }
  };

  const handlePrevScreenshot = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedScreenshot) return;
    const idx = allScreenshots.indexOf(selectedScreenshot);
    if (idx > 0) {
      setSelectedScreenshot(allScreenshots[idx - 1]);
    } else {
      setSelectedScreenshot(allScreenshots[allScreenshots.length - 1]);
    }
  };


  // Step 6 State (Approve Workshift)
  const [isManagerReviewOpen, setIsManagerReviewOpen] = useState(false);
  const [managerRemarks, setManagerRemarks] = useState('');
  const [selectedReviewEmployee, setSelectedReviewEmployee] = useState<'John Doe' | 'Jane Smith'>('John Doe');

  const [timesheetApproved, setTimesheetApproved] = useState<Record<string, boolean>>({
    "John Doe": false,
    "Jane Smith": false
  });

  const employeeTimesheets = useMemo(() => ({
    "John Doe": [
      { project: "Website", org: "Your Organization", manualPercent: 10, totalWorked: "00:38:09", timeSpan: "05:30 am - 06:08 am", screenshotUrl: "https://picsum.photos/400/250?random=1" },
      { project: "Blog", org: "Your Organization", manualPercent: 0, totalWorked: "01:42:03", timeSpan: "06:08 am - 08:00 am", screenshotUrl: "https://picsum.photos/400/250?random=2" },
      { project: "Video production", org: "Your Organization", manualPercent: 25, totalWorked: "02:00:00", timeSpan: "08:00 am - 10:00 am", screenshotUrl: "https://picsum.photos/400/250?random=3" }
    ],
    "Jane Smith": [
      { project: "App development", org: "Your Organization", manualPercent: 5, totalWorked: "01:15:00", timeSpan: "09:00 am - 10:15 am", screenshotUrl: "https://picsum.photos/400/250?random=4" },
      { project: "SEO", org: "Your Organization", manualPercent: 0, totalWorked: "02:30:00", timeSpan: "10:15 am - 12:45 pm", screenshotUrl: "https://picsum.photos/400/250?random=5" },
      { project: "Website design", org: "Your Organization", manualPercent: 12, totalWorked: "01:45:00", timeSpan: "01:15 pm - 03:00 pm", screenshotUrl: "https://picsum.photos/400/250?random=6" }
    ]
  }), []);

  const shiftDetails = useMemo(() => ({
    "John Doe": {
      totalTime: "04:20:12",
      activeTime: "03:45:00",
      idleTime: "00:15:12",
      breakTime: "00:20:00",
      remark: "Completed the website updates and moved on to video production. Had a short power outage so manual time was added for that 25% block.",
      corePercent: 34,
      nonCorePercent: 56,
      unproductivePercent: 10,
    },
    "Jane Smith": {
      totalTime: "06:30:15",
      activeTime: "05:45:00",
      idleTime: "00:25:15",
      breakTime: "00:20:00",
      remark: "Configured the SEO settings and finished the mobile app designs. The manual time block was for offline client consultation.",
      corePercent: 75,
      nonCorePercent: 20,
      unproductivePercent: 5,
    }
  }), []);

  const currentShiftDetail = shiftDetails[selectedReviewEmployee] || shiftDetails["John Doe"];

  // Step 7 State (Unusual Activity)
  const [isUnusualActivityModalOpen, setIsUnusualActivityModalOpen] = useState(false);
  const [selectedUnusualInstance, setSelectedUnusualInstance] = useState(0);

  // Step 8 State (Team Insights)
  const [selectedInsightEmployee, setSelectedInsightEmployee] = useState('John Doe');

  const employeeInsightData: Record<string, {
    averageActivity: number;
    industryCompareText: string;
    industryCompareLeft: string;
    apps: Array<{ name: string; percent: number; time: string; color: string; isUrl?: boolean }>;
    classification: {
      core: number;
      nonCore: number;
      unproductive: number;
    };
    breakdownHtml: React.ReactNode;
  }> = useMemo(() => ({
    "John Doe": {
      averageActivity: 45,
      industryCompareText: "Other Industry average range: 46% - 60%",
      industryCompareLeft: "45%",
      apps: [
        { name: "Slack", percent: 61, time: "2:00", color: "bg-slate-500" },
        { name: "Figma", percent: 22, time: "0:40", color: "bg-[#2b90ff]" },
        { name: "VS Code", percent: 8, time: "0:32", color: "bg-[#2b90ff]" },
        { name: "facebook.com", percent: 2, time: "0:20", color: "bg-orange-400", isUrl: true },
        { name: "Terminal", percent: 2, time: "0:20", color: "bg-[#2b90ff]" },
      ],
      classification: {
        core: 34,
        nonCore: 56,
        unproductive: 10
      },
      breakdownHtml: (
        <>
          <p className="text-[10.5px] text-slate-300 mb-2 leading-relaxed font-normal">
             Classifies tracked hours based on application type (e.g., core productive tools vs. personal websites).
          </p>
          <div className="border-t border-slate-700/60 pt-2 space-y-1">
             <div className="font-bold">Slack: 61%</div>
             <div className="mb-1">Figma: 22%</div>
             <div className="mb-1">VS Code: 8%</div>
             <div className="mb-1">facebook.com: 2%</div>
             <div>Terminal: 2%</div>
          </div>
        </>
      )
    },
    "Jane Smith": {
      averageActivity: 78,
      industryCompareText: "Other Industry average range: 46% - 60%",
      industryCompareLeft: "78%",
      apps: [
        { name: "Figma", percent: 55, time: "3:12", color: "bg-[#2b90ff]" },
        { name: "VS Code", percent: 25, time: "1:20", color: "bg-[#2b90ff]" },
        { name: "Notion", percent: 12, time: "0:40", color: "bg-slate-500" },
        { name: "youtube.com", percent: 5, time: "0:15", color: "bg-orange-400", isUrl: true },
        { name: "Slack", percent: 3, time: "0:10", color: "bg-slate-500" },
      ],
      classification: {
        core: 75,
        nonCore: 20,
        unproductive: 5
      },
      breakdownHtml: (
        <>
          <p className="text-[10.5px] text-slate-300 mb-2 leading-relaxed font-normal">
             Classifies tracked hours based on application type (e.g., core productive tools vs. personal websites).
          </p>
          <div className="border-t border-slate-700/60 pt-2 space-y-1">
             <div className="font-bold">Figma: 55%</div>
             <div className="mb-1">VS Code: 25%</div>
             <div className="mb-1">Notion: 12%</div>
             <div className="mb-1">youtube.com: 5%</div>
             <div>Slack: 3%</div>
          </div>
        </>
      )
    }
  }), []);

  const currentInsight = employeeInsightData[selectedInsightEmployee] || employeeInsightData["John Doe"];

  // Step 9 State (Reports)
  const [addedReports, setAddedReports] = useState<string[]>([]);
  const toggleReport = (report: string) => setAddedReports(prev => prev.includes(report) ? prev.filter(r => r !== report) : [...prev, report]);

  const toggleGoal = (id: string) => {
    setSelectedGoals(prev => 
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 10));
  const prevStep = () => setStep(s => Math.max(s - 1, 0));

  // Determine sidebar items based on selection (for Step 3)
  const getSidebarSections = () => {
    const sections = [];
    if (selectedGoals.length === 0 || selectedGoals.includes("explore")) {
       sections.push({ title: "Overview", icon: PieChart, items: ["Dashboard", "Getting Started"] });
    }
    if (selectedGoals.includes("monitor")) {
      sections.push({ title: "Activity", icon: Activity, items: ["Screenshots", "Apps & URLs", "Timeline"] });
      sections.push({ title: "Insights", icon: PieChart, items: ["Unusual activity", "Smart notifications"] });
    }
    if (selectedGoals.includes("schedules")) {
      sections.push({ title: "HR / Attendance", icon: CalendarDays, items: ["Schedules", "Time off requests", "Shifts"] });
    }
    if (selectedGoals.includes("crm")) {
      sections.push({ title: "CRM", icon: Target, items: ["Leads", "Deals", "Invoices"] });
    }
    if (selectedGoals.includes("pay")) {
      sections.push({ title: "Financials", icon: DollarSign, items: ["Manage payroll", "Create payments", "Invoices"] });
    }
    if (selectedGoals.includes("projects")) {
      sections.push({ title: "Projects", icon: ListTodo, items: ["Tasks", "Budgets", "Cost Tracking"] });
    }
    return sections;
  };

  // -------------------------------------------------------------
  // REUSABLE UI MACROS
  // -------------------------------------------------------------
  const renderDesktopMockup = () => (
    <div className="bg-white w-full max-w-[700px] h-[380px] flex overflow-hidden w-full h-full">
      {/* Sidebar */}
      <div className="w-[180px] bg-[#f8fafc] border-r border-slate-200 flex flex-col p-4 shrink-0">
         <div className="flex items-center gap-2 mb-8">
            <img src="/logo.png" alt="Logo" className="size-6 rounded object-contain bg-white" />
            <div className="text-[12px] font-bold text-slate-900 leading-tight truncate">{orgName || 'Kaayf'}<br/><span className="text-[9px] text-blue-500 font-normal">TRAC DIARY</span></div>
         </div>
         <div className="text-[9px] font-bold text-slate-400 mb-3 uppercase">Timer is off</div>
         <div className="flex items-center justify-between mb-6">
            <div className="font-mono text-[14px] font-bold text-slate-800">0h 00m</div>
            <Coffee size={12} className="text-slate-400" />
         </div>
         <div className="flex flex-col gap-1.5">
            <div className="bg-blue-50 text-blue-600 rounded-md py-1.5 px-3 flex items-center gap-2 text-[11px] font-bold border border-blue-100"><Layers size={12} /> Dashboard</div>
            <div className="text-slate-500 rounded-md py-1.5 px-3 flex items-center gap-2 text-[11px] font-medium"><Calendar size={12} /> Timesheets</div>
            <div className="text-slate-500 rounded-md py-1.5 px-3 flex items-center gap-2 text-[11px] font-medium"><Clock size={12} /> Your Shifts</div>
         </div>
      </div>
      {/* Main Content */}
      <div className="flex-1 bg-white flex flex-col">
         {/* Top Timer Bar */}
         <div className="h-16 border-b border-slate-100 flex items-center px-6 gap-4 shrink-0 bg-slate-50/50">
            <Clock size={14} className="text-slate-400" />
            <div className="flex-1 text-[13px] text-slate-400">What are you working on?</div>
            <div className="font-mono font-bold text-[16px] text-slate-800">00:00</div>
            <div className="size-10 bg-blue-500 rounded-full flex items-center justify-center shadow-md shadow-blue-200 ml-2">
               <Play size={16} fill="white" className="text-white ml-1" />
            </div>
         </div>
         {/* Dashboard Content */}
         <div className="p-5 flex-1 bg-[#fafafa] flex gap-4 overflow-hidden">
            {/* Left Card: Last 7 Days */}
            <div className="flex-1 bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col">
               <div className="text-[10px] font-bold text-slate-500 mb-4 flex items-center gap-1.5"><Calendar size={12} /> LAST 7 DAYS (TRACKED)</div>
               <div className="flex justify-between items-center text-[11px] mb-3"><span className="text-slate-700 font-medium">Today</span><span className="text-slate-400 font-mono">0h 00m</span></div>
               <div className="flex justify-between items-center text-[11px] mb-3"><span className="text-slate-700 font-medium">Yesterday</span><span className="text-slate-400 font-mono">0h 00m</span></div>
               <div className="flex justify-between items-center text-[11px]"><span className="text-slate-700 font-medium">2 days ago</span><span className="text-slate-400 font-mono">0h 01m</span></div>
            </div>
            {/* Right Stack */}
            <div className="flex-1 flex flex-col gap-4">
               {/* Activity Graph Card */}
               <div className="flex-1 bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col">
                  <div className="text-[10px] font-bold text-slate-500 mb-2 flex items-center gap-1.5"><Activity size={12} /> ACTIVITY GRAPH</div>
                  <div className="flex-1 flex items-end gap-1.5 justify-center mt-2">
                     <div className="w-2 h-2/3 bg-slate-100 rounded-full" />
                     <div className="w-2 h-1/2 bg-slate-100 rounded-full" />
                     <div className="w-2 h-3/4 bg-green-200 rounded-full" />
                     <div className="w-2 h-full bg-blue-500 rounded-full shadow-sm" />
                  </div>
               </div>
               {/* Support Card */}
               <div className="h-20 bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-center justify-center flex-col text-center">
                  <MessageSquare size={14} className="text-blue-400 mb-1" />
                  <div className="text-[11px] font-bold text-slate-700">Support & Team Chat</div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );

  // -------------------------------------------------------------
  // RENDER: WELCOME STEP (0)
  // -------------------------------------------------------------
  if (step === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-white font-sans">
        <div className="max-w-2xl text-center z-10 px-4 mt-10">
          <h1 className="text-[36px] font-extrabold text-slate-900 mb-4 tracking-tight">Welcome to Trac!</h1>
          <p className="text-slate-500 mb-8 text-[15px] leading-relaxed max-w-xl mx-auto">
            It looks like you're new to Trac. There aren't pending invitations for your email. 
            If your team isn't on Trac yet you can create an organization for them.
          </p>
          <Button onClick={nextStep} className="bg-[#2b90ff] hover:bg-[#1a80ef] text-white px-10 py-6 rounded-lg font-bold text-[15px] shadow-sm mb-16">
            Create organization
          </Button>
          
          {/* Illustration Area */}
          <div className="flex justify-center mb-16 relative h-48 w-full max-w-md mx-auto">
             {/* Center dashboard */}
             <div className="absolute inset-0 bg-slate-50 border-[1.5px] border-slate-200 rounded-xl shadow-md overflow-hidden flex flex-col z-10">
                {/* Window header */}
                <div className="h-6 bg-slate-700 flex items-center px-2 gap-1.5">
                   <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                   <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                   <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="flex flex-1 p-4 gap-4 items-center justify-center">
                    <BarChart2 className="w-24 h-24 text-blue-300" strokeWidth={1} />
                </div>
             </div>
             {/* Floating elements */}
             <div className="absolute -left-12 bottom-6 w-32 h-20 bg-white border border-slate-100 shadow-lg rounded-lg z-20 flex items-center justify-center">
                <div className="flex gap-2">
                   <div className="w-8 h-8 rounded-full bg-blue-100" />
                   <div className="space-y-1 py-1">
                     <div className="h-2 w-12 bg-slate-200 rounded-full" />
                     <div className="h-2 w-8 bg-slate-200 rounded-full" />
                   </div>
                </div>
             </div>
             <div className="absolute -right-8 top-8 w-24 h-28 bg-white border border-slate-100 shadow-lg rounded-lg z-20 flex flex-col p-3 gap-2">
                 <div className="h-2 w-full bg-slate-100 rounded-full" />
                 <div className="h-2 w-full bg-slate-100 rounded-full" />
                 <div className="h-2 w-3/4 bg-slate-100 rounded-full" />
                 <div className="mt-auto self-end size-6 rounded-full bg-blue-500 flex items-center justify-center text-white"><Check size={12}/></div>
             </div>
          </div>

        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // REUSABLE COMPONENTS
  // -------------------------------------------------------------
  const ProgressBar = ({ current }: { current: number }) => (
    <div className="flex justify-center gap-3 mb-12">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className={cn("h-[5px] w-12 rounded-full", i <= current ? "bg-blue-600" : "bg-gray-200")} />
      ))}
    </div>
  );

  const PreviewWrapper = ({ children, sidebar }: { children: React.ReactNode, sidebar?: React.ReactNode }) => (
    <div className="border border-gray-200 rounded-[1.5rem] overflow-hidden bg-white shadow-sm flex h-[420px] max-w-4xl mx-auto relative">
      {/* Left Sidebar Mock */}
      {sidebar ? sidebar : (
        <div className="w-[200px] border-r border-gray-100 flex flex-col bg-white shrink-0 py-4 opacity-50">
         <div className="flex items-center gap-2.5 px-6 mb-8 mt-2">
            <img src="/special-triangle-black.svg" alt="Trac Logo" className="h-7 w-7 shrink-0" />
            <div className="flex flex-col">
              <span className="font-extrabold text-slate-900 leading-none tracking-tight text-[15px]">Trac AI</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">EMS</span>
            </div>
         </div>
         {/* Sidebar Skeleton items */}
         <div className="flex flex-col gap-6 px-5 flex-1 overflow-hidden">
           {[1,2,3].map(s => (
             <div key={s} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="size-3.5 rounded bg-slate-200" />
                  <div className="h-2 w-16 bg-slate-200 rounded" />
                </div>
                {[1,2].map(i => (
                  <div key={i} className="pl-6 py-1">
                     <div className="h-1.5 w-20 bg-slate-100 rounded" />
                  </div>
                ))}
             </div>
           ))}
         </div>
      </div>
      )}
      
      {/* Main Content Area Mock */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50 relative">
        <div className="h-12 border-b border-gray-100 bg-white flex items-center px-6 shrink-0 opacity-50">
           {/* Top Nav Mock */}
           <div className="h-2.5 w-32 bg-gray-100 rounded-md" />
           <div className="ml-auto flex items-center gap-4">
              <div className="relative">
                 <Bell className="size-5 text-gray-400" />
                 <div className="absolute -top-1 -right-1 size-3.5 bg-red-500 rounded-full flex items-center justify-center text-[9px] text-white font-bold border-2 border-white">3</div>
              </div>
              <img src="https://api.dicebear.com/7.x/bottts-neutral/svg?seed=trac%20ai" alt="User Avatar" className="size-7 rounded-full border border-gray-200 bg-gray-50" />
           </div>
        </div>
        <div className="flex flex-1 overflow-hidden relative">
          {children}
        </div>
      </div>
    </div>
  );

  // -------------------------------------------------------------
  // RENDER: MAIN WIZARD LAYOUT
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <div className="w-full max-w-5xl mx-auto pt-10 pb-6 px-4">
        
        {step < 5 && <ProgressBar current={step} />}

        {/* STEP 1: CREATE ORG */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="text-center mb-12">
              <h1 className="text-[32px] font-extrabold text-slate-900 mb-3 tracking-tight">Create your organization</h1>
              <p className="text-slate-500 text-[15px]">This is how your workspace will display to your team.</p>
            </div>

            <div className="max-w-3xl mx-auto mb-16 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[14px] font-bold text-slate-800">Organization name*</label>
                  <Input 
                    value={orgName} 
                    onChange={e => setOrgName(e.target.value)} 
                    className="h-12 rounded-lg border-gray-300 focus-visible:ring-blue-500 bg-white" 
                    placeholder="Kaif's Organization"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[14px] font-bold text-slate-800">Website</label>
                  <Input 
                    value={website} 
                    onChange={e => setWebsite(e.target.value)} 
                    className="h-12 rounded-lg border-gray-300 focus-visible:ring-blue-500 bg-white" 
                    placeholder="Enter company website (optional)"
                  />
                </div>
                
                <div className="space-y-3">
                  <label className="text-[14px] font-bold text-slate-800">Estimated value of a customer</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</div>
                    <Input 
                      value={customerValue} 
                      onChange={e => setCustomerValue(e.target.value.replace(/[^0-9.]/g, ''))} 
                      className="pl-8 h-12 rounded-lg border-gray-300 focus-visible:ring-blue-500 bg-white" 
                      placeholder="e.g. 5000"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[14px] font-bold text-slate-800">Average employee salary</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</div>
                    <Input 
                      value={avgSalary} 
                      onChange={e => setAvgSalary(e.target.value.replace(/[^0-9.]/g, ''))} 
                      className="pl-8 h-12 rounded-lg border-gray-300 focus-visible:ring-blue-500 bg-white" 
                      placeholder="e.g. 60000"
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <label className="text-[14px] font-bold text-slate-800">Company Logo</label>
                  <div 
                     className={cn("border-2 border-dashed rounded-xl p-4 flex items-center justify-center gap-4 hover:bg-slate-50 cursor-pointer transition-colors h-[88px]", isDragging ? "border-blue-500 bg-blue-50" : "border-gray-200")}
                     onDragOver={handleDragOver}
                     onDragLeave={handleDragLeave}
                     onDrop={handleDrop}
                     onClick={() => fileInputRef.current?.click()}
                  >
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/png, image/jpeg" onChange={handleFileChange} />
                      <div className="size-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                         {logoFile ? <Check size={20} /> : <Folder size={20} />}
                      </div>
                      <div className="flex-1 overflow-hidden">
                         <div className="text-[13px] font-bold text-slate-800 truncate">{logoFile ? logoFile.name : 'Upload Logo'}</div>
                         <div className="text-[11px] text-slate-500">{logoFile ? 'File selected' : 'PNG, JPG up to 5MB'}</div>
                      </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[14px] font-bold text-slate-800 block text-center md:text-left">How big is your team?</label>
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    {TEAM_SIZES.map(size => (
                       <button
                         key={size}
                         onClick={() => setTeamSize(size)}
                         className={cn(
                           "px-4 py-2 rounded-full border text-[12px] font-bold transition-all",
                           teamSize === size 
                             ? "border-blue-500 text-blue-600 bg-blue-50 ring-1 ring-blue-500" 
                             : "border-gray-200 text-slate-600 hover:border-gray-300 hover:bg-slate-50"
                         )}
                       >
                         {size}
                       </button>
                    ))}
                  </div>
                </div>

                 <div className="space-y-3">
                   <label className="text-[14px] font-bold text-slate-800">WhatsApp Number*</label>
                   <Input 
                     value={whatsapp} 
                     onChange={e => setWhatsapp(e.target.value.replace(/[^0-9+]/g, ''))} 
                     className="h-12 rounded-lg border-gray-300 focus-visible:ring-blue-500 bg-white" 
                     placeholder="e.g. +15550199"
                   />
                 </div>

                 <div className="space-y-3">
                    <label className="text-[14px] font-bold text-slate-800">Workspace Timezone</label>
                    <select
                       value={timezone}
                       onChange={e => setTimezone(e.target.value)}
                       className="w-full h-12 border border-gray-300 rounded-lg px-3 text-[14px] focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm font-medium text-slate-700 outline-none"
                    >
                       {COMMON_TIMEZONES.map(tz => (
                          <option key={tz} value={tz}>{tz.replace('_', ' ').replace('/', ' / ')}</option>
                       ))}
                    </select>
                 </div>

                 <div className="space-y-3">
                    <label className="text-[14px] font-bold text-slate-800">Standard Workday (Shift Length)</label>
                    <div className="grid grid-cols-5 gap-2">
                       {["4h", "6h", "8h", "9h", "10h"].map(length => (
                          <button
                             key={length}
                             onClick={() => setShiftLength(length)}
                             type="button"
                             className={cn(
                                "py-2.5 rounded-lg border text-[12px] font-bold transition-all",
                                shiftLength === length
                                   ? "border-blue-500 text-blue-600 bg-blue-50 ring-1 ring-blue-500"
                                   : "border-gray-200 text-slate-600 hover:border-gray-300 hover:bg-slate-50"
                             )}
                          >
                             {length}
                          </button>
                       ))}
                    </div>
                 </div>

                 <div className="space-y-3">
                    <label className="text-[14px] font-bold text-slate-800">Weekly Schedule (Workdays)</label>
                    <div className="flex justify-between gap-1">
                       {[
                          { id: 1, label: "Mon" },
                          { id: 2, label: "Tue" },
                          { id: 3, label: "Wed" },
                          { id: 4, label: "Thu" },
                          { id: 5, label: "Fri" },
                          { id: 6, label: "Sat" },
                          { id: 0, label: "Sun" }
                       ].map(day => (
                          <button
                             key={day.id}
                             type="button"
                             onClick={() => {
                                const newWorkdays = workdays.includes(day.id)
                                   ? workdays.filter(id => id !== day.id)
                                   : [...workdays, day.id].sort();
                                setWorkdays(newWorkdays);
                             }}
                             className={cn(
                                "flex-1 py-3 rounded-lg border text-[10px] font-bold transition-all text-center",
                                workdays.includes(day.id)
                                   ? "border-blue-500 bg-blue-50 text-blue-600 ring-1 ring-blue-500"
                                   : "border-gray-200 bg-white text-slate-400 hover:bg-slate-50"
                             )}
                          >
                             {day.label}
                          </button>
                       ))}
                    </div>
                 </div>
              </div>
            </div>

            <PreviewWrapper>

               <div className="flex-1 p-8 bg-slate-50/50 flex flex-col gap-8 opacity-40">
                  <div className="flex gap-6">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="flex items-center gap-3"><div className="size-6 bg-gray-200 rounded-full"/><div className="h-2 w-16 bg-gray-200 rounded-full"/></div>
                    ))}
                  </div>
                  <div className="flex gap-6 flex-1">
                    <div className="flex-1 border border-gray-100 rounded-2xl p-6 bg-white flex flex-col gap-8"><div className="size-24 rounded-full border-[12px] border-gray-100 m-auto" /></div>
                    <div className="flex-1 border border-gray-100 rounded-2xl p-6 bg-white flex flex-col gap-4">
                       <div className="h-2 bg-gray-200 rounded-full w-full" />
                       <div className="h-2 bg-gray-200 rounded-full w-4/5" />
                       <div className="h-2 bg-gray-200 rounded-full w-3/4" />
                    </div>
                  </div>
               </div>
            </PreviewWrapper>
          </motion.div>
        )}

        {/* STEP 2: TRACKING MODE */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="text-center mb-12">
              <h1 className="text-[32px] font-extrabold text-slate-900 mb-3 tracking-tight">How do you want your team to track time?</h1>
              <p className="text-slate-500 text-[15px]">Trac supports multiple ways to track time. You can change this for your org or for individuals in your org settings.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-16 max-w-4xl mx-auto">
               {TRACKING_MODES.map((mode) => {
                 const isSelected = trackingMode === mode.id;
                 const Icon = mode.icon;
                 return (
                   <div 
                     key={mode.id}
                     onClick={() => setTrackingMode(mode.id)}
                     className={cn(
                       "relative p-6 rounded-[1.25rem] border-[1.5px] cursor-pointer transition-all duration-200 flex flex-col gap-4 bg-white",
                       isSelected ? "border-blue-600 ring-1 ring-blue-600 shadow-sm" : "border-gray-200 hover:border-gray-300"
                     )}
                   >
                     {mode.badge && (
                        <div className="absolute -top-3 left-[15%] bg-purple-50 text-[#8a3ffc] px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 border border-purple-100 z-10">
                          <Settings size={12} className="text-[#8a3ffc]" />
                          {mode.badge}
                        </div>
                     )}
                     <div className="flex items-start justify-between">
                         <div className="flex items-center gap-3">
                             <div className="text-slate-700"><Icon strokeWidth={2} size={20} /></div>
                             <h3 className="font-bold text-slate-900 text-[15px]">{mode.title}</h3>
                         </div>
                         <div className={cn(
                             "size-4 rounded-full border flex items-center justify-center transition-colors shrink-0",
                             isSelected ? "border-blue-600 border-4" : "border-gray-300"
                         )} />
                     </div>
                     <p className="text-[13px] text-slate-500 leading-relaxed">{mode.desc}</p>
                   </div>
                 )
               })}
            </div>
            <div className="flex flex-col items-center justify-center max-w-4xl mx-auto relative pt-4 pb-12 w-full">
                  {/* Dynamic Overlays based on Tracking Mode */}
                  {trackingMode === 'desktop' && (
                     <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="z-10 bg-white rounded-xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-slate-200 w-full max-w-[700px] h-[380px] flex overflow-hidden">
                        {renderDesktopMockup()}
                     </motion.div>
                  )}

                  {trackingMode === 'chrome' && (
                     <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="z-10 bg-white rounded-xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-slate-200 w-full max-w-[700px] h-[380px] flex flex-col overflow-hidden">
                        {/* Browser Header */}
                        <div className="h-12 bg-[#f1f3f4] flex items-center px-4 gap-3 border-b border-slate-200 shrink-0">
                           <div className="flex gap-2 mr-2">
                             <div className="size-3.5 rounded-full bg-[#ff5f56]" />
                             <div className="size-3.5 rounded-full bg-[#ffbd2e]" />
                             <div className="size-3.5 rounded-full bg-[#27c93f]" />
                           </div>
                           <div className="flex gap-2 text-slate-400">
                               <ChevronLeft size={20} />
                               <ChevronRight size={20} />
                               <div className="ml-2 size-5 rounded-full border-2 border-slate-400 flex items-center justify-center"><div className="size-2 bg-slate-400 rounded-full" /></div>
                           </div>
                           <div className="flex-1 bg-white h-8 rounded-full border border-slate-200 flex items-center px-4 shadow-sm mx-2">
                              <Globe size={14} className="text-slate-400 mr-2" />
                              <div className="h-2 w-32 bg-slate-200 rounded-full" />
                           </div>
                           {/* Extension popup button */}
                           <div className="size-8 bg-blue-100 rounded-full flex items-center justify-center shadow-inner ml-2 relative">
                              <Clock size={16} className="text-blue-600" />
                              <div className="absolute -top-1 -right-1 size-3 bg-red-500 rounded-full border-2 border-white" />
                           </div>
                        </div>
                        {/* Fake Browser Content */}
                        <div className="p-4 flex-1 bg-white relative overflow-hidden flex flex-col">
                           {/* Main page content skeleton */}
                           <div className="h-8 w-48 bg-slate-100 rounded mb-6 mt-4 mx-8" />
                           <div className="h-32 bg-slate-50 rounded-xl mx-8 border border-slate-100 flex items-center justify-center">
                               <div className="text-slate-300 flex items-center gap-2"><Globe size={24} /> <span>Your website content</span></div>
                           </div>

                           {/* Extension Dropdown */}
                           <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute top-2 right-4 w-64 bg-white border border-slate-200 shadow-2xl rounded-2xl flex flex-col overflow-hidden z-20">
                              <div className="p-5 border-b border-slate-100 flex flex-col items-center">
                                 <div className="text-slate-500 text-[13px] font-medium mb-1">Budget review</div>
                                 <div className="text-[32px] font-mono font-black text-slate-800 tracking-tight">01:23:45</div>
                                 <div className="text-blue-600 font-bold text-[12px] mt-1 bg-blue-50 px-2 py-0.5 rounded">Product design</div>
                              </div>
                              <div className="p-4 bg-slate-50 flex justify-center">
                                 <div className="size-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 cursor-pointer transition-transform hover:scale-105">
                                    <div className="size-4 bg-white rounded-sm" />
                                 </div>
                              </div>
                           </motion.div>
                        </div>
                     </motion.div>
                  )}

                  {trackingMode === 'mobile' && (
                     <div className="relative w-full max-w-[700px] h-[400px] flex items-center justify-center">
                        {/* Trac Desktop Window Background (Faded/Out of focus) */}
                        <div className="absolute left-12 top-2 w-[700px] h-[380px] bg-white rounded-xl shadow-lg border border-slate-200 flex overflow-hidden opacity-30 blur-[2px] scale-[0.8] origin-left pointer-events-none">
                           {renderDesktopMockup()}
                        </div>

                        {/* Mobile Phone foreground */}
                        <motion.div initial={{ y: 20, x: 20, opacity: 0 }} animate={{ y: 0, x: 0, opacity: 1 }} className="absolute right-12 bottom-0 z-20 bg-slate-900 rounded-[2.5rem] p-2 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.3)] h-[380px] w-[190px] flex flex-col relative border-4 border-slate-800">
                           <div className="absolute top-1 left-1/2 -translate-x-1/2 w-12 h-4 bg-black rounded-b-xl z-30" />
                           <div className="bg-white rounded-[1.8rem] flex-1 flex flex-col relative overflow-hidden">
                              <div className="h-10 w-full flex items-center justify-center mt-2">
                                  <span className="font-bold text-[14px]">Timer</span>
                              </div>
                              <div className="flex-1 flex flex-col items-center justify-center p-4">
                                  <div className="text-[10px] text-slate-400 font-medium mb-1">Limit 0 / 45 hrs</div>
                                  <div className="text-[28px] font-mono font-black text-slate-900 tracking-tighter mb-1">00:00:00</div>
                                  <div className="text-blue-600 font-bold text-[11px] mb-1">Product design</div>
                                  <div className="text-slate-500 text-[10px] mb-8">Mobile app redesign</div>
                                  
                                  {/* Play button */}
                                  <div className="size-16 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg mb-8 relative">
                                      <Play size={20} fill="white" className="ml-1" />
                                      {/* decorative circle around it */}
                                      <div className="absolute inset-[-15px] border-2 border-blue-100 rounded-full border-t-blue-600 rotate-45" />
                                  </div>
                              </div>
                              <div className="h-[80px] bg-blue-50/50 border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] flex flex-col items-center justify-center relative">
                                 <div className="absolute -top-6 bg-white size-12 rounded-full border border-slate-100 flex items-center justify-center shadow-md">
                                     <Fingerprint size={24} className="text-blue-600" />
                                 </div>
                                 <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wide mt-4">Biometric Scan</h4>
                              </div>
                           </div>
                        </motion.div>
                     </div>
                  )}

                  {trackingMode === 'silent' && (
                     <div className="z-10 relative w-full max-w-[700px] h-[380px] flex items-center justify-center mt-8">
                         {/* Back window 2 */}
                         <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: -40, opacity: 1 }} className="absolute w-[620px] h-[380px] bg-white rounded-xl shadow-sm border border-slate-200 flex justify-center z-0">
                            <div className="w-full h-10 border-b border-slate-100 flex items-center px-4 shrink-0 bg-[#fbfbfb] rounded-t-xl">
                                <div className="flex gap-1.5 opacity-50"><div className="size-3 rounded-full bg-[#ff5f56]"/><div className="size-3 rounded-full bg-[#ffbd2e]"/><div className="size-3 rounded-full bg-[#27c93f]"/></div>
                            </div>
                         </motion.div>
                         
                         {/* Back window 1 */}
                         <motion.div initial={{ y: -15, opacity: 0 }} animate={{ y: -20, opacity: 1 }} className="absolute w-[660px] h-[380px] bg-white rounded-xl shadow-md border border-slate-200 flex justify-center z-10">
                            <div className="w-full h-10 border-b border-slate-100 flex items-center px-4 shrink-0 bg-[#fbfbfb] rounded-t-xl">
                                <div className="flex gap-1.5 opacity-70"><div className="size-3 rounded-full bg-[#ff5f56]"/><div className="size-3 rounded-full bg-[#ffbd2e]"/><div className="size-3 rounded-full bg-[#27c93f]"/></div>
                            </div>
                         </motion.div>
                         
                         {/* Front Overlay Window */}
                         <motion.div initial={{ y: 0, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="z-20 w-full max-w-[700px] h-[380px] bg-white rounded-xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-slate-200 flex flex-col overflow-hidden relative">
                             {/* Mac header for the front window */}
                             <div className="h-10 border-b border-slate-100 flex items-center px-4 shrink-0 bg-[#fbfbfb]">
                                <div className="flex gap-1.5"><div className="size-3 rounded-full bg-[#ff5f56]"/><div className="size-3 rounded-full bg-[#ffbd2e]"/><div className="size-3 rounded-full bg-[#27c93f]"/></div>
                             </div>
                             <div className="flex-1 flex overflow-hidden">
                                 {renderDesktopMockup()}
                             </div>
                         </motion.div>
                     </div>
                  )}
            </div>
          </motion.div>
        )}

        {/* STEP 3: GOALS (Originally Step 1 in previous prompt) */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="text-center mb-12">
              <h1 className="text-[32px] font-extrabold text-slate-900 mb-3 tracking-tight">What are your goals?</h1>
              <p className="text-slate-500 max-w-2xl mx-auto text-[15px]">
                Please select from the options below that best describe what you're looking for. This will help customize your initial experience using Trac.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-16 relative">
              {GOALS.map((goal) => {
                const isSelected = selectedGoals.includes(goal.id);
                const Icon = goal.icon;
                
                return (
                  <div 
                    key={goal.id}
                    onClick={() => toggleGoal(goal.id)}
                    className={cn(
                      "relative p-6 rounded-[1.25rem] border-[1.5px] cursor-pointer transition-all duration-200 flex flex-col gap-4 bg-white",
                      isSelected ? "border-blue-600 ring-1 ring-blue-600 shadow-sm" : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    {goal.badge && (
                      <div className="absolute -top-3 left-[15%] bg-purple-50 text-[#8a3ffc] px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 border border-purple-100 z-10">
                        <Settings size={12} className="text-[#8a3ffc]" />
                        {goal.badge}
                      </div>
                    )}
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="text-slate-700"><Icon strokeWidth={2} size={22} /></div>
                            <h3 className="font-bold text-slate-900 text-[15px]">{goal.title}</h3>
                        </div>
                        <div className={cn(
                            "size-4 rounded-sm border flex items-center justify-center transition-colors shrink-0 mt-0.5",
                            isSelected ? "bg-blue-600 border-blue-600" : "border-gray-300"
                        )}>
                            {isSelected && <Check size={12} strokeWidth={3} className="text-white" />}
                        </div>
                    </div>
                    <p className="text-[13px] text-slate-500 leading-relaxed pl-8">{goal.description}</p>
                  </div>
                );
              })}
            </div>

            <PreviewWrapper sidebar={
              <div className="w-[240px] border-r border-gray-100 bg-white py-4 flex flex-col shrink-0 overflow-hidden">
                 <div className="flex items-center gap-2.5 px-6 mb-8 mt-2 shrink-0">
                    <img src="/logo.png" alt="Trac Logo" className="size-6 rounded object-contain bg-white" />
                    <div className="flex flex-col">
                      <span className="font-extrabold text-slate-900 leading-none tracking-tight text-[15px]">{orgName || 'Trac AI'}</span>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">EMS</span>
                    </div>
                 </div>
                 <div className="overflow-y-auto custom-scrollbar flex flex-col gap-6 px-5 pb-4 flex-1">
                    <AnimatePresence>
                      {getSidebarSections().map((section, idx) => (
                        <motion.div 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                          transition={{ duration: 0.2, delay: idx * 0.05 }}
                          key={section.title} 
                        >
                          <div className="flex items-center gap-2.5 mb-3 px-2">
                            <section.icon size={18} className="text-blue-600" />
                            <h4 className="font-bold text-[13px] text-slate-800">{section.title}</h4>
                          </div>
                          <ul className="space-y-1">
                            {section.items.map((item, itemIdx) => (
                              <li key={itemIdx} className="px-2 pl-9 py-1.5 text-[13px] text-slate-500 font-medium cursor-default">
                                {item}
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                 </div>
              </div>
            }>
              <div className="flex-1 p-8 bg-slate-50/50 flex flex-col gap-8 overflow-hidden">
                <div className="flex gap-6">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex items-center gap-3">
                        <div className="size-6 bg-gray-200 rounded-full" />
                        <div className="h-2 w-16 bg-gray-200 rounded-full" />
                    </div>
                  ))}
                </div>
                <div className="flex gap-6 flex-1">
                  <div className="flex-1 border border-gray-100 rounded-2xl p-6 bg-white flex flex-col gap-8 shadow-sm">
                     <div className="flex gap-8 items-center h-full">
                         <div className="flex-1 space-y-5">
                             <div className="h-2.5 bg-gray-200 rounded-full w-full" />
                             <div className="h-2.5 bg-gray-200 rounded-full w-4/5" />
                             <div className="h-2.5 bg-gray-200 rounded-full w-3/4" />
                             <div className="h-2.5 bg-gray-200 rounded-full w-5/6" />
                         </div>
                         <div className="size-24 rounded-full border-[12px] border-gray-100 border-r-[#ffdfdf] border-t-[#ffdfdf]" />
                     </div>
                  </div>
                  <div className="flex-1 border border-gray-100 rounded-2xl p-6 bg-white flex flex-col justify-between shadow-sm">
                     <div className="space-y-6">
                         <div className="h-2.5 bg-gray-200 rounded-full w-1/3 mb-4" />
                         <div className="flex items-center gap-4">
                            <div className="h-2.5 bg-gray-200 rounded-full w-full" />
                            <div className="size-2.5 rounded-full bg-slate-700 shrink-0" />
                         </div>
                         <div className="flex items-center gap-4">
                            <div className="h-2.5 bg-gray-200 rounded-full w-4/5" />
                            <div className="size-2.5 rounded-full bg-pink-400 shrink-0" />
                         </div>
                         <div className="flex items-center gap-4">
                            <div className="h-2.5 bg-gray-200 rounded-full w-5/6" />
                            <div className="size-2.5 rounded-full bg-blue-300 shrink-0" />
                         </div>
                     </div>
                     <div className="mt-8 h-4 w-full bg-gray-100 rounded-full overflow-hidden flex">
                         <div className="w-[60%] h-full bg-[#8fb6e7]" />
                         <div className="w-[25%] h-full bg-[#52647c]" />
                         <div className="w-[15%] h-full bg-[#f8c5c5]" />
                     </div>
                  </div>
                </div>
              </div>
            </PreviewWrapper>
          </motion.div>
        )}

        {/* STEP 4: INVITE TEAM */}
        {step === 4 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="text-center mb-12">
              <h1 className="text-[32px] font-extrabold text-slate-900 mb-3 tracking-tight">Invite your team</h1>
              <p className="text-slate-500 max-w-2xl mx-auto text-[15px]">
                Accelerate your setup by inviting your first manager or employee. You can always change permissions later.
              </p>
            </div>

            <div className="max-w-2xl mx-auto mb-16 space-y-6">
               {/* Manager Link */}
               <div className="bg-white border border-gray-200 rounded-[1.25rem] p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                     <h3 className="font-bold text-slate-800 text-[14px] flex items-center gap-2">
                        <Users size={18} className="text-blue-600" /> Invite Managers
                     </h3>
                     <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">Full Access</span>
                  </div>
                  <div className="flex gap-3">
                     <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl flex items-center px-4 overflow-hidden">
                        <span className="text-[13px] text-slate-500 truncate font-mono">https://trac.app/invite/manager/xk92-m29a</span>
                     </div>
                     <Button 
                       onClick={() => copyLink('manager')}
                       variant="outline" 
                       className="shrink-0 h-12 w-28 font-bold border-gray-200 rounded-xl text-[13px]"
                     >
                       {copiedLink === 'manager' ? <Check size={16} className="text-emerald-500" /> : "Copy Link"}
                     </Button>
                  </div>
               </div>

               {/* Employee Link */}
               <div className="bg-white border border-gray-200 rounded-[1.25rem] p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                     <h3 className="font-bold text-slate-800 text-[14px] flex items-center gap-2">
                        <Monitor size={18} className="text-blue-600" /> Invite Employees (Trac Diary)
                     </h3>
                     <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">Limited Access</span>
                  </div>
                  <div className="flex gap-3">
                     <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl flex items-center px-4 overflow-hidden">
                        <span className="text-[13px] text-slate-500 truncate font-mono">https://heytracai.com/trac-diary</span>
                     </div>
                     <Button 
                       onClick={() => copyLink('employee')}
                       variant="outline" 
                       className="shrink-0 h-12 w-28 font-bold border-gray-200 rounded-xl text-[13px]"
                     >
                       {copiedLink === 'employee' ? <Check size={16} className="text-emerald-500" /> : "Copy Link"}
                     </Button>
                  </div>
               </div>

               {/* Dummy Data Toggle */}
               <div className="flex items-center justify-between p-5 border border-gray-200 rounded-[1.25rem] bg-slate-50/50 mt-8">
                  <div>
                    <h4 className="font-bold text-slate-800 text-[14px]">Continue with dummy data</h4>
                    <p className="text-[12px] text-slate-500 mt-1">Pre-fill your dashboard with sample activity to explore features.</p>
                  </div>
                  <button 
                    onClick={() => setEnableDummyData(!enableDummyData)}
                    className={cn(
                      "w-12 h-6 rounded-full transition-colors relative shrink-0",
                      enableDummyData ? "bg-blue-600" : "bg-slate-300"
                    )}
                  >
                     <div className={cn(
                       "size-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm",
                       enableDummyData ? "left-[2px]" : "left-[2px]"
                     )} style={{ transform: enableDummyData ? 'translateX(24px)' : 'translateX(0px)' }} />
                  </button>
               </div>
            </div>

            <PreviewWrapper>

               <div className="flex-1 bg-slate-50/50 p-6 flex flex-col gap-4">
                  {/* Fake Team List Table */}
                  <div className="bg-white border border-gray-100 rounded-2xl shadow-sm flex-1 p-8 flex flex-col gap-6">
                     <div className="flex justify-between items-center mb-4">
                        <div className="h-4 w-32 bg-slate-200 rounded-full" />
                        <div className="h-8 w-24 bg-blue-50 rounded-lg" />
                     </div>
                     {/* Table header */}
                     <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <div className="h-2 w-16 bg-slate-200 rounded-full" />
                        <div className="flex gap-12 w-1/2 justify-end">
                           <div className="h-2 w-12 bg-slate-200 rounded-full" />
                           <div className="h-2 w-12 bg-slate-200 rounded-full" />
                           <div className="h-2 w-12 bg-slate-200 rounded-full" />
                        </div>
                     </div>
                     {/* Table rows */}
                     {[1, 2, 3, 4].map(i => (
                       <div key={i} className="flex items-center justify-between border-b border-gray-50 pb-4 last:border-0 pt-2">
                          <div className="flex items-center gap-4">
                             <div className="size-10 rounded-full bg-slate-100 border border-slate-200" />
                             <div className="space-y-2">
                               <div className="h-2.5 w-32 bg-slate-300 rounded-full" />
                               <div className="h-2 w-20 bg-slate-200 rounded-full" />
                             </div>
                          </div>
                          <div className="flex gap-12 w-1/2 justify-end">
                             <div className="h-2.5 w-16 bg-slate-200 rounded-full" />
                             <div className="h-2.5 w-16 bg-slate-200 rounded-full" />
                             <div className="size-6 rounded-full bg-slate-100" />
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
            </PreviewWrapper>
          </motion.div>
        )}

        {/* STEP 5: REVIEW SCREENSHOTS */}
        {step === 5 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-12 w-full max-w-6xl mx-auto">
            <div className="text-center mb-10 mt-4">

              <h1 className="text-[26px] text-slate-800 mb-4 tracking-tight">Let's get you started with Trac!</h1>
              <div className="w-32 h-1 bg-gray-200 mx-auto my-6 rounded-full overflow-hidden">
                <div className="h-full bg-[#2b90ff] w-1/2" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Review screenshots</h2>
              <p className="text-[14px] text-slate-500">See your members' activity levels along with screenshots of what they're working on.</p>
            </div>

            <div className="max-w-xs mx-auto mb-16">
               <select 
                 value={selectedEmployee}
                 onChange={e => setSelectedEmployee(e.target.value)}
                 className="w-full h-11 border border-gray-200 rounded-md px-3 text-[14px] focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm font-medium text-slate-700"
               >
                  <option>John Doe</option>
                  <option>Jane Smith</option>
               </select>
            </div>

            <div className="space-y-12">
               {dummyScreenshotData.map((block, idx) => (
                 <div key={idx} className="border-t border-gray-100 pt-6">
                    <div className="flex items-center gap-6 mb-8 text-[12px] text-slate-500 px-2">
                       <div className="flex items-center gap-2">
                          <div className="size-3.5 border-2 border-slate-300 rounded-full" />
                          <span className="font-medium text-slate-700">{block.hour}</span>
                       </div>
                       <div className="flex items-center gap-2">
                          <span>Total time worked:</span>
                          <span className="font-medium text-slate-700">{block.totalWorked}</span>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                       {block.slots.map((slot) => {
                          const activityColor = slot.activityPercent > 50 ? 'bg-emerald-500' : slot.activityPercent > 20 ? 'bg-amber-500' : 'bg-red-500';
                          
                          return (
                             <div key={slot.id} className="flex flex-col">
                                <div className="text-center mb-2 h-10 flex flex-col justify-end pb-1">
                                   <div className="text-[12px] font-bold text-slate-700 truncate px-1">{slot.project}</div>
                                   <div className="text-[11px] text-slate-400 truncate px-1">{slot.task}</div>
                                </div>
                                
                                <div 
                                  className="border border-gray-200 rounded-lg bg-white overflow-hidden flex flex-col relative group cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                                  onClick={() => slot.hasScreenshot && setSelectedScreenshot(slot.imageUrl)}
                                >
                                   <div className="h-[90px] w-full bg-slate-100 relative">
                                      {slot.hasScreenshot ? (
                                        <img src={slot.imageUrl} alt="Screen" className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100/50">
                                           <Hourglass size={20} className="mb-1.5 opacity-40" />
                                           <span className="text-[10px] font-medium">No screenshot</span>
                                           <span className="text-[10px]">Idle time</span>
                                        </div>
                                      )}

                                      {slot.hasScreenshot && (
                                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded-full px-4 py-0.5 shadow-sm text-[11px] font-bold text-blue-600 flex items-center justify-center z-10 opacity-90 group-hover:opacity-100 transition-opacity">
                                           3 screens
                                        </div>
                                      )}
                                   </div>

                                   <div className="p-3 pt-5 flex flex-col items-center">
                                      <div className="text-[10px] text-slate-500 font-medium mb-2.5">{slot.timeRange}</div>
                                      <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden mb-1.5">
                                         <div className={cn("h-full", activityColor)} style={{ width: `${slot.activityPercent}%` }} />
                                      </div>
                                      <div className="text-[9px] text-slate-400 font-medium">{slot.activityPercent}% of 10 minutes</div>
                                   </div>
                                </div>
                             </div>
                          )
                       })}
                    </div>
                 </div>
               ))}
            </div>
          </motion.div>
        )}

        {/* Modal for Screenshots */}
        <AnimatePresence>
          {selectedScreenshot && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-sm"
              onClick={() => setSelectedScreenshot(null)}
            >
               <motion.div 
                 initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                 className="bg-white rounded-xl shadow-2xl max-w-4xl w-full flex flex-col overflow-hidden"
                 onClick={e => e.stopPropagation()}
               >
                  <div className="flex items-center justify-between p-4 border-b border-gray-100">
                     <h3 className="font-bold text-slate-800 text-[15px]">Screenshots</h3>
                     <button onClick={() => setSelectedScreenshot(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                     </button>
                  </div>
                  <div className="p-8 bg-slate-50 flex items-center justify-center relative min-h-[400px]">
                     <button onClick={handlePrevScreenshot} className="absolute left-6 size-10 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center text-blue-600 z-10 hover:bg-blue-50 transition-colors">
                        <ChevronLeft size={24} />
                     </button>
                     <img src={selectedScreenshot} alt="Large Screen" className="max-h-[60vh] object-contain shadow-lg border border-gray-200 rounded-md" />
                     <button onClick={handleNextScreenshot} className="absolute right-6 size-10 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center text-blue-600 z-10 hover:bg-blue-50 transition-colors">
                        <ChevronRight size={24} />
                     </button>
                  </div>
                  <div className="p-4 border-t border-gray-100 text-center text-[13px] text-slate-500 font-medium">
                     Screenshot from active work period
                  </div>
               </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* STEP 6: APPROVE WORKSHIFT */}
        {step === 6 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-12 w-full max-w-5xl mx-auto px-4">
             <div className="text-center mb-10 mt-4">
              <h1 className="text-[26px] text-slate-800 mb-4 tracking-tight">Let's get you started with Trac!</h1>
              <div className="w-32 h-1 bg-gray-200 mx-auto my-6 rounded-full overflow-hidden">
                <div className="h-full bg-[#2b90ff] w-[60%]" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Approve Work Shifts</h2>
              <p className="text-[14px] text-slate-500 max-w-2xl mx-auto">Review your team's clocked times, total active hours, and approve their work shifts for payroll.</p>
            </div>
            
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
               <div className="overflow-x-auto border border-gray-100 rounded-xl">
                  <table className="w-full text-left border-collapse">
                     <thead>
                        <tr className="border-b border-gray-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                           <th className="p-4 pl-6">Employee</th>
                           <th className="p-4">Clock In</th>
                           <th className="p-4">Clock Out</th>
                           <th className="p-4">Total Worked</th>
                           <th className="p-4">Status</th>
                           <th className="p-4 pr-6 text-right">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-50 text-[13px] text-slate-700">
                        {[
                          { name: "John Doe", avatar: "JD", clockIn: "08:30 am", clockOut: "12:50 pm", totalWorked: "04:20:12" },
                          { name: "Jane Smith", avatar: "JS", clockIn: "09:00 am", clockOut: "03:30 pm", totalWorked: "06:30:15" }
                        ].map((row, index) => (
                           <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-4 pl-6 flex items-center gap-3">
                                 <div className="size-9 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-[13px]">{row.avatar}</div>
                                 <div className="font-bold text-slate-800">{row.name}</div>
                              </td>
                              <td className="p-4 text-slate-500 font-medium">{row.clockIn}</td>
                              <td className="p-4 text-slate-500 font-medium">{row.clockOut}</td>
                              <td className="p-4 font-mono font-medium">{row.totalWorked}</td>
                              <td className="p-4">
                                 {timesheetApproved[row.name] ? (
                                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1.5 w-fit"><CheckSquare size={13} /> Approved</span>
                                 ) : (
                                    <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100 flex items-center gap-1.5 w-fit"><Clock size={13} /> Pending</span>
                                 )}
                              </td>
                              <td className="p-4 pr-6 text-right space-x-2">
                                 <Button 
                                   variant="outline" 
                                   onClick={() => {
                                     setSelectedReviewEmployee(row.name as 'John Doe' | 'Jane Smith');
                                     setIsManagerReviewOpen(true);
                                   }}
                                   className="h-8 text-[12px] font-bold border-gray-200 hover:bg-slate-50 rounded-lg px-3"
                                 >
                                    Review
                                 </Button>
                                 <Button 
                                   disabled={timesheetApproved[row.name]}
                                   onClick={() => setTimesheetApproved(prev => ({ ...prev, [row.name]: true }))}
                                   className={cn(
                                     "h-8 text-[12px] font-bold rounded-lg px-3 transition-colors",
                                     timesheetApproved[row.name] 
                                       ? "bg-slate-100 text-slate-400 border border-slate-200"
                                       : "bg-blue-600 hover:bg-blue-700 text-white"
                                   )}
                                 >
                                    Approve
                                 </Button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
          </motion.div>
        )}

        {/* Manager Review Modal */}
        <AnimatePresence>
          {isManagerReviewOpen && (
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="fixed inset-0 z-[100] bg-slate-900/40 flex items-center justify-center p-4 backdrop-blur-sm select-none"
               onClick={() => setIsManagerReviewOpen(false)}
            >
               <motion.div 
                 initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                 className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden max-h-[90vh] border border-gray-100"
                 onClick={e => e.stopPropagation()}
               >
                  <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white z-10">
                    <div>
                      <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                        <CheckSquare className="h-5 w-5 text-[#2b90ff]" />
                        Review & Approve Workshift
                      </h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{selectedReviewEmployee} • Today</p>
                    </div>
                    <button 
                      onClick={() => setIsManagerReviewOpen(false)}
                      className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6 space-y-8 custom-scrollbar">
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-blue-500" /> Total Time
                           </span>
                           <span className="text-2xl font-black text-slate-800 mt-2 font-mono block">{currentShiftDetail.totalTime}</span>
                        </div>
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                              <Activity className="h-3.5 w-3.5 text-emerald-500" /> Active Time
                           </span>
                           <span className="text-2xl font-black text-slate-800 mt-2 font-mono block">{currentShiftDetail.activeTime}</span>
                        </div>
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                              <Hourglass className="h-3.5 w-3.5 text-amber-500" /> Idle Time
                           </span>
                           <span className="text-2xl font-black text-slate-800 mt-2 font-mono block">{currentShiftDetail.idleTime}</span>
                        </div>
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                              <Coffee className="h-3.5 w-3.5 text-amber-600" /> Break Time
                           </span>
                           <span className="text-2xl font-black text-slate-800 mt-2 font-mono block">{currentShiftDetail.breakTime}</span>
                        </div>
                     </div>
 
                     <div className="space-y-6">
                        <div className="p-5 bg-white border border-emerald-100 rounded-xl shadow-sm relative overflow-hidden">
                           <div className="absolute top-0 left-0 w-1 h-full bg-emerald-400" />
                           <label className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-3">
                             <MessageSquare className="h-4 w-4 text-emerald-500" /> Employee Remark
                           </label>
                           <p className="text-[14px] text-slate-700 font-medium leading-relaxed">
                             "{currentShiftDetail.remark}"
                           </p>
                        </div>
 
                        <div className="space-y-3">
                          <label className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-blue-500" /> Manager Remarks (Optional)
                          </label>
                          <textarea
                            value={managerRemarks}
                            onChange={(e) => setManagerRemarks(e.target.value)}
                            placeholder="Add your review notes, feedback, or reasons for rejection..."
                            rows={3}
                            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#2b90ff]/20 focus:border-[#2b90ff] transition-all text-slate-800 placeholder:text-slate-400 shadow-sm"
                          />
                        </div>
                     </div>
                  </div>
                  
                  <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-end gap-3 items-center">
                     <Button 
                       variant="outline"
                       onClick={() => setIsManagerReviewOpen(false)}
                       className="rounded-full font-bold text-slate-600 hover:text-slate-900 hover:bg-gray-50 h-10 px-6 border-gray-200"
                     >
                       Cancel
                     </Button>
                     <Button 
                       onClick={() => {
                          setIsManagerReviewOpen(false);
                          setTimesheetApproved(prev => ({ ...prev, [selectedReviewEmployee]: true }));
                       }}
                       className="rounded-full font-bold bg-[#2b90ff] hover:bg-[#1a80ef] text-white h-10 px-6 shadow-sm flex items-center gap-2"
                     >
                       <CheckSquare className="h-4 w-4" /> Approve Workshift
                     </Button>
                  </div>
               </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* STEP 7: VIEW UNUSUAL ACTIVITY */}
        {step === 7 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-12 w-full max-w-5xl mx-auto">
             {/* Header */}
             <div className="text-center mb-10 mt-4">

              <h1 className="text-[26px] text-slate-800 mb-4 tracking-tight">Let's get you started with Trac!</h1>
              <div className="w-32 h-1 bg-gray-200 mx-auto my-6 rounded-full overflow-hidden">
                <div className="h-full bg-[#2b90ff] w-3/4" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">View unusual activity</h2>
              <p className="text-[14px] text-slate-500">See if any of your team members are using suspicious apps to generate fake activity.</p>
            </div>

            {/* Summary Boxes */}
            <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto mb-10">
               <div className="bg-white border border-gray-200 rounded-lg p-6 text-center shadow-sm">
                  <div className="text-3xl font-bold text-slate-900 mb-1">3</div>
                  <div className="text-[12px] text-slate-500 font-medium">Members</div>
               </div>
               <div className="bg-white border border-gray-200 rounded-lg p-6 text-center shadow-sm">
                  <div className="text-3xl font-bold text-slate-900 mb-1">7</div>
                  <div className="text-[12px] text-slate-500 font-medium">Instances</div>
               </div>
               <div className="bg-white border border-gray-200 rounded-lg p-6 text-center shadow-sm">
                  <div className="text-3xl font-bold text-slate-900 mb-1">23:36</div>
                  <div className="text-[12px] text-slate-500 font-medium">Total time</div>
               </div>
            </div>

            {/* Table */}
            <div className="max-w-4xl mx-auto">
               <div className="flex items-center gap-2 mb-4 px-2 relative">
                  <h3 className="font-bold text-slate-800 text-[15px]">Members with unusual activity</h3>
                  <div className="w-4 h-4 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-[10px] font-bold peer cursor-pointer">i</div>
                  <div className="absolute top-7 left-4 bg-slate-800 text-white text-[11px] font-medium p-3 rounded-lg opacity-0 peer-hover:opacity-100 transition-opacity z-10 w-52 shadow-xl pointer-events-none normal-case tracking-normal">
                      Team members flagged with suspicious apps, high idle time, or irregular shifts.
                  </div>
               </div>
               
               <div className="bg-white border border-gray-100 shadow-sm rounded-xl overflow-hidden mb-8">
                  <table className="w-full text-left border-collapse">
                     <thead>
                        <tr className="border-b border-gray-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                           <th className="px-6 py-4 font-semibold">Member</th>
                           <th className="px-6 py-4 font-semibold">This week</th>
                           <th className="px-6 py-4 font-semibold">Previous 60 days</th>
                           <th className="px-6 py-4 font-semibold flex items-center gap-1.5 relative">
                              Activity classification
                              <div className="w-3.5 h-3.5 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-[9px] font-bold peer cursor-pointer">i</div>
                              <div className="absolute top-10 left-6 bg-slate-800 text-white text-[11px] font-medium p-3 rounded-lg opacity-0 peer-hover:opacity-100 transition-opacity z-10 w-48 shadow-xl pointer-events-none normal-case tracking-normal font-normal">
                                 Indicates the relative severity and frequency of flagged behaviors.
                              </div>
                           </th>
                           <th className="px-6 py-4 font-semibold"></th>
                        </tr>
                     </thead>
                     <tbody className="text-[13px] text-slate-700">
                        <tr className="border-b border-gray-50 hover:bg-slate-50/50 transition-colors">
                           <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                 <img src="https://i.pravatar.cc/150?u=johndoe" alt="John" className="w-8 h-8 rounded-full border border-gray-200" />
                                 <div className="font-bold text-slate-900">John Doe</div>
                              </div>
                           </td>
                           <td className="px-6 py-4 font-medium">14:16</td>
                           <td className="px-6 py-4 font-medium">30:45</td>
                           <td className="px-6 py-4">
                              <span className="px-3 py-1 bg-red-500 text-white text-[11px] font-bold rounded-md">High</span>
                           </td>
                           <td className="px-6 py-4 text-right">
                              <button 
                                 onClick={() => setIsUnusualActivityModalOpen(true)}
                                 className="px-5 py-2 bg-white border border-gray-200 rounded-full text-[12px] font-bold text-slate-700 hover:bg-gray-50 transition-colors shadow-sm"
                              >
                                 View
                              </button>
                           </td>
                        </tr>
                        <tr className="hover:bg-slate-50/50 transition-colors">
                           <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                 <img src="https://i.pravatar.cc/150?u=jamessmith" alt="James" className="w-8 h-8 rounded-full border border-gray-200" />
                                 <div className="font-bold text-slate-900">James Smith</div>
                              </div>
                           </td>
                           <td className="px-6 py-4 font-medium">7:40</td>
                           <td className="px-6 py-4 font-medium">20:30</td>
                           <td className="px-6 py-4">
                              <span className="px-3 py-1 bg-orange-400 text-white text-[11px] font-bold rounded-md">Medium</span>
                           </td>
                           <td className="px-6 py-4 text-right">
                              <button className="px-5 py-2 bg-white border border-gray-200 rounded-full text-[12px] font-bold text-slate-700 hover:bg-gray-50 transition-colors shadow-sm">
                                 View
                              </button>
                           </td>
                        </tr>
                     </tbody>
                  </table>
               </div>
            </div>
          </motion.div>
        )}

        {/* Unusual Activity Modal */}
        <AnimatePresence>
          {isUnusualActivityModalOpen && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-slate-900/40 flex items-center justify-center p-4 backdrop-blur-sm select-none"
              onClick={() => setIsUnusualActivityModalOpen(false)}
            >
               <motion.div 
                 initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                 className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col overflow-hidden max-h-[90vh] border border-gray-100"
                 onClick={e => e.stopPropagation()}
               >
                  <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white z-10">
                    <h3 className="text-[17px] font-bold text-slate-800 flex items-center gap-2">
                       John Doe's unusual instances
                    </h3>
                    <button 
                      onClick={() => setIsUnusualActivityModalOpen(false)}
                      className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-hidden bg-white flex flex-col md:flex-row h-[600px]">
                     {/* Sidebar */}
                     <div className="w-full md:w-[320px] border-r border-gray-100 flex flex-col bg-white">
                        <div className="p-4 border-b border-gray-50 flex items-center gap-3 shrink-0">
                           <img src="https://i.pravatar.cc/150?u=johndoe" alt="John" className="w-6 h-6 rounded-full" />
                           <div className="text-[13px] font-medium text-slate-700">John Doe <span className="text-slate-400 ml-1">| 3 instances</span></div>
                        </div>
                        
                        <div className="p-4 space-y-3 overflow-y-auto custom-scrollbar flex-1">
                           {/* Instance 1 */}
                           <button 
                              onClick={() => setSelectedUnusualInstance(0)}
                              className={cn("w-full text-left p-4 rounded-xl border transition-all relative overflow-hidden", 
                                selectedUnusualInstance === 0 ? "border-[#2b90ff] bg-blue-50/30 ring-1 ring-[#2b90ff]" : "border-gray-200 hover:border-gray-300 bg-white"
                              )}
                           >
                              {selectedUnusualInstance === 0 && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#2b90ff] rounded-r-md" />}
                              <div className="flex justify-between items-start mb-1 pl-2">
                                 <span className="font-bold text-slate-800 text-[13px]">Suspicious app</span>
                                 <span className="text-[11px] font-bold text-slate-500">High</span>
                              </div>
                              <div className="text-[11px] text-slate-500 font-medium pl-2">9:00 am - 12:35 pm (3:35)</div>
                           </button>

                           {/* Instance 2 */}
                           <button 
                              onClick={() => setSelectedUnusualInstance(1)}
                              className={cn("w-full text-left p-4 rounded-xl border transition-all relative overflow-hidden", 
                                selectedUnusualInstance === 1 ? "border-[#2b90ff] bg-blue-50/30 ring-1 ring-[#2b90ff]" : "border-gray-200 hover:border-gray-300 bg-white"
                              )}
                           >
                              {selectedUnusualInstance === 1 && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#2b90ff] rounded-r-md" />}
                              <div className="flex justify-between items-start mb-1 pl-2">
                                 <span className="font-bold text-slate-800 text-[13px]">Unusually high activity</span>
                                 <span className="text-[11px] font-bold text-slate-500">Medium</span>
                              </div>
                              <div className="text-[11px] text-slate-500 font-medium pl-2">1:00 pm - 5:41 pm (4:41)</div>
                           </button>

                           {/* Instance 3 */}
                           <button 
                              onClick={() => setSelectedUnusualInstance(2)}
                              className={cn("w-full text-left p-4 rounded-xl border transition-all relative overflow-hidden", 
                                selectedUnusualInstance === 2 ? "border-[#2b90ff] bg-blue-50/30 ring-1 ring-[#2b90ff]" : "border-gray-200 hover:border-gray-300 bg-white"
                              )}
                           >
                              {selectedUnusualInstance === 2 && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#2b90ff] rounded-r-md" />}
                              <div className="flex justify-between items-start mb-1 pl-2">
                                 <span className="font-bold text-slate-800 text-[13px]">Long single input activity</span>
                                 <span className="text-[11px] font-bold text-slate-500">Low</span>
                              </div>
                              <div className="text-[11px] text-slate-500 font-medium pl-2">12:00 pm - 6:00 pm (6:00)</div>
                           </button>
                        </div>
                     </div>

                     {/* Content Pane */}
                     <div className="flex-1 p-8 overflow-y-auto bg-white custom-scrollbar">
                        {selectedUnusualInstance === 0 && (
                           <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                              <h4 className="text-lg font-bold text-slate-900 mb-1">Suspicious app</h4>
                              <p className="text-[13px] text-slate-500 mb-8">We detected an application running that can produce fake activity.</p>
                              
                              <div className="grid grid-cols-2 gap-8 mb-8">
                                 <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Date & Time</div>
                                    <div className="text-[13px] font-medium text-slate-800">June 15, 2026</div>
                                    <div className="text-[13px] text-slate-500 mt-1">9:00 am - 12:35 pm EST</div>
                                 </div>
                                 <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Duration</div>
                                    <div className="text-[14px] font-medium text-slate-800">3h 35m</div>
                                 </div>
                              </div>

                              <div className="grid grid-cols-3 gap-8 mb-10">
                                 <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Overall Activity</div>
                                    <div className="inline-flex px-3 py-1.5 bg-emerald-500 text-white font-bold text-[13px] rounded-md shadow-sm">
                                       70%
                                    </div>
                                 </div>
                                 <div className="col-span-2">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Activity Breakdown</div>
                                    <div className="w-full h-1.5 bg-gray-100 rounded-full flex overflow-hidden mb-3">
                                       <div className="h-full bg-emerald-500" style={{ width: '80%' }} />
                                       <div className="h-full bg-orange-400" style={{ width: '20%' }} />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                       <div className="flex items-center gap-2 text-[12px] font-medium text-slate-700">
                                          <div className="w-2 h-2 rounded-full bg-emerald-500" /> 80% - Mouse
                                       </div>
                                       <div className="flex items-center gap-2 text-[12px] font-medium text-slate-700">
                                          <div className="w-2 h-2 rounded-full bg-orange-400" /> 20% - Keyboard
                                       </div>
                                    </div>
                                 </div>
                              </div>

                              <div className="space-y-6">
                                 <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Top Apps In Use</div>
                                    <div className="flex flex-wrap gap-2">
                                       <span className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-slate-600 text-[12px] font-medium rounded-md">Zoom - 50%</span>
                                       <span className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-slate-600 text-[12px] font-medium rounded-md">Slack - 30%</span>
                                       <span className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-slate-600 text-[12px] font-medium rounded-md">Teams - 20%</span>
                                    </div>
                                 </div>
                                 <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Top URLs Visited</div>
                                    <div className="flex flex-wrap gap-2">
                                       <span className="px-3 py-1.5 bg-red-50 border border-red-200 text-red-600 text-[12px] font-bold rounded-md">Aliavni/clicker - 25%</span>
                                       <span className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-slate-600 text-[12px] font-medium rounded-md">zoom.com - 45%</span>
                                       <span className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-slate-600 text-[12px] font-medium rounded-md">Teams - 30%</span>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        )}

                        {selectedUnusualInstance === 1 && (
                           <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                              <h4 className="text-lg font-bold text-slate-900 mb-1">Unusually high activity</h4>
                              <p className="text-[13px] text-slate-500 mb-8">Activity remained above 95% for over 50 minutes.</p>
                              
                              <div className="grid grid-cols-2 gap-8 mb-8">
                                 <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Date & Time</div>
                                    <div className="text-[13px] font-medium text-slate-800">June 14, 2026</div>
                                    <div className="text-[13px] text-slate-500 mt-1">1:00 pm - 5:41 pm EST</div>
                                 </div>
                                 <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Duration</div>
                                    <div className="text-[14px] font-medium text-slate-800">4h 41m</div>
                                 </div>
                              </div>

                              <div className="grid grid-cols-3 gap-8 mb-10">
                                 <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Overall Activity</div>
                                    <div className="inline-flex px-3 py-1.5 bg-emerald-500 text-white font-bold text-[13px] rounded-md shadow-sm">
                                       97%
                                    </div>
                                 </div>
                                 <div className="col-span-2">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Activity Breakdown</div>
                                    <div className="w-full h-1.5 bg-gray-100 rounded-full flex overflow-hidden mb-3">
                                       <div className="h-full bg-emerald-500" style={{ width: '75%' }} />
                                       <div className="h-full bg-orange-400" style={{ width: '25%' }} />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                       <div className="flex items-center gap-2 text-[12px] font-medium text-slate-700">
                                          <div className="w-2 h-2 rounded-full bg-emerald-500" /> 75% - Mouse
                                       </div>
                                       <div className="flex items-center gap-2 text-[12px] font-medium text-slate-700">
                                          <div className="w-2 h-2 rounded-full bg-orange-400" /> 25% - Keyboard
                                       </div>
                                    </div>
                                 </div>
                              </div>

                              <div className="space-y-6">
                                 <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Top Apps In Use</div>
                                    <div className="flex flex-wrap gap-2">
                                       <span className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-slate-600 text-[12px] font-medium rounded-md">Chrome - 40%</span>
                                       <span className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-slate-600 text-[12px] font-medium rounded-md">VSCode - 35%</span>
                                       <span className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-slate-600 text-[12px] font-medium rounded-md">Spotify - 25%</span>
                                    </div>
                                 </div>
                                 <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Top URLs Visited</div>
                                    <div className="flex flex-wrap gap-2">
                                       <span className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-slate-600 text-[12px] font-medium rounded-md">Teams - 30%</span>
                                       <span className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-slate-600 text-[12px] font-medium rounded-md">zoom.com - 40%</span>
                                       <span className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-slate-600 text-[12px] font-medium rounded-md">Microsoft Word - 30%</span>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        )}

                        {selectedUnusualInstance === 2 && (
                           <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                              <h4 className="text-lg font-bold text-slate-900 mb-1">Long single input activity</h4>
                              <p className="text-[13px] text-slate-500 mb-8">While mouse was being used, keyboard stayed at or near 0% for over 50 minutes.</p>
                              
                              <div className="grid grid-cols-2 gap-8 mb-8">
                                 <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Date & Time</div>
                                    <div className="text-[13px] font-medium text-slate-800">June 13, 2026</div>
                                    <div className="text-[13px] text-slate-500 mt-1">12:00 pm - 6:00 pm EST</div>
                                 </div>
                                 <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Duration</div>
                                    <div className="text-[14px] font-medium text-slate-800">6h 0m</div>
                                 </div>
                              </div>

                              <div className="grid grid-cols-3 gap-8 mb-10">
                                 <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Overall Activity</div>
                                    <div className="inline-flex px-3 py-1.5 bg-emerald-500 text-white font-bold text-[13px] rounded-md shadow-sm">
                                       85%
                                    </div>
                                 </div>
                                 <div className="col-span-2">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Activity Breakdown</div>
                                    <div className="w-full h-1.5 bg-gray-100 rounded-full flex overflow-hidden mb-3">
                                       <div className="h-full bg-emerald-500" style={{ width: '100%' }} />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                       <div className="flex items-center gap-2 text-[12px] font-medium text-slate-700">
                                          <div className="w-2 h-2 rounded-full bg-emerald-500" /> 100% - Mouse
                                       </div>
                                       <div className="flex items-center gap-2 text-[12px] font-medium text-slate-700">
                                          <div className="w-2 h-2 rounded-full bg-orange-400" /> 0% - Keyboard
                                       </div>
                                    </div>
                                 </div>
                              </div>

                              <div className="space-y-6">
                                 <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Top Apps In Use</div>
                                    <div className="flex flex-wrap gap-2">
                                       <span className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-slate-600 text-[12px] font-medium rounded-md">Teams - 50%</span>
                                       <span className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-slate-600 text-[12px] font-medium rounded-md">Excel - 30%</span>
                                       <span className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-slate-600 text-[12px] font-medium rounded-md">Word - 20%</span>
                                    </div>
                                 </div>
                                 <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Top URLs Visited</div>
                                    <div className="flex flex-wrap gap-2">
                                       <span className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-slate-600 text-[12px] font-medium rounded-md">google.com - 35%</span>
                                       <span className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-slate-600 text-[12px] font-medium rounded-md">statsig.com - 40%</span>
                                       <span className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-slate-600 text-[12px] font-medium rounded-md">Excel - 25%</span>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        )}
                     </div>
                  </div>
               </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* STEP 8: REVIEW TEAM INSIGHTS */}
        {step === 8 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-12 w-full max-w-5xl mx-auto">
             <div className="text-center mb-10 mt-4">

              <h1 className="text-[26px] text-slate-800 mb-4 tracking-tight">Let's get you started with Trac!</h1>
              <div className="w-32 h-1 bg-gray-200 mx-auto my-6 rounded-full overflow-hidden">
                <div className="h-full bg-[#2b90ff] w-[85%]" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Review Team Insights</h2>
            </div>

            <div className="max-w-xs mx-auto mb-8">
               <select 
                 value={selectedInsightEmployee}
                 onChange={e => setSelectedInsightEmployee(e.target.value)}
                 className="w-full h-11 border border-gray-200 rounded-md px-3 text-[14px] focus:ring-[#2b90ff] focus:border-[#2b90ff] bg-white shadow-sm font-medium text-slate-700 outline-none"
               >
                  <option>John Doe</option>
                  <option>Jane Smith</option>
               </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
               {/* Activity Panel */}
               <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm flex flex-col">
                  <div className="flex items-center gap-1.5 mb-6 text-[10px] font-bold text-slate-500 uppercase tracking-wider relative">
                     Activity <div className="w-3 h-3 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-[8px] peer cursor-pointer">i</div>
                     <div className="absolute top-6 left-0 bg-slate-800 text-white text-[11px] font-medium p-3 rounded-lg opacity-0 peer-hover:opacity-100 transition-opacity z-10 w-48 shadow-xl pointer-events-none normal-case tracking-normal">
                        Percentage of tracked time spent actively typing or moving the mouse.
                     </div>
                  </div>
                  <div className="flex justify-between h-[200px] mb-8 relative">
                     <div>
                        <div className="text-4xl font-black text-slate-800">{currentInsight.averageActivity}%</div>
                        <div className="text-[13px] text-slate-500 font-medium">Average</div>
                     </div>
                     <div className="flex items-center gap-2">
                        <div className="h-full flex flex-col justify-between text-[10px] font-bold text-slate-400 py-1 text-right select-none pr-1">
                           <span>100% —</span>
                           <span>75% —</span>
                           <span>50% —</span>
                           <span>25% —</span>
                           <span>0% —</span>
                        </div>
                        <div className="w-6 h-full bg-gray-100 rounded-full overflow-hidden flex flex-col relative">
                           <div className="bg-emerald-400 w-full" style={{ height: '50%' }} />
                           <div className="bg-amber-400 w-full" style={{ height: '30%' }} />
                           <div className="bg-red-500 w-full" style={{ height: '20%' }} />
                           <div className="absolute -translate-y-1/2 -left-1 w-[150%] h-0.5 bg-slate-900 z-10" style={{ top: `${100 - currentInsight.averageActivity}%` }} />
                        </div>
                     </div>
                  </div>
                  
                  <div className="mt-auto relative pt-4 pb-2 group">
                     <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[11px] font-bold py-1.5 px-3 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg z-10">
                        {currentInsight.industryCompareText}
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                     </div>
                     <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                        <span>0%</span>
                        <span>100%</span>
                     </div>
                     <div className="w-full h-1 bg-gray-100 rounded-full relative">
                        <div className="absolute left-[46%] right-[40%] h-full bg-[#2b90ff] rounded-full" />
                        <div className="absolute -top-1 -ml-1 w-0 h-0 border-l-[4px] border-r-[4px] border-b-[6px] border-transparent border-b-slate-800" style={{ left: currentInsight.industryCompareLeft }} />
                     </div>
                     <div className="text-center text-[10px] font-bold text-slate-500 mt-1">{currentInsight.averageActivity}%</div>
                  </div>
               </div>

               {/* Top Apps & URLs Panel */}
               <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm flex flex-col">
                  <div className="flex items-center gap-1.5 mb-6 text-[10px] font-bold text-slate-500 uppercase tracking-wider relative">
                     Top Apps & URLs <div className="w-3 h-3 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-[8px] peer cursor-pointer">i</div>
                     <div className="absolute top-6 left-0 bg-slate-800 text-white text-[11px] font-medium p-3 rounded-lg opacity-0 peer-hover:opacity-100 transition-opacity z-10 w-48 shadow-xl pointer-events-none normal-case tracking-normal">
                        Most used software applications and visited website domains.
                     </div>
                  </div>
                  <div className="space-y-5">
                     {currentInsight.apps.map((app, index) => {
                       if (app.isUrl) {
                         return (
                           <div key={index}>
                              <div className="flex justify-between items-center mb-1.5">
                                 <div className="text-[13px] font-bold text-slate-800">{app.percent}% <span className="font-medium text-slate-600 ml-1">{app.name}</span></div>
                                 <div className="text-[12px] font-medium text-slate-500">{app.time}</div>
                              </div>
                              <div className="w-full h-1.5 relative">
                                 <div className="w-1.5 h-1.5 bg-orange-400 rounded-full" style={{ left: `${app.percent}%` }} />
                              </div>
                           </div>
                         );
                       }
                       return (
                         <div key={index}>
                            <div className="flex justify-between items-center mb-1.5">
                               <div className="text-[13px] font-bold text-slate-800">{app.percent}% <span className="font-medium text-slate-600 ml-1">{app.name}</span></div>
                               <div className="text-[12px] font-medium text-slate-500">{app.time}</div>
                            </div>
                            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                               <div className={cn("h-full", app.color)} style={{ width: `${app.percent}%` }} />
                            </div>
                         </div>
                       );
                     })}
                  </div>
               </div>

               {/* Work Time Classification Panel */}
               <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm flex flex-col">
                  <div className="flex items-center gap-1.5 mb-6 text-[10px] font-bold text-slate-500 uppercase tracking-wider relative">
                     Work Time Classification <div className="w-3 h-3 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-[8px] peer cursor-pointer">i</div>
                     <div className="absolute top-6 left-0 bg-slate-800 text-white text-[11px] font-medium p-3 rounded-lg opacity-0 peer-hover:opacity-100 transition-opacity z-10 w-48 shadow-xl pointer-events-none normal-case tracking-normal">
                        {currentInsight.breakdownHtml}
                     </div>
                  </div>
                  <div className="mb-8">
                     <div className="text-3xl font-black text-slate-800 mb-1">{currentInsight.classification.core}%</div>
                     <div className="text-[13px] text-slate-600 font-medium mb-6">Core work</div>
                     
                     <div className="w-full h-3.5 bg-gray-100 rounded-full overflow-hidden flex mb-3 shadow-inner">
                        <div className="bg-[#2b90ff] h-full" style={{ width: `${currentInsight.classification.core}%` }} />
                        <div className="bg-slate-500 h-full" style={{ width: `${currentInsight.classification.nonCore}%` }} />
                        <div className="bg-orange-500 h-full" style={{ width: `${currentInsight.classification.unproductive}%` }} />
                     </div>
                     <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-6">
                        <span>0%</span>
                        <span>25%</span>
                        <span>50%</span>
                        <span>75%</span>
                        <span>100%</span>
                     </div>
                     
                     <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[12px] font-medium text-slate-600">
                           <div className="w-2.5 h-2.5 rounded-full bg-[#2b90ff]" /> {currentInsight.classification.core}% Core work
                        </div>
                        <div className="flex items-center gap-2 text-[12px] font-medium text-slate-600">
                           <div className="w-2.5 h-2.5 rounded-full bg-slate-500" /> {currentInsight.classification.nonCore}% Non-core work
                        </div>
                        <div className="flex items-center gap-2 text-[12px] font-medium text-slate-600">
                           <div className="w-2.5 h-2.5 rounded-full bg-orange-500" /> {currentInsight.classification.unproductive}% Unproductive
                        </div>
                     </div>
                  </div>

                  <div className="mt-auto relative pt-4 pb-2">
                     <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                        <span>0%</span>
                        <span>100%</span>
                     </div>
                     <div className="w-full h-1 bg-gray-100 rounded-full relative">
                        <div className="absolute h-full bg-[#2b90ff] rounded-full" style={{ left: `${currentInsight.classification.core}%`, right: `${100 - (currentInsight.classification.core + currentInsight.classification.nonCore)}%` }} />
                        <div className="absolute -top-1 -ml-1 w-0 h-0 border-l-[4px] border-r-[4px] border-b-[6px] border-transparent border-b-slate-800" style={{ left: `${currentInsight.classification.core}%` }} />
                     </div>
                     <div className="text-center text-[10px] font-bold text-slate-500 mt-1 relative">
                        <span className="absolute -translate-x-1/2" style={{ left: `${currentInsight.classification.core}%` }}>{currentInsight.classification.core}%</span>
                     </div>
                  </div>
               </div>
            </div>
          </motion.div>
        )}

        {/* STEP 9: ADD REPORTS */}
        {step === 9 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-12 w-full max-w-5xl mx-auto">
             <div className="text-center mb-10 mt-4">

              <h1 className="text-[26px] text-slate-800 mb-4 tracking-tight">Let's get you started with Trac!</h1>
              <div className="w-32 h-1 bg-gray-200 mx-auto my-6 rounded-full overflow-hidden">
                <div className="h-full bg-[#2b90ff] w-full" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Add a Report</h2>
              <p className="text-[14px] text-slate-500 max-w-2xl mx-auto">Pick a report that you'd find valuable to access on a regular basis and we'll make sure it's available directly on your dashboard.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto px-4">
               {/* Activity Report */}
               <div className={cn("bg-white border rounded-xl p-6 transition-all flex flex-col h-full", addedReports.includes('activity') ? "border-[#2b90ff] ring-1 ring-[#2b90ff] shadow-md" : "border-gray-200 shadow-sm hover:border-gray-300")}>
                  <h3 className="text-[15px] font-bold text-slate-900 mb-3">Activity Report</h3>
                  <p className="text-[13px] text-slate-500 leading-relaxed flex-1">See team members' time worked and activity levels per project or task.</p>
                  <Button 
                     onClick={() => toggleReport('activity')}
                     className={cn("w-32 mt-6 h-9 rounded-md font-bold text-[12px] mx-auto transition-colors", addedReports.includes('activity') ? "bg-blue-50 text-[#2b90ff] border border-blue-200 hover:bg-blue-100" : "bg-[#2b90ff] hover:bg-[#1a80ef] text-white")}
                  >
                     {addedReports.includes('activity') ? 'Added' : 'Add'}
                  </Button>
               </div>

               {/* Attendance Report */}
               <div className={cn("bg-white border rounded-xl p-6 transition-all flex flex-col h-full", addedReports.includes('attendance') ? "border-[#2b90ff] ring-1 ring-[#2b90ff] shadow-md" : "border-gray-200 shadow-sm hover:border-gray-300")}>
                  <h3 className="text-[15px] font-bold text-slate-900 mb-3">Attendance Report</h3>
                  <p className="text-[13px] text-slate-500 leading-relaxed flex-1">Track team members' attendance, shifts, and time off in one unified view.</p>
                  <Button 
                     onClick={() => toggleReport('attendance')}
                     className={cn("w-32 mt-6 h-9 rounded-md font-bold text-[12px] mx-auto transition-colors", addedReports.includes('attendance') ? "bg-blue-50 text-[#2b90ff] border border-blue-200 hover:bg-blue-100" : "bg-[#2b90ff] hover:bg-[#1a80ef] text-white")}
                  >
                     {addedReports.includes('attendance') ? 'Added' : 'Add'}
                  </Button>
               </div>

               {/* Unusual Activity Report */}
               <div className={cn("bg-white border rounded-xl p-6 transition-all flex flex-col h-full", addedReports.includes('unusual') ? "border-[#2b90ff] ring-1 ring-[#2b90ff] shadow-md" : "border-gray-200 shadow-sm hover:border-gray-300")}>
                  <h3 className="text-[15px] font-bold text-slate-900 mb-3">Unusual Activity Report</h3>
                  <p className="text-[13px] text-slate-500 leading-relaxed flex-1">Monitor suspicious apps and unusually high or low activity patterns.</p>
                  <Button 
                     onClick={() => toggleReport('unusual')}
                     className={cn("w-32 mt-6 h-9 rounded-md font-bold text-[12px] mx-auto transition-colors", addedReports.includes('unusual') ? "bg-blue-50 text-[#2b90ff] border border-blue-200 hover:bg-blue-100" : "bg-[#2b90ff] hover:bg-[#1a80ef] text-white")}
                  >
                     {addedReports.includes('unusual') ? 'Added' : 'Add'}
                  </Button>
               </div>
            </div>
          </motion.div>
        )}
        {/* STEP 10: PRICING PLANS */}
        {step === 10 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-12 w-full max-w-6xl mx-auto px-4">
            <div className="text-center mb-10 mt-4">
              <h1 className="text-[26px] text-slate-800 mb-4 tracking-tight">Let's get you started with Trac!</h1>
              <div className="w-32 h-1 bg-gray-200 mx-auto my-6 rounded-full overflow-hidden">
                <div className="h-full bg-[#2b90ff] w-full" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Choose your plan</h2>
              <p className="text-[14px] text-slate-500 max-w-2xl mx-auto">Start with a 14-day free trial. No credit card required. Cancel anytime.</p>
            </div>

            {/* Compare Bar */}
            <div className="bg-slate-50 border border-gray-200 rounded-2xl p-6 mb-10 shadow-sm max-w-5xl mx-auto">
                <div className="text-center font-bold text-slate-700 text-[14px] uppercase tracking-wider mb-4">Pricing Comparison</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between shadow-xs">
                      <div>
                         <div className="font-bold text-slate-800 text-[13px] flex items-center gap-2">
                            <span className="size-2 rounded-full bg-red-400" />
                            Other Industry Solutions (Hubstaff, etc.)
                         </div>
                         <div className="text-[11px] text-slate-400 mt-1 font-medium">Standard features limit seat counts</div>
                      </div>
                      <div className="text-right">
                         <div className="text-[18px] font-extrabold text-red-500">$15 - $25</div>
                         <div className="text-[10px] text-slate-400 font-bold uppercase">per seat / mo</div>
                      </div>
                   </div>
                   <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex items-center justify-between shadow-xs">
                      <div>
                         <div className="font-bold text-slate-800 text-[13px] flex items-center gap-2">
                            <span className="size-2 rounded-full bg-blue-500" />
                            Trac AI Pricing
                         </div>
                         <div className="text-[11px] text-blue-500 mt-1 font-medium">Includes advanced activity features</div>
                      </div>
                      <div className="text-right">
                         <div className="text-[18px] font-extrabold text-blue-600">$7 - $12</div>
                         <div className="text-[10px] text-blue-500 font-bold uppercase">per seat / mo</div>
                      </div>
                   </div>
                </div>
            </div>

            {/* Pricing Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
               
               {/* STARTER */}
               <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative">
                  <div>
                     <h3 className="text-[18px] font-black text-slate-800">Starter</h3>
                     <div className="mt-4 flex items-baseline">
                        <span className="text-3xl font-black text-slate-800">$7</span>
                        <span className="text-slate-400 text-[12px] font-bold ml-1">/ seat / mo</span>
                     </div>
                     <p className="text-[10px] text-slate-400 font-bold mt-1">2 seat minimum</p>
                     
                     <Button className="w-full mt-6 bg-[#2b90ff] hover:bg-[#1a80ef] text-white font-bold h-10 rounded-lg text-[13px]">
                        Choose Starter plan
                     </Button>

                     <div className="mt-6 space-y-3.5 border-t border-gray-100 pt-6">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Includes:</div>
                        <div className="text-[12px] text-slate-600 font-medium flex items-center gap-2"><Check className="size-3.5 text-blue-500 shrink-0" /> Time tracking</div>
                        <div className="text-[12px] text-slate-600 font-medium flex items-center gap-2"><Check className="size-3.5 text-blue-500 shrink-0" /> Timesheets</div>
                        <div className="text-[12px] text-slate-600 font-medium flex items-center gap-2"><Check className="size-3.5 text-blue-500 shrink-0" /> Activity levels</div>
                        <div className="text-[12px] text-slate-600 font-medium flex items-center gap-2"><Check className="size-3.5 text-blue-500 shrink-0" /> Limited screenshots</div>
                        <div className="text-[12px] text-slate-600 font-medium flex items-center gap-2"><Check className="size-3.5 text-blue-500 shrink-0" /> Limited app & URL tracking</div>
                        <div className="text-[12px] text-slate-600 font-medium flex items-center gap-2"><Check className="size-3.5 text-blue-500 shrink-0" /> Limited reports</div>
                        <div className="text-[12px] text-slate-600 font-medium flex items-center gap-2"><Check className="size-3.5 text-blue-500 shrink-0" /> Clients & Invoices</div>
                     </div>
                  </div>
                  <div className="mt-8 pt-4 border-t border-gray-50 text-[11px] text-slate-400 font-bold">
                     Support: Two-day email
                  </div>
               </div>

               {/* GROW */}
               <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative">
                  <div>
                     <h3 className="text-[18px] font-black text-slate-800">Grow</h3>
                     <div className="mt-4 flex items-baseline">
                        <span className="text-3xl font-black text-slate-800">$9</span>
                        <span className="text-slate-400 text-[12px] font-bold ml-1">/ seat / mo</span>
                     </div>
                     <p className="text-[10px] text-slate-400 font-bold mt-1">2 seat minimum</p>
                     
                     <Button className="w-full mt-6 bg-[#2b90ff] hover:bg-[#1a80ef] text-white font-bold h-10 rounded-lg text-[13px]">
                        Choose Grow plan
                     </Button>

                     <div className="mt-6 space-y-3.5 border-t border-gray-100 pt-6">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">All Starter plus:</div>
                        <div className="bg-slate-50 rounded-lg p-2 flex items-center gap-2 border border-slate-100">
                           <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 uppercase tracking-wider">Add-on</span>
                           <span className="text-[11px] font-bold text-slate-700">Tasks</span>
                        </div>
                        <div className="text-[12px] text-slate-600 font-medium flex items-center gap-2"><Check className="size-3.5 text-blue-500 shrink-0" /> 1 integration</div>
                        <div className="text-[12px] text-slate-600 font-medium flex items-center gap-2"><Check className="size-3.5 text-blue-500 shrink-0" /> Idle timeout</div>
                        <div className="text-[12px] text-slate-600 font-medium flex items-center gap-2"><Check className="size-3.5 text-blue-500 shrink-0" /> Project budgets</div>
                        <div className="text-[12px] text-slate-600 font-medium flex items-center gap-2"><Check className="size-3.5 text-blue-500 shrink-0" /> Work breaks</div>
                        <div className="text-[12px] text-slate-600 font-medium flex items-center gap-2"><Check className="size-3.5 text-blue-500 shrink-0" /> Expenses</div>
                     </div>
                  </div>
                  <div className="mt-8 pt-4 border-t border-gray-50 text-[11px] text-slate-400 font-bold">
                     Support: One-day email
                  </div>
               </div>

               {/* TEAM */}
               <div className="bg-white border-2 border-blue-500 rounded-2xl p-6 shadow-md flex flex-col justify-between hover:shadow-lg transition-shadow relative ring-2 ring-blue-500/10">
                  <div className="absolute -top-3.5 right-4 bg-orange-500 text-white font-extrabold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border-2 border-white shadow-sm">
                     Popular
                  </div>
                  <div>
                     <h3 className="text-[18px] font-black text-slate-800">Team</h3>
                     <div className="mt-4 flex items-baseline">
                        <span className="text-3xl font-black text-slate-800">$12</span>
                        <span className="text-slate-400 text-[12px] font-bold ml-1">/ seat / mo</span>
                     </div>
                     <p className="text-[10px] text-slate-400 font-bold mt-1">2 seat minimum</p>
                     
                     <Button className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 rounded-lg text-[13px] shadow-md shadow-blue-100">
                        Choose Team plan
                     </Button>

                     <div className="mt-6 space-y-3.5 border-t border-gray-100 pt-6">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">All Grow plus:</div>
                        <div className="bg-slate-50 rounded-lg p-2 flex flex-col gap-1.5 border border-slate-100">
                           <div className="flex items-center gap-2">
                              <span className="text-[9px] font-extrabold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 uppercase tracking-wider">Add-on</span>
                              <span className="text-[11px] font-bold text-slate-700">Insights</span>
                           </div>
                           <div className="flex items-center gap-2">
                              <span className="text-[9px] font-extrabold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 uppercase tracking-wider">Add-on</span>
                              <span className="text-[11px] font-bold text-slate-700">Tasks</span>
                           </div>
                        </div>
                        <div className="text-[12px] text-slate-600 font-medium flex items-center gap-2"><Check className="size-3.5 text-blue-500 shrink-0" /> Unlimited screenshots</div>
                        <div className="text-[12px] text-slate-600 font-medium flex items-center gap-2"><Check className="size-3.5 text-blue-500 shrink-0" /> Auto discard idle time</div>
                        <div className="text-[12px] text-slate-600 font-medium flex items-center gap-2"><Check className="size-3.5 text-blue-500 shrink-0" /> Payments & payroll</div>
                        <div className="text-[12px] text-slate-600 font-medium flex items-center gap-2"><Check className="size-3.5 text-blue-500 shrink-0" /> Scheduling & attendance</div>
                        <div className="text-[12px] text-slate-600 font-medium flex items-center gap-2"><Check className="size-3.5 text-blue-500 shrink-0" /> Timesheet approvals</div>
                     </div>
                  </div>
                  <div className="mt-8 pt-4 border-t border-gray-50 text-[11px] text-slate-400 font-bold">
                     Support: Chat & One-day email
                  </div>
               </div>

               {/* ENTERPRISE */}
               <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative">
                  <div>
                     <h3 className="text-[18px] font-black text-slate-800">Enterprise</h3>
                     <div className="mt-4 flex items-baseline">
                        <span className="text-3xl font-black text-slate-800">$25</span>
                        <span className="text-slate-400 text-[12px] font-bold ml-1">/ seat / mo</span>
                     </div>
                     <p className="text-[10px] text-slate-400 font-bold mt-1">Billed annually</p>
                     
                     <Button variant="outline" className="w-full mt-6 border-blue-500 text-blue-600 hover:bg-blue-50 font-bold h-10 rounded-lg text-[13px]">
                        Let's talk
                     </Button>

                     <div className="mt-6 space-y-3.5 border-t border-gray-100 pt-6">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">All Team plus:</div>
                        <div className="bg-slate-50 rounded-lg p-2 flex flex-col gap-1.5 border border-slate-100">
                           <div className="flex items-center gap-2">
                              <span className="text-[9px] font-extrabold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 uppercase tracking-wider">Add-on</span>
                              <span className="text-[11px] font-bold text-slate-700">Locations</span>
                           </div>
                           <div className="flex items-center gap-2">
                              <span className="text-[9px] font-extrabold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 uppercase tracking-wider">Add-on</span>
                              <span className="text-[11px] font-bold text-slate-700">Silent app</span>
                           </div>
                        </div>
                        <div className="text-[12px] text-slate-600 font-medium flex items-center gap-2"><Check className="size-3.5 text-blue-500 shrink-0" /> Pay by bank debit (ACH)</div>
                        <div className="text-[12px] text-slate-600 font-medium flex items-center gap-2"><Check className="size-3.5 text-blue-500 shrink-0" /> HIPAA compliance</div>
                        <div className="text-[12px] text-slate-600 font-medium flex items-center gap-2"><Check className="size-3.5 text-blue-500 shrink-0" /> SOC-2 Type II compliance</div>
                        <div className="text-[12px] text-slate-600 font-medium flex items-center gap-2"><Check className="size-3.5 text-blue-500 shrink-0" /> Single sign-on</div>
                     </div>
                  </div>
                  <div className="mt-8 pt-4 border-t border-gray-50 text-[11px] text-slate-400 font-bold">
                     Support: Concierge & Dedicated Rep
                  </div>
               </div>

            </div>

            {/* Bottom Actions for Step 10 */}
            <div className="text-center mt-12 space-y-4">
               <button 
                 onClick={() => window.location.href = '/ems'}
                 className="px-8 h-10 border border-gray-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-bold text-[13px] rounded-full shadow-sm"
               >
                  Pick a plan later
               </button>
               <div className="text-[12px] text-slate-500 font-medium max-w-md mx-auto">
                  Not sure which package to pick? <span className="font-semibold text-slate-700">Start the free trial</span> and then decide.
               </div>
            </div>

          </motion.div>
        )}

      </div>

      {/* Bottom Actions */}
      <div className="mt-auto border-t border-gray-200 bg-white p-5 sticky bottom-0 z-50">
         <div className="max-w-5xl mx-auto flex justify-between items-center px-4">
            {step > 1 && step < 5 ? (
              <Button onClick={prevStep} variant="outline" className="rounded-full px-6 h-10 text-[13px] font-bold border-gray-200 text-slate-600 hover:bg-gray-50 hover:text-slate-900">
                 <ChevronLeft size={16} className="mr-1.5" />
                 Back
              </Button>
            ) : step >= 5 ? (
              <Button variant="outline" className="rounded-md px-4 h-10 text-[13px] font-bold border-gray-200 text-slate-600 hover:bg-gray-50 hover:text-slate-900">
                 <Monitor size={14} className="mr-2 inline-block" />
                 Explore on my own
              </Button>
            ) : (
              <div />
            )}

            <Button 
              onClick={step === 10 ? () => window.location.href = '/ems' : nextStep} 
              disabled={step === 1 && (!orgName || !teamSize || !whatsapp)} 
              className={cn(
                "px-8 h-10 bg-[#2b90ff] hover:bg-[#1a80ef] text-white font-bold text-[13px] shadow-sm ml-auto",
                step >= 5 ? "rounded-md" : "rounded-full"
              )}
            >
               {step >= 10 ? "Start Free Trial" : step >= 5 ? "Continue" : step === 4 ? "Finish" : "Next"}
            </Button>
         </div>
      </div>
    </div>
  );
}
