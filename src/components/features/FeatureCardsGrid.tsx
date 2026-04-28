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
  ImageIcon,
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
  Database,
  Briefcase,
  GitMerge,
  Settings,
  Shield,
  Key,
  Eye,
  FileClock,
  UserCheck,
  ArrowRightLeft,
  CalendarDays,
  Truck,
  FileSearch,
  BookUser,
  Fingerprint,
  Building,
  Factory,
  Check,
  X,
  Plus,
  Minus,
  Book,
  Flame,
  Paperclip,
  Lock
} from 'lucide-react';

const sections = [
  {
    id: 'ai-manager',
    title: 'AI MANAGER',
    subtitle: 'Automate workflows and enhance productivity with our intelligent AI assistants.',
    color: '#4A2FFF',
    cards: [
      { title: 'AI Manager', desc: 'Your central command for AI-driven task management and workflow automation.', icon: <Brain /> },
      { title: 'Super Copilot', desc: 'An advanced AI assistant to help you navigate tasks and projects effortlessly.', icon: <Bot /> },
      { title: 'Ai Task Creation', desc: 'Automatically generate detailed tasks from your ideas and notes.', icon: <PlusSquare /> },
      { title: 'Audio Dictation to Task', desc: 'Convert spoken words into actionable tasks with our dictation feature.', icon: <Mic /> },
      { title: 'Turn Lot of Messy Thoughts to Structured Tasks', desc: 'Organize your scattered ideas into a clear and structured task list.', icon: <Workflow /> },
      { title: 'AI Notetaker', desc: 'Let our AI take notes for you during meetings and discussions.', icon: <FileText /> },
      { title: 'Bulk Sub-tasks Creation', desc: 'Create multiple sub-tasks at once to break down complex projects.', icon: <Layers /> },
      { title: 'AI Email Creation & Scheduling', desc: 'Draft and schedule emails automatically with AI-powered assistance.', icon: <Mail /> },
      { title: 'Unified Search', desc: 'Find anything across your projects, tasks, and documents with a single search.', icon: <Search /> },
      { title: 'Automations', desc: 'Set up custom rules to automate repetitive tasks and streamline your workflow.', icon: <Zap /> },
    ]
  },
  {
    id: 'employee-management',
    title: 'Employee Management',
    subtitle: 'Monitor and manage your workforce with our comprehensive employee management tools.',
    color: '#FF00D6',
    cards: [
      { title: 'Auto Clock-in/out', desc: 'Automate time tracking with our seamless and accurate clock-in/out system.', icon: <Clock /> },
      { title: 'See Employee Live Screen', desc: 'Get a real-time view of your employees\' screens to monitor productivity.', icon: <Monitor /> },
      { title: 'Get Daily Work Summaries', desc: 'Receive daily reports summarizing the work and progress of your team.', icon: <BarChart3 /> },
      { title: 'Automatic Attendance', desc: 'Track employee attendance automatically without manual intervention.', icon: <UserCheck /> },
      { title: 'Did Employee Started Work on time?', desc: 'Get alerts and reports on employee punctuality and work start times.', icon: <CalendarDays /> },
      { title: 'Employee\'s active/non-active time', desc: 'Monitor the active and idle time of your employees to ensure productivity.', icon: <Timer /> },
      { title: 'Accurate down to the millisecond', desc: 'Our time tracking is precise to the millisecond for accurate records.', icon: <Briefcase /> },
      { title: 'Activity Screenshots of Work', desc: 'Capture screenshots of employee activity to review work and progress.', icon: <ImageIcon /> },
      { title: 'Daily+Weekly+Monthly Reports', desc: 'Generate detailed reports on a daily, weekly, or monthly basis.', icon: <FileClock /> },
      { title: 'Attendance Export', desc: 'Export attendance records for payroll and other administrative purposes.', icon: <FileSearch /> },
      { title: 'Employee Directory', desc: 'A central directory with all your employee information and contact details.', icon: <BookUser /> },
      { title: 'Calendar View a Zoom-out Version of the of the Company Output', desc: 'Get a high-level overview of your company\'s output on a calendar.', icon: <Calendar /> },
      { title: 'Detailed Website/application Usage Breakdown', desc: 'Track and analyze the websites and applications used by your employees.', icon: <Globe /> },
      { title: 'Hourly Breakdown Of Employees Work', desc: 'Get a detailed hourly breakdown of your employees\'s work and activities.', icon: <BarChart3 /> },
      { title: 'Total Keystroke Count', desc: 'Monitor the total keystroke count of your employees to gauge activity levels.', icon: <MousePointer2 /> },
      { title: 'Total Mouse Click count', desc: 'Track the total number of mouse clicks to understand user engagement.', icon: <Sparkles /> },
      { title: 'Define Prime/Noise Apps', desc: 'Categorize applications as productive or distracting to manage focus.', icon: <Settings /> },
      { title: 'Superwise Entire Team Productivity In One-Page', desc: 'A single dashboard to supervise and analyze your team\'s productivity.', icon: <LayoutDashboard /> },
      { title: 'Screenshot Redaction/Blurring for Privacy', desc: 'Protect sensitive information with automatic redaction and blurring of screenshots.', icon: <Eye /> },
      { title: 'Manaul Clock-in/out Available', desc: 'Option for manual clock-in/out for flexibility and special cases.', icon: <UserPlus /> },
      { title: 'Employee Side Reporting, How much he Worked', desc: 'Allow employees to view their own work reports and track their progress.', icon: <User /> },
      { title: 'One Click Employee Onboarding', desc: 'Streamline the onboarding process for new employees with a single click.', icon: <UserPlus /> },
      { title: 'Organization Context', desc: 'Understand the organizational context and structure of your teams.', icon: <Building /> },
    ]
  },
  {
    id: 'tasks-projects',
    title: 'TASK & PROJECT MANAGEMENT',
    subtitle: 'Organize, manage, and track your tasks and projects with our powerful tools.',
    color: '#00D2FF',
    cards: [
      { title: 'Give Audio/Video Tasks', desc: 'Assign tasks with audio or video instructions for clear communication.', icon: <Video /> },
      { title: 'Unlimited File Storage', desc: 'Store all your project files and documents with unlimited storage.', icon: <Database /> },
      { title: 'Add All-Type Of Attachments', desc: 'Attach any type of file to your tasks and projects for easy access.', icon: <Paperclip /> },
      { title: 'Super Easy To Use', desc: 'Our intuitive interface makes task and project management a breeze.', icon: <MousePointer2 /> },
      { title: 'Let AI Give Complete Tasks', desc: 'Let our AI handle the details and complete tasks for you.', icon: <Bot /> },
      { title: 'Add Notes', desc: 'Add notes and comments to your tasks to keep track of important information.', icon: <FileText /> },
      { title: 'Collumn Centre', desc: 'Organize your tasks and projects into customizable columns and boards.', icon: <Kanban /> },
      { title: 'Task priorities', desc: 'Set priorities for your tasks to focus on what matters most.', icon: <Flag /> },
      { title: 'Ready-Made Templates', desc: 'Use our pre-built templates to get started on your projects quickly.', icon: <Layout /> },
      { title: 'Task checklists', desc: 'Create checklists within your tasks to ensure all steps are completed.', icon: <ListTodo /> },
      { title: 'Task tags', desc: 'Use tags to categorize and filter your tasks for better organization.', icon: <Tag /> },
      { title: 'My Tasks', desc: 'A personalized view of all your assigned tasks and to-dos.', icon: <User /> },
      { title: 'Home', desc: 'Your central hub for all your projects, tasks, and notifications.', icon: <Home /> },
      { title: 'Subtasks', desc: 'Break down large tasks into smaller, manageable sub-tasks.', icon: <Layers /> },
      { title: 'Sub-Tasks and Granular-Tasks', desc: 'Create detailed and granular tasks to manage complex projects.', icon: <GitMerge /> },
      { title: 'Leaderboard points', desc: 'Gamify your tasks and projects with a leaderboard and points system.', icon: <Sparkles /> },
      { title: 'Task tray', desc: 'A convenient tray to keep your most important tasks always accessible.', icon: <Inbox /> },
      { title: 'Group Tasks', desc: 'Group related tasks together to keep your projects organized.', icon: <Folder /> },
      { title: 'Task Deletion & Archiving', desc: 'Delete or archive completed tasks to keep your workspace clean.', icon: <History /> },
      { title: 'Task Notification', desc: 'Get notified about important updates and changes to your tasks.', icon: <Bell /> },
    ]
  },
  {
    id: 'customer-management',
    title: 'CUSTOMER MANAGEMENT',
    subtitle: 'Build and maintain strong customer relationships with our CRM tools.',
    color: '#7B61FF',
    cards: [
      { title: 'All Leads In One Place', desc: 'Manage all your leads and customer information in a single, unified view.', icon: <Users2 /> },
      { title: 'Revenue Dashboard', desc: 'Track your revenue and financial performance with our interactive dashboard.', icon: <BarChart3 /> },
      { title: 'Assign Leads Automatically', desc: 'Automate the assignment of leads to your sales team for faster follow-up.', icon: <UserPlus /> },
      { title: 'Built-In Invoice Maker', desc: 'Create and send professional invoices directly from our CRM.', icon: <FileText /> },
      { title: 'Follow Up Reminder', desc: 'Set reminders for follow-ups to ensure you never miss an opportunity.', icon: <Bell /> },
      { title: 'Connect Gmail', desc: 'Integrate your Gmail account to manage your emails and contacts seamlessly.', icon: <Mail /> },
      { title: 'Send Emails Directly From CRM', desc: 'Send emails to your customers and leads directly from the CRM.', icon: <Mail /> },
      { title: 'Forms', desc: 'Create custom forms to capture leads and customer information.', icon: <ClipboardList /> },
      { title: 'Create Organization', desc: 'Manage your customer organizations and their contact information.', icon: <Building /> },
      { title: 'Collumn Center', desc: 'Organize your customer data into customizable columns and boards.', icon: <Kanban /> },
      { title: 'Permissions', desc: 'Control access to your customer data with our flexible permission settings.', icon: <Shield /> },
      { title: 'Everything Customizable', desc: 'Customize your CRM to fit your unique business needs and workflow.', icon: <Settings /> },
    ]
  },
  {
    id: 'leads',
    title: 'Leads',
    subtitle: 'Find, enrich, and manage your leads with our powerful lead generation tools.',
    color: '#00D2FF',
    cards: [
      { title: 'Lead Finder', desc: 'Find new leads and prospects with our advanced lead generation tools.', icon: <Search /> },
      { title: 'Lead Hunter', desc: 'Hunt for new leads and opportunities with our powerful lead hunter.', icon: <Target /> },
      { title: 'Lead Enricher', desc: 'Enrich your leads with valuable information to improve your outreach.', icon: <UserPlus /> },
      { title: 'Email Verification', desc: 'Verify email addresses to ensure your messages reach the right people.', icon: <CheckSquare /> },
      { title: 'Gmail Integration', desc: 'Integrate with Gmail to streamline your lead management and outreach.', icon: <Mail /> },
      { title: 'AI Email Writing', desc: 'Let our AI write compelling emails to engage your leads and prospects.', icon: <Bot /> },
      { title: 'Email Scheduling', desc: 'Schedule your emails to be sent at the optimal time for maximum impact.', icon: <CalendarDays /> },
      { title: 'Bulk Email Send', desc: 'Send bulk emails to your leads and customers with our powerful email marketing tools.', icon: <Mail /> },
      { title: 'Low Spam Rate', desc: 'Our email system is designed for high deliverability and low spam rates.', icon: <ShieldCheck /> },
      { title: 'Best Performing Email Templates', desc: 'Use our proven email templates to get the best results from your campaigns.', icon: <FileText /> },
    ]
  },
  {
    id: 'accounting',
    title: 'Accounting',
    subtitle: 'Manage your finances and accounting with our integrated accounting tools.',
    color: '#FFB800',
    cards: [
      { title: 'Teams Hub', desc: 'A central hub for your team\'s financial data and accounting tasks.', icon: <Users2 /> },
      { title: 'Project time tracking', desc: 'Track time spent on projects to accurately bill your clients.', icon: <Clock /> },
      { title: 'Time estimates', desc: 'Estimate the time required for tasks and projects for better planning.', icon: <Timer /> },
      { title: 'Timesheets', desc: 'Manage and approve timesheets for your team with our easy-to-use tools.', icon: <Table /> },
      { title: 'Recurring tasks', desc: 'Automate recurring accounting tasks to save time and reduce errors.', icon: <History /> },
      { title: 'Dates and times', desc: 'Track important dates and times for your financial transactions.', icon: <CalendarDays /> },
      { title: 'Approvals', desc: 'Set up approval workflows for your financial documents and transactions.', icon: <CheckSquare /> },
      { title: 'Planner', desc: 'Plan your financial activities and tasks with our integrated planner.', icon: <Calendar /> },
      { title: 'Scheduling', desc: 'Schedule financial tasks and reminders to stay on top of your finances.', icon: <CalendarDays /> },
    ]
  },
  {
    id: 'point-of-sale',
    title: 'Point of Sale',
    subtitle: 'Manage your sales, inventory, and customers with our powerful POS system.',
    color: '#FF00D6',
    cards: [
      { title: 'Easy To Use No Training Reqiured', desc: 'Our POS system is intuitive and easy to use, with no training required.', icon: <MousePointer2 /> },
      { title: 'Revunue+Profit Metrics', desc: 'Track your revenue and profit metrics in real-time with our dashboard.', icon: <BarChart3 /> },
      { title: 'Realtime Product Inventory', desc: 'Manage your product inventory in real-time to avoid stockouts.', icon: <Database /> },
      { title: 'Customer Billing/Invoicing', desc: 'Create and manage customer bills and invoices with our POS system.', icon: <FileText /> },
      { title: 'Incoice History', desc: 'Keep a record of all your invoices and billing history for easy reference.', icon: <History /> },
      { title: 'Sales Record', desc: 'Track all your sales and transactions with our detailed sales records.', icon: <Book /> },
      { title: 'Hot Product Metrics', desc: 'Identify your best-selling products with our hot product metrics.', icon: <Flame /> },
      { title: 'Low Inventory Alerts', desc: 'Get alerts when your inventory is running low to avoid stockouts.', icon: <Bell /> },
      { title: 'Direct CRM Integration', desc: 'Integrate with our CRM to manage your customer relationships effectively.', icon: <Plug /> },
      { title: 'Branded Invoice', desc: 'Create branded invoices with your company logo and contact information.', icon: <FileText /> },
      { title: 'Colorful Invoice', desc: 'Design colorful and attractive invoices to impress your customers.', icon: <Palette /> },
      { title: 'Restuarant POS', desc: 'A specialized POS system for restaurants with table and floor management.', icon: <Factory /> },
      { title: 'Table & Floors Setup', desc: 'Set up and manage your restaurant\'s tables and floors with ease.', icon: <Layout /> },
      { title: 'Table Rotation Metrics', desc: 'Track table rotation and turnover to optimize your restaurant\'s efficiency.', icon: <ArrowRightLeft /> },
      { title: 'Per Table Revenue', desc: 'Analyze the revenue generated per table to identify your most profitable areas.', icon: <BarChart3 /> },
    ]
  },
  {
    id: 'shifts-management',
    title: 'Shifts Management',
    subtitle: 'Manage employee shifts and schedules with our easy-to-use shift management tools.',
    color: '#4A2FFF',
    cards: [
      { title: 'Weekly Roster', desc: 'Create and manage your weekly employee roster with our intuitive tools.', icon: <CalendarDays /> },
      { title: 'Attendance Export', desc: 'Export attendance data for payroll and other administrative purposes.', icon: <FileSearch /> },
      { title: 'Leave Requests', desc: 'Manage employee leave requests and approvals with our streamlined system.', icon: <Briefcase /> },
      { title: 'Leave Acceptance/rejection', desc: 'Accept or reject leave requests with a single click and notify your employees.', icon: <Check /> },
      { title: 'Holidays Request', desc: 'Manage holiday requests and approvals to ensure proper staffing levels.', icon: <CalendarDays /> },
      { title: 'Recurring/Regular Shifts', desc: 'Set up recurring and regular shifts for your employees to save time.', icon: <History /> },
      { title: 'AI Shift Planner', desc: 'Let our AI plan your employee shifts for optimal coverage and efficiency.', icon: <Bot /> },
      { title: 'Employee Shift Notification', desc: 'Notify your employees about their upcoming shifts and any changes.', icon: <Bell /> },
      { title: 'Shift Provenance', desc: 'Track the history and changes of your employee shifts for auditing purposes.', icon: <History /> },
      { title: 'Shift Auditibility', desc: 'Audit your employee shifts to ensure compliance and accuracy.', icon: <ShieldCheck /> },
    ]
  },
  {
    id: 'privacy-and-compliance',
    title: 'PRIVACY & COMPLIANCE',
    subtitle: 'Ensure your data is safe and compliant with our robust privacy and security features.',
    color: '#838383',
    cards: [
      { title: 'GDPR', desc: 'Our platform is fully compliant with GDPR to protect your data and privacy.', icon: <Shield /> },
      { title: 'Role Based Access Control', desc: 'Control access to your data with our role-based access control system.', icon: <Key /> },
      { title: 'TLS Encryption', desc: 'All your data is encrypted with TLS to ensure its security and privacy.', icon: <Lock /> },
      { title: 'Organization Data Isolation', desc: 'Your organization\'s data is isolated and secure from other organizations.', icon: <Database /> },
    ]
  },
  {
    id: 'personalization',
    title: 'CUSTOMIZATION & PERSONALIZATION',
    subtitle: 'Customize and personalize your experience to fit your unique needs and preferences.',
    color: '#7B61FF',
    isIconOnly: true,
    cards: [
      { title: 'Custom color themes', desc: 'Personalize your workspace with custom color themes and branding.', icon: <Palette className="w-6 h-6 text-purple-600" /> },
      { title: 'Dark mode', desc: 'Switch to dark mode for a better viewing experience in low-light environments.', icon: <Monitor className="w-6 h-6 text-purple-600" /> },
      { title: 'Localization', desc: 'Use our platform in your preferred language with our localization options.', icon: <Globe className="w-6 h-6 text-purple-600" /> },
      { title: 'Custom notifications', desc: 'Customize your notification settings to stay informed about what matters most.', icon: <Bell className="w-6 h-6 text-purple-600" /> },
      { title: 'High configurability', desc: 'Our platform is highly configurable to meet your specific needs and workflow.', icon: <Settings className="w-6 h-6 text-purple-600" /> },
      { title: 'Timezone Settings', desc: 'Set your timezone to ensure all your data and notifications are accurate.', icon: <Clock className="w-6 h-6 text-purple-600" /> },
      { title: 'Workdays Settings', desc: 'Define your workdays and hours to customize your scheduling and availability.', icon: <CalendarDays className="w-6 h-6 text-purple-600" /> },
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
                  <div key={idx} className="bg-white rounded-2xl p-8 border border-gray-100 hover:shadow-xl hover:border-transparent transition-all group flex flex-col h-full cursor-pointer">
                    {section.isIconOnly ? (
                      <div className="mb-4">
                        {card.icon}
                      </div>
                    ) : (
                      <div className="mb-4 text-gray-400 group-hover:text-[#7B61FF] transition-colors">
                        {React.cloneElement(card.icon as React.ReactElement, { size: 36, strokeWidth: 2 })}
                      </div>
                    )}
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[#7B61FF] transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-base text-gray-500 leading-relaxed">
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
