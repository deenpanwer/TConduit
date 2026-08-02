import { 
  LayoutDashboard, Briefcase, ShoppingCart, ListTodo, CalendarDays, FileText
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
    id: "docs",
    title: "Docs & Policies",
    shortTitle: "Docs",
    description: "Policies & Onboarding Packets",
    icon: FileText,
    href: "/docs",
    color: "text-teal-500",
    bg: "bg-teal-500/10",
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
    shortTitle: "HR",
    description: "Human Resource & Reporting",
    icon: CalendarDays,
    href: "/attendance",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    released: true
  }
];
