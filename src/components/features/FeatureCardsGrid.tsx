'use client';

import React, { useEffect, useState, useRef } from 'react';
import { 
  Brain, 
  Zap, 
  Search, 
  MessageSquare, 
  CheckSquare, 
  BarChart3, 
  ShieldCheck, 
  Plug, 
  Palette,
  Monitor,
  Globe,
  Bell,
  Cpu,
  Bot,
  Sparkles,
  Mic,
  Image as ImageIcon,
  MousePointer2,
  Table,
  Kanban,
  Calendar,
  Layout,
  FileText,
  Clock,
  Target,
  Flag,
  ListTodo,
  Workflow,
  PlusSquare,
  History,
  Inbox,
  Video,
  Layers,
  Users2,
  Tag,
  User,
  Home,
  Folder,
  LayoutDashboard,
  UserPlus,
  Mail,
  ClipboardList,
  Timer,
  Database
} from 'lucide-react';

const sections = [
  {
    id: 'ai-manager',
    title: 'AI MANAGER',
    subtitle: 'WORK SMARTER',
    color: '#4A2FFF',
    cards: [
      { title: 'AI Manager', desc: 'Connect tasks, docs, and people to find answers instantly using AI.', icon: <Brain /> },
      { title: 'Super Copilot', desc: 'Connect tasks, docs, and people to find answers instantly using AI.', icon: <Brain /> },
      { title: 'Ai Task Creation', desc: 'AI teammates that automate workflows and handle complex tasks autonomously.', icon: <Bot /> },
      { title: 'Audio Dictation to Task', desc: 'Access premium AI models to search apps, reason deeply, and generate content across your workflow.', icon: <Cpu /> },
      { title: 'Turn Lot of Messy Thoughts to Structured Tasks', desc: 'Chat with the latest AI models, right within Trac AI Brain.', icon: <Sparkles /> },
      { title: 'AI Notetaker', desc: 'Automatically transcribe meetings and generate summaries and action items.', icon: <Mic /> },
      { title: 'Bulk Sub-tasks Creation', desc: 'Dictate tasks and notes instantly; let AI transcribe and format them.', icon: <Mic /> },
      { title: 'AI Email Creation & Scheduling', desc: 'Instantly create and edit high-quality visuals right in Trac AI with Brain.', icon: <ImageIcon /> },
      { title: 'Unified Search', desc: 'Unified search across all connected apps, docs, and tasks in one place.', icon: <Search /> },
      { title: 'Automations', desc: 'Eliminate busywork by setting rules to automatically update task states.', icon: <Zap /> },
    ]
  },
  {
    id: 'employee-management',
    title: 'Employee Management',
    subtitle: 'SEE WORK YOUR WAY',
    color: '#FF00D6',
    cards: [
      { title: 'Auto Clock-in/out', desc: 'Fully set it and forget it system add once on premise or remote and it tracks without the hassle', icon: <Layout /> },
      { title: 'See Employee Live Screen', desc: 'Visualize workflows and move tasks through stages with a drag-and-drop board.', icon: <Kanban /> },
      { title: 'Get Daily Work Summaries', desc: 'Plan projects on a timeline to manage schedules and dependencies.', icon: <BarChart3 /> },
      { title: 'Automatic Attendance', desc: 'Organize tasks into focused workflows.', icon: <ListTodo /> },
      { title: 'Did Employee Started Work on time?', desc: 'View and schedule tasks on a daily, weekly, or monthly timeline.', icon: <Calendar /> },
      { title: 'Employee\'s active/non-active time', desc: 'Manage tasks in a spreadsheet-style list for fast editing and organization.', icon: <Table /> },
      { title: 'Accurate down to the millisecond', desc: 'Brainstorm and plan visually with a virtual canvas linked to your workflow.', icon: <Monitor /> },
      { title: 'Activity Screenshots of Work', desc: 'Visualize project structures and hierarchies to plan complex workflows.', icon: <Workflow /> },
      { title: 'Daily+Weekly+Monthly Reports', desc: 'Build dynamic visual layouts to organize projects and data your way.', icon: <Layout /> },
      { title: 'Attendance Export', desc: 'Visualize tasks based on location data—ideal for field teams and events.', icon: <Globe /> },
      { title: 'Employee Directory', desc: 'Get a high-level view of progress across multiple projects or lists.', icon: <Layers /> },
      { title: 'Calendar View a Zoom-out Version of the of the Company Output', desc: 'Visualize your team\'s work and capacity over time.', icon: <Users2 /> },
      { title: 'Detailed Website/application Usage Breakdown', desc: 'Visualize your team\'s work and capacity over time.', icon: <Users2 /> },
      { title: 'Hourly Breakdown Of Employees Work', desc: 'Visualize your team\'s work and capacity over time.', icon: <Users2 /> },
      { title: 'Total Keystroke Count', desc: 'Visualize your team\'s work and capacity over time.', icon: <Users2 /> },
      { title: 'Total Mouse Click count', desc: 'Visualize your team\'s work and capacity over time.', icon: <Users2 /> },
      { title: 'Define Prime/Noise Apps', desc: 'Visualize your team\'s work and capacity over time.', icon: <Users2 /> },
      { title: 'Superwise Entire Team Productivity In One-Page', desc: 'Visualize your team\'s work and capacity over time.', icon: <Users2 /> },
      { title: 'Screenshot Redaction/Blurring for Privacy', desc: 'Visualize your team\'s work and capacity over time.', icon: <Users2 /> },
      { title: 'Manaul Clock-in/out Available', desc: 'Visualize your team\'s work and capacity over time.', icon: <Users2 /> },
      { title: 'Employee Side Reporting, How much he Worked', desc: 'Visualize your team\'s work and capacity over time.', icon: <Users2 /> },
      { title: 'One Click Employee Onboarding', desc: 'Visualize your team\'s work and capacity over time.', icon: <Users2 /> },
      { title: '', desc: 'Visualize your team\'s work and capacity over time.', icon: <Users2 /> },
      { title: 'Organization Context', desc: 'Visualize your team\'s work and capacity over time.', icon: <Users2 /> },
    ]
  },
  {
    id: 'tasks-projects',
    title: 'TASK & PROJECT MANAGEMENT',
    subtitle: 'PLAN AND DELIVER',
    color: '#00D2FF',
    cards: [
      { title: 'Give Audio/Video Tasks', desc: 'Track work with actionable items, assignees, and due dates in one place.', icon: <CheckSquare /> },
      { title: 'Unlimited File Storage', desc: 'Manage agile workflows with dedicated time-boxed periods for focused work.', icon: <Zap /> },
      { title: 'Add All-Type Of Attachments', desc: 'Set high-level objectives and track progress automatically linked to tasks.', icon: <Target /> },
      { title: 'Super Easy To Use', desc: 'Mark critical points in a project timeline to track major achievements.', icon: <Flag /> },
      { title: 'Let AI Give Complete Tasks', desc: 'Link tasks to see what must be finished before the next step begins.', icon: <Workflow /> },
      { title: 'Add Notes', desc: 'Collaborate by assigning a single task to multiple people or teams.', icon: <Users2 /> },
      { title: 'Collumn Centre', desc: 'Create unique workflow stages that match your team\'s specific process.', icon: <ListTodo /> },
      { title: '', desc: 'Define unique work items like "Bugs" or "Leads" to fit your specific workflow.', icon: <PlusSquare /> },
      { title: 'Task priorities', desc: 'Flag urgency with clear priority levels to keep the team focused on what matters.', icon: <Flag /> },
      { title: 'Ready-Made Templates', desc: 'Save time by reusing pre-made structures for common tasks and workflows.', icon: <FileText /> },
      { title: 'Task checklists', desc: 'Break down complex tasks into simple, trackable steps to ensure quality.', icon: <ListTodo /> },
      { title: 'Task tags', desc: 'Categorize and filter tasks across different lists for better organization.', icon: <Tag /> },
      { title: 'My Tasks', desc: 'Your personalized mission control for all assigned work & AI StandUps.', icon: <User /> },
      { title: 'Home', desc: 'Your personalized start page with "My Work," reminders, and recent activity.', icon: <Home /> },
      { title: 'Subtasks', desc: 'Break down tasks into smaller components.', icon: <Layers /> },
      { title: 'Sub-Tasks and Granular-Tasks', desc: 'Add up to 7 levels of hierarchy to your subtasks.', icon: <Layers /> },
      { title: 'Leaderboard points', desc: 'Estimate the amount of effort to complete each item of work.', icon: <Sparkles /> },
      { title: 'Task tray', desc: 'Minimize tasks to a tray for quick access without losing your place.', icon: <Inbox /> },
      { title: 'Group Tasks', desc: 'Group related tasks into larger objectives.', icon: <Zap /> },
      { title: 'Task Deletion & Archiving', desc: 'Let your team know what you\'re working on.', icon: <Target /> },
      { title: 'Task Notification', desc: 'Add new layers of Hierarchy to your Workspace to stay perfectly organized.', icon: <Folder /> },
    ]
  },
  {
    id: 'customer-management',
    title: 'CUSTOMER MANAGEMENT',
    subtitle: 'WORK TOGETHER',
    color: '#7B61FF',
    cards: [
      { title: 'All Leads In One Place', desc: 'Real-time messaging alongside work—replace Slack within your project management.', icon: <MessageSquare /> },
      { title: 'Revenue Dashboard', desc: 'A centralized hub for all notifications, updates, and tasks requiring attention.', icon: <Inbox /> },
      { title: 'Assign Leads Automatically', desc: 'Turn feedback into action items by assigning comments directly to team members.', icon: <MessageSquare /> },
      { title: 'Built-In Invoice Maker', desc: 'Record screen and voice to share feedback or bug reports without a meeting.', icon: <Video /> },
      { title: 'Follow Up Reminder', desc: 'Instant meetings, right where work happens.', icon: <Video /> },
      { title: 'Connect Gmail', desc: 'Set personal alerts so you never miss a deadline or small to-do.', icon: <Bell /> },
      { title: 'Send Emails Directly From CRM', desc: 'Create tasks and reply to comments directly from your email inbox.', icon: <Mail /> },
      { title: 'Forms', desc: 'Collect data via public surveys that automatically create tasks in your workspace.', icon: <ClipboardList /> },
      { title: 'Create Organization', desc: 'See who is viewing or editing a task in real-time to avoid collisions.', icon: <MousePointer2 /> },
      { title: 'Collumn Center', desc: 'A window into everyone\'s activity and personal details.', icon: <User /> },
      { title: 'Permissions', desc: 'Control access to workspace content.', icon: <ShieldCheck /> },
      { title: 'Everything Customizable', desc: 'Create specialized permission sets.', icon: <ShieldCheck /> },
    ]
  },
  {
    id: 'leads',
    title: 'Leads',
    subtitle: 'CAPTURE AND CREATE',
    color: '#00D2FF',
    cards: [
      { title: 'Lead Finder', desc: 'Create collaborative documents, wikis, and SOPs directly linked to tasks.', icon: <FileText /> },
      { title: 'Lead Hunter', desc: 'Jot down personal notes and ideas quickly, then convert them to tasks later.', icon: <ClipboardList /> },
      { title: 'Lead Enricher', desc: 'Organize company wisdom and resources in a searchable, central wiki.', icon: <Globe /> },
      { title: 'Email Verification', desc: 'Jot down personal notes and ideas quickly, then convert them to tasks later.', icon: <ClipboardList /> },
      { title: 'Gmail Integration', desc: 'Jot down personal notes and ideas quickly, then convert them to tasks later.', icon: <ClipboardList /> },
      { title: 'AI Email Writing', desc: 'Jot down personal notes and ideas quickly, then convert them to tasks later.', icon: <ClipboardList /> },
      { title: 'Email Scheduling', desc: 'Jot down personal notes and ideas quickly, then convert them to tasks later.', icon: <ClipboardList /> },
      { title: 'Bulk Email Send', desc: 'Jot down personal notes and ideas quickly, then convert them to tasks later.', icon: <ClipboardList /> },
      { title: 'Low Spam Rate', desc: 'Jot down personal notes and ideas quickly, then convert them to tasks later.', icon: <ClipboardList /> },
      { title: 'Best Performing Email Templates', desc: 'Jot down personal notes and ideas quickly, then convert them to tasks later.', icon: <ClipboardList /> },
    ]
  },
  {
    id: 'accounting',
    title: 'Accounting',
    subtitle: 'PLAN AHEAD',
    color: '#FFB800',
    cards: [
      { title: 'Teams Hub', desc: 'Your team\'s priorities, activities, and so much more, all in one place.', icon: <Users2 /> },
      { title: 'Project time tracking', desc: 'Built-in timer to record billable hours and duration across tasks.', icon: <Clock /> },
      { title: 'Time estimates', desc: 'Set expected durations for tasks to predict workload and delivery dates.', icon: <Timer /> },
      { title: 'Timesheets', desc: 'View and approve logged hours for the team in a consolidated weekly view.', icon: <Table /> },
      { title: 'Recurring tasks', desc: 'Automate work that happens on a schedule—daily, weekly, or monthly.', icon: <History /> },
      { title: 'Dates and times', desc: 'Precise scheduling with start dates, due dates, and exact times.', icon: <Calendar /> },
      { title: 'Approvals', desc: 'Easily submit, review, and approve timesheets—all in one place.', icon: <CheckSquare /> },
      { title: 'Planner', desc: 'Tasks and meetings converge in the intelligent Planner powered by Trac AI Brain.', icon: <Calendar /> },
      { title: 'Scheduling', desc: 'Automatically keep your tasks up to date while your project is in progress.', icon: <Zap /> },
    ]
  },
  {
    id: 'point-of-sale',
    title: 'Point of Sale',
    subtitle: 'SEE THE BIG PICTURE',
    color: '#FF00D6',
    cards: [
      { title: 'Easy To Use No Training Reqiured', desc: 'Visual overview of project health, team progress, and key metrics.', icon: <LayoutDashboard /> },
      { title: 'Revunue+Profit Metrics', desc: 'Add unique data types like dropdowns, currency, or text to any task.', icon: <PlusSquare /> },
      { title: 'Realtime Product Inventory', desc: 'AI can automatically summarize activity, analyze data, or provide progress updates.', icon: <Sparkles /> },
      { title: 'Customer Billing/Invoicing', desc: 'Create, resize, and place portable Cards anywhere in Trac AI.', icon: <Layout /> },
      { title: 'Incoice History', desc: 'See how AI credits usage is trending in your Workspace.', icon: <BarChart3 /> },
      { title: 'Sales Record', desc: 'See how AI credits usage is trending in your Workspace.', icon: <BarChart3 /> },
      { title: 'Hot Product Metrics', desc: 'See how AI credits usage is trending in your Workspace.', icon: <BarChart3 /> },
      { title: 'Low Inventory Alerts', desc: 'See how AI credits usage is trending in your Workspace.', icon: <BarChart3 /> },
      { title: 'Direct CRM Integration', desc: 'See how AI credits usage is trending in your Workspace.', icon: <BarChart3 /> },
      { title: 'Branded Invoice', desc: 'See how AI credits usage is trending in your Workspace.', icon: <BarChart3 /> },
      { title: 'Colorful Invoice', desc: 'See how AI credits usage is trending in your Workspace.', icon: <BarChart3 /> },
      { title: 'Restuarant POS', desc: 'See how AI credits usage is trending in your Workspace.', icon: <BarChart3 /> },
      { title: 'Table & Floors Setup', desc: 'See how AI credits usage is trending in your Workspace.', icon: <BarChart3 /> },
      { title: 'Table Rotation Metrics', desc: 'See how AI credits usage is trending in your Workspace.', icon: <BarChart3 /> },
      { title: 'Per Table Revenue', desc: 'See how AI credits usage is trending in your Workspace.', icon: <BarChart3 /> },
    ]
  },
  {
    id: 'shifts-management',
    title: 'Shifts Management',
    subtitle: 'SCALE WITH CONFIDENCE',
    color: '#4A2FFF',
    cards: [
      { title: 'Weekly Roster', desc: 'Control access to workspace content.', icon: <ShieldCheck /> },
      { title: 'Attendance Export', desc: 'Create specialized permission sets.', icon: <ShieldCheck /> },
      { title: 'Leave Requests', desc: 'Invite external collaborators with customizable, controlled access.', icon: <UserPlus /> },
      { title: 'Leave Acceptance/rejection', desc: 'Invite external collaborators with customizable, controlled access.', icon: <UserPlus /> },
      { title: 'Holidays Request', desc: 'Invite external collaborators with customizable, controlled access.', icon: <UserPlus /> },
      { title: 'Recurring/Regular Shifts', desc: 'Invite external collaborators with customizable, controlled access.', icon: <UserPlus /> },
      { title: 'AI Shift Planner', desc: 'Invite external collaborators with customizable, controlled access.', icon: <UserPlus /> },
      { title: 'Employee Shift Notification', desc: 'Invite external collaborators with customizable, controlled access.', icon: <UserPlus /> },
      { title: 'Shift Provenance', desc: 'Invite external collaborators with customizable, controlled access.', icon: <UserPlus /> },
      { title: 'Shift Auditibility', desc: 'Personalize your alert preferences', icon: <Bell className="w-6 h-6 text-purple-600" /> },
    ]
  },
  {
    id: 'privacy-and-compliance',
    title: 'PRIVACY & COMPLIANCE',
    subtitle: 'CONNECT YOUR WORKFLOW',
    color: '#838383',
    cards: [
      { title: 'GDPR', desc: 'Access your Trac AI data in a simple and secure way.', icon: <Database /> },
      { title: 'Role Based Access Control', desc: 'Build custom integrations and automate workflows with Trac AI\'s powerful REST API.', icon: <Cpu /> },
      { title: 'TLS Encryption', desc: 'Trigger real-time actions in external tools when events happen in Trac AI.', icon: <Plug /> },
      { title: 'Organization Data Isolation', desc: 'Connect over 1,000+ tools to Trac AI to centralize your workflow.', icon: <Plug /> },
    ]
  },
  {
    id: 'personalization',
    title: 'CUSTOMIZATION & PERSONALIZATION',
    subtitle: 'MAKE TRAC AI YOURS',
    color: '#7B61FF',
    isIconOnly: true,
    cards: [
      { title: 'Custom color themes', desc: 'Personalize workspace appearance', icon: <Palette className="w-6 h-6 text-purple-600" /> },
      { title: 'Dark mode', desc: 'Switch to low-light interface', icon: <Monitor className="w-6 h-6 text-purple-600" /> },
      { title: 'Localization', desc: 'Use Trac AI in your preferred language', icon: <Globe className="w-6 h-6 text-purple-600" /> },
      { title: 'Custom notifications', desc: 'Personalize your alert preferences', icon: <Bell className="w-6 h-6 text-purple-600" /> },
      { title: 'High configurability', desc: 'Personalize your alert preferences', icon: <Bell className="w-6 h-6 text-purple-600" /> },
      { title: 'Timezone Settings', desc: 'Personalize your alert preferences', icon: <Bell className="w-6 h-6 text-purple-600" /> },
      { title: 'Workdays Settings', desc: 'Personalize your alert preferences', icon: <Bell className="w-6 h-6 text-purple-600" /> },
    ]
  }
];

const FeatureCardsGrid = () => {
  const [activeSection, setActiveSection] = useState(sections[0].id);
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observer.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, {
      rootMargin: '-20% 0px -70% 0px'
    });

    sections.forEach((section) => {
      const el = document.getElementById(section.id);
      if (el) observer.current?.observe(el);
    });

    return () => observer.current?.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -100;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-white py-20 px-6 relative">
      <div className="max-w-7xl mx-auto flex gap-12">
        {/* Left Content Area */}
        <div className="flex-grow space-y-32 pr-4">
          {sections.map((section) => (
            <div key={section.id} id={section.id} className="scroll-mt-32">
              {/* Section Header */}
              <div className="mb-12 border-b border-gray-100 pb-4">
                <h2 className="text-sm font-bold tracking-widest font-mono">
                  <span style={{ color: section.color }}>{section.title} / </span>
                  <span className="text-gray-400">{section.subtitle}</span>
                </h2>
              </div>

              {/* Grid of Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {section.cards.map((card, idx) => (
                  <div key={idx} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-xl hover:border-transparent transition-all group flex flex-col h-full cursor-pointer">
                    {!section.isIconOnly && (
                      <div className="aspect-[4/3] bg-gray-50 rounded-xl mb-6 relative overflow-hidden flex items-center justify-center">
                        <div className="text-gray-200 group-hover:scale-110 transition-transform duration-500">
                          {React.cloneElement(card.icon as React.ReactElement, { size: 64, strokeWidth: 1 })}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/5" />
                      </div>
                    )}
                    {section.isIconOnly && (
                      <div className="mb-4">
                        {card.icon}
                      </div>
                    )}
                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-[#7B61FF] transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {card.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Right Sticky Sidebar Nav */}
        <div className="hidden xl:block w-64 flex-shrink-0">
          <div className="sticky top-32 space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`w-full text-left px-4 py-2 text-sm font-bold transition-all rounded-lg ${
                  activeSection === section.id 
                    ? 'bg-gray-100 text-black translate-x-1' 
                    : 'text-gray-400 hover:text-gray-600 hover:translate-x-1'
                }`}
              >
                {section.id === 'ai-manager' ? 'AI Manager' :
                 section.id === 'employee-management' ? 'Employee Management' :
                 section.id === 'tasks-projects' ? 'Tasks & Projects' :
                 section.id === 'customer-management' ? 'Customer Management' :
                 section.id === 'leads' ? 'Leads' :
                 section.id === 'accounting' ? 'Accounting' :
                 section.id === 'point-of-sale' ? 'Point of Sale' :
                 section.id === 'shifts-management' ? 'Shifts Management' :
                 section.id === 'privacy-and-compliance' ? 'Privacy & Compliance' :
                 'Personalization'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureCardsGrid;
