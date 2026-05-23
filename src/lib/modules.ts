import { 
  LayoutDashboard, Briefcase, ShoppingCart, ListTodo, CalendarDays, Calculator, Search, Factory, Users 
} from "lucide-react";

export const MODULE_CONFIG = [
  {
    id: "ems",
    title: "Employee Monitoring",
    shortTitle: "EMS",
    description: "Enterprise Management",
    icon: LayoutDashboard,
    href: "/ems",
    color: "text-primary",
    bg: "bg-primary/10",
    released: true
  },
  {
    id: "crm",
    title: "Customer Relations",
    shortTitle: "CRM",
    description: "Customer Relations",
    icon: Briefcase,
    href: "/crm",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    released: true
  },
  {
    id: "tasks",
    title: "Operations & Tasks",
    shortTitle: "Tasks",
    description: "Productivity & Ops",
    icon: ListTodo,
    href: "/tasks",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    released: true
  },
  {
    id: "pos",
    title: "Point of Sale System",
    shortTitle: "POS",
    description: "Retail & Transactions",
    icon: ShoppingCart,
    href: "/pos/checkout",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    released: true
  },
  {
    id: "attendance",
    title: "Human Resource",
    shortTitle: "Attendance",
    description: "Human Resource & Reporting",
    icon: CalendarDays,
    href: "/attendance",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    released: true
  },
  {
    id: "accounting",
    title: "Accounting & Finance",
    shortTitle: "Accounting",
    description: "Financial Management",
    icon: Calculator,
    href: "#",
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    released: false
  },
  {
    id: "lead-finder",
    title: "Lead Generation",
    shortTitle: "Lead Finder",
    description: "B2B Prospecting",
    icon: Search,
    href: "#",
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
    released: false
  },
  {
    id: "sap",
    title: "SAP & Manufacturing",
    shortTitle: "SAP/ERP",
    description: "Enterprise Planning",
    icon: Factory,
    href: "#",
    color: "text-slate-500",
    bg: "bg-slate-500/10",
    released: false
  },
  {
    id: "procurement",
    title: "Procurement & Supply",
    shortTitle: "Procurement",
    description: "Supply Chain",
    icon: ShoppingCart,
    href: "#",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
    released: false
  },
  {
    id: "ats",
    title: "Applicant Tracking",
    shortTitle: "ATS",
    description: "Recruitment Pipeline",
    icon: Users,
    href: "#",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    released: false
  }
];
