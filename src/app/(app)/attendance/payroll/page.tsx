"use client";

import React, { useState, useMemo } from "react";
import { 
  Users, Banknote, Calendar, ArrowUpDown, Search, 
  MoreHorizontal, User, Key, FileText, Plus,
  CheckCircle2, XCircle, ChevronRight, Download,
  MessageSquare, Loader2
} from "lucide-react";
import { format, parseISO, addDays, startOfMonth, endOfMonth } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { usePayroll, PayrollEmployee } from "@/hooks/use-payroll";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuLabel 
} from "@/components/ui/dropdown-menu";
import { 
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription 
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, getUserAvatar } from "@/lib/utils";
import { EmployeeModal } from "@/components/payroll/EmployeeModal";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function PayrollPage() {
  const router = useRouter();
  const { userData } = useAuth();
  const { employees, stats, loading, orgData } = usePayroll();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  
  // Modal & Drawer States
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<PayrollEmployee | null>(null);
  const [historyEmployee, setHistoryEmployee] = useState<PayrollEmployee | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("addUser") === "true") {
        setSelectedEmployee(null);
        setIsEmployeeModalOpen(true);
        // Clean up the URL query parameter without reloading page
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, []);

  const fetchHistory = async (emp: PayrollEmployee) => {
    setHistoryEmployee(emp);
    setHistoryLoading(true);
    try {
      const orgId = userData?.ownedOrgId || userData?.orgId;
      if (!orgId) throw new Error("No organization found");
      const payslipsRef = collection(db, "organizations", orgId, "payslips");
      const q = query(payslipsRef, where("userId", "==", emp.id), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const shareCredentials = (emp: PayrollEmployee) => {
    if (!emp.whatsapp) {
      toast.error("No WhatsApp number provided for this employee.");
      return;
    }
    const message = `Hello ${emp.name}!\n\nWelcome to the team. Here are your credentials for the Trac EMS system:\n\nEmail: ${emp.email}\nPassword: ${emp.systemPassword || "N/A"}\n\nPlease follow these steps to get started:\n1. Download the app from the Microsoft Store: https://apps.microsoft.com/detail/9nx8z15j752f\n2. Install and launch the application.\n3. Login using the credentials provided above.\n\nBest regards,\nHuman Resources`;
    const url = `https://wa.me/${emp.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const processedEmployees = useMemo(() => {
    let result = [...employees];
    if (searchTerm) {
      result = result.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return result.sort((a, b) => {
      if (sortBy === "salary") return b.salary - a.salary;
      return a.name.localeCompare(b.name);
    });
  }, [employees, searchTerm, sortBy]);

  const cycleStart = orgData?.attendanceSettings?.payrollCycleStart || "25";
  
  const getCycleDateRange = () => {
    try {
      const today = new Date();
      const startDay = parseInt(cycleStart);
      if (isNaN(startDay)) return "Parsing Cycle...";

      let start = new Date(today.getFullYear(), today.getMonth(), startDay);
      if (today.getDate() < startDay) {
        start.setMonth(start.getMonth() - 1);
      }
      
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      end.setDate(end.getDate() - 1);
      
      return `${format(start, "MMM dd")} - ${format(end, "MMM dd, yyyy")}`;
    } catch (e) {
      return "Cycle logic error";
    }
  };

  if (loading) {
    return <div className="p-8 animate-pulse space-y-8">
      <div className="h-10 w-48 bg-secondary/50 rounded-xl" />
      <div className="grid grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-32 bg-secondary/30 rounded-[2rem]" />)}
      </div>
      <div className="h-[400px] bg-secondary/20 rounded-[2rem]" />
    </div>;
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      <div className="flex-1 overflow-auto custom-scrollbar focus:outline-none" tabIndex={0}>
        <div className="p-2 md:p-4 space-y-6 w-fit min-w-full">
          
          {/* Header Area */}
          <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md pb-4 pt-2 -mt-2">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-black uppercase tracking-tighter">Payroll Management</h1>
                  <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] opacity-60">
                    Cycle: {getCycleDateRange()}
                  </p>
                </div>
                <Button onClick={() => { setSelectedEmployee(null); setIsEmployeeModalOpen(true); }} className="rounded-2xl font-black uppercase tracking-widest text-xs h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-500/20">
                  <Plus className="mr-2" size={16} /> Onboard Staff
                </Button>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative group max-w-xl flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground transition-colors group-focus-within:text-emerald-500" />
                  <Input 
                    placeholder="Search staff members..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 rounded-2xl border-border/50 bg-card/50 font-bold focus-visible:ring-emerald-500/20" 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* KPI Area */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KPICard title="Monthly Expense" value={`${stats.totalExpense.toLocaleString()}`} subtitle="Projected Payout" icon={Banknote} color="blue" />
            <KPICard title="Staff Count" value={String(stats.totalStaff)} subtitle="Active Employee Records" icon={Users} color="emerald" />
            <KPICard title="Payment Progress" value={`${stats.paidCount} / ${stats.totalStaff}`} subtitle="Issued this cycle" icon={CheckCircle2} color="orange" />
          </div>

          {/* Payroll Table */}
          <Card className="border-border/50 shadow-sm rounded-[2.5rem] bg-card/80 border-t-4 border-t-emerald-500/50">
            <CardContent className="p-0">
              <table className="w-full text-left border-collapse min-w-[1200px]">
                <thead>
                  <tr className="border-y border-border/50 bg-secondary/5">
                    <th className="sticky top-[140px] z-20 p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-background/95 backdrop-blur-md shadow-sm">Member</th>
                    <th className="sticky top-[140px] z-20 p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-background/95 backdrop-blur-md shadow-sm">Designation</th>
                    <th className="sticky top-[140px] z-20 p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-background/95 backdrop-blur-md shadow-sm">Salary</th>
                    <th className="sticky top-[140px] z-20 p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-background/95 backdrop-blur-md shadow-sm">Department</th>
                    <th className="sticky top-[140px] z-20 p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center bg-background/95 backdrop-blur-md shadow-sm">Status</th>
                    <th className="sticky top-[140px] z-20 p-6 bg-background/95 backdrop-blur-md shadow-sm"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {processedEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-secondary/10 transition-colors group">
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-2xl bg-secondary/50 overflow-hidden border border-border/50 shrink-0 shadow-sm">
                            <img src={getUserAvatar({ id: emp.id, email: emp.name })} alt="" className="w-full h-full object-cover" />
                          </div>
                          <span className="text-sm font-black uppercase tracking-tight">{emp.name}</span>
                        </div>
                      </td>
                      <td className="p-6">
                        <Badge variant="outline" className="rounded-lg font-bold text-[10px] uppercase border-border/50 bg-secondary/20">{emp.designation}</Badge>
                      </td>
                      <td className="p-6 font-black text-sm text-emerald-600">
                        {emp.salary.toLocaleString()}
                      </td>
                      <td className="p-6 text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                        {emp.department}
                      </td>
                      <td className="p-6 text-center">
                        {emp.isPaid ? (
                          <div className="inline-flex flex-col items-center">
                            <Badge className="bg-emerald-500 text-white font-black text-[9px] uppercase tracking-tighter">Paid</Badge>
                            <span className="text-[8px] font-bold text-muted-foreground mt-1">{emp.lastPaymentDate ? format(parseISO(emp.lastPaymentDate), "MMM dd") : ""}</span>
                          </div>
                        ) : (
                          <Badge variant="secondary" className="bg-rose-500/10 text-rose-500 border-rose-500/20 font-black text-[9px] uppercase tracking-tighter">Not Paid</Badge>
                        )}
                      </td>
                      <td className="p-6 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-emerald-500/10 transition-all">
                              <MoreHorizontal size={18} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-2xl border-border/50 shadow-2xl p-2 min-w-[200px]">
                            <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-widest opacity-50 px-3 py-2">Management</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => router.push(`/attendance/payroll/${emp.id}`)} className="rounded-xl font-bold gap-2 p-3 cursor-pointer">
                              <User size={14} className="text-blue-500" />
                              <span>Open Profile</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setSelectedEmployee(emp); setIsEmployeeModalOpen(true); }} className="rounded-xl font-bold gap-2 p-3 cursor-pointer">
                              <Key size={14} className="text-emerald-500" />
                              <span>View Credentials</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => fetchHistory(emp)} className="rounded-xl font-bold gap-2 p-3 cursor-pointer">
                              <FileText size={14} className="text-purple-600" />
                              <span>Payroll History</span>
                            </DropdownMenuItem>
                            {emp.creationMode === 'owner-created' && (
                              <DropdownMenuItem onClick={() => shareCredentials(emp)} className="rounded-xl font-bold gap-2 p-3 cursor-pointer">
                                <MessageSquare size={14} className="text-emerald-600" />
                                <span>Share Credentials</span>
                              </DropdownMenuItem>
                            )}
                            <div className="h-px bg-border/50 my-1" />
                            <DropdownMenuItem onClick={() => router.push(`/attendance/payroll/builder?userId=${emp.id}`)} className="rounded-xl font-bold gap-2 p-3 cursor-pointer">
                              <FileText size={14} className="text-orange-500" />
                              <span>Issue Payslip</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </div>

      <EmployeeModal 
        isOpen={isEmployeeModalOpen} 
        onClose={() => setIsEmployeeModalOpen(false)} 
        employee={selectedEmployee}
      />

      {/* History Drawer */}
      <Sheet open={!!historyEmployee} onOpenChange={(open) => !open && setHistoryEmployee(null)}>
        <SheetContent className="w-[450px] sm:max-w-[450px] p-0 border-l border-border/40 bg-background/95 backdrop-blur-xl">
          <SheetHeader className="p-8 border-b border-border/50 bg-secondary/5">
             <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-600">
                   <FileText size={24} />
                </div>
                <div>
                   <SheetTitle className="text-2xl font-black uppercase tracking-tighter">Payroll History</SheetTitle>
                   <SheetDescription className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                      Statement archive for {historyEmployee?.name}
                   </SheetDescription>
                </div>
             </div>
          </SheetHeader>
          
          <ScrollArea className="h-[calc(100vh-120px)]">
             <div className="p-8 space-y-4">
                {historyLoading ? (
                  <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>
                ) : history.length > 0 ? (
                  history.map((ps) => (
                    <div key={ps.id} className="p-6 rounded-[2rem] border border-border/40 bg-card/30 flex items-center justify-between group hover:border-emerald-500/30 transition-all">
                       <div className="space-y-1">
                          <p className="text-sm font-black uppercase tracking-tight">{ps.month}</p>
                          <div className="flex items-center gap-2">
                             <Badge variant="outline" className="text-[9px] font-black uppercase border-emerald-500/20 text-emerald-600 bg-emerald-500/5">
                                {ps.status === 'paid' ? "Paid" : "Issued"}
                             </Badge>
                             <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">• {ps.netPay?.toLocaleString()}</span>
                          </div>
                       </div>
                       <Button variant="ghost" size="icon" className="rounded-xl">
                          <Download size={18} className="text-muted-foreground group-hover:text-emerald-500 transition-colors" />
                       </Button>
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center opacity-30">
                     <FileText size={48} className="mx-auto mb-4" />
                     <p className="text-xs font-black uppercase tracking-widest">No past records found</p>
                  </div>
                )}
             </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function KPICard({ title, value, subtitle, icon: Icon, color }: any) {
  const colorMap: any = {
    emerald: "border-l-emerald-500 text-emerald-600 bg-emerald-500/5",
    blue: "border-l-blue-500 text-blue-600 bg-blue-500/5",
    orange: "border-l-orange-500 text-orange-600 bg-orange-500/5",
  };

  return (
    <Card className={cn("border-border/50 shadow-sm rounded-[2rem] overflow-hidden border-l-4", colorMap[color])}>
      <CardContent className="p-6 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">{title}</p>
          <h3 className="text-2xl font-black tracking-tighter">{value}</h3>
          <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">{subtitle}</p>
        </div>
        <div className="size-10 rounded-2xl bg-background/50 flex items-center justify-center shadow-inner">
          <Icon className="size-5 opacity-80" />
        </div>
      </CardContent>
    </Card>
  );
}
