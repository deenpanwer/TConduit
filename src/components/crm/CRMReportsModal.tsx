"use client";

import React, { useState, useMemo } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Users, 
  Calendar as CalendarIcon, 
  Download, 
  Loader2, 
  FileText, 
  Check, 
  AlertCircle,
  Clock,
  Activity,
  Coins
} from "lucide-react";
import { useCRM } from "@/hooks/use-crm";
import { useTeam } from "@/hooks/use-team";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { 
  generateCRMExcelReport, 
  generateCRMPDFReport, 
  generateCRMCSVReport 
} from "@/lib/crm-export-service";
import { format } from "date-fns";

interface CRMReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CRMReportsModal({ isOpen, onClose }: CRMReportsModalProps) {
  const { leads, deals, calls, notes, config, invoices } = useCRM();
  const { employees } = useTeam();
  const { userData } = useAuth();

  const [selectedEmployees, setSelectedEmployees] = useState<string[]>(["all"]);
  const [intervalType, setIntervalType] = useState<"daily" | "monthly">("monthly");
  
  // Date states
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const today = new Date();
    return String(today.getMonth());
  });
  const [selectedYear, setSelectedYear] = useState<string>(() => {
    const today = new Date();
    return String(today.getFullYear());
  });

  // Report segments states
  const [includeAccountability, setIncludeAccountability] = useState(true);
  const [includeActivity, setIncludeActivity] = useState(true);
  const [includeRevenue, setIncludeRevenue] = useState(true);

  // Loading states
  const [exportingType, setExportingType] = useState<"pdf" | "excel" | "csv" | null>(null);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => String(currentYear - i));
  }, []);

  const months = [
    { label: "January", value: "0" },
    { label: "February", value: "1" },
    { label: "March", value: "2" },
    { label: "April", value: "3" },
    { label: "May", value: "4" },
    { label: "June", value: "5" },
    { label: "July", value: "6" },
    { label: "August", value: "7" },
    { label: "September", value: "8" },
    { label: "October", value: "9" },
    { label: "November", value: "10" },
    { label: "December", value: "11" }
  ];

  // Toggle single employee select
  const handleEmployeeToggle = (empId: string) => {
    if (empId === "all") {
      setSelectedEmployees(["all"]);
      return;
    }

    let newList = selectedEmployees.filter(id => id !== "all");
    if (newList.includes(empId)) {
      newList = newList.filter(id => id !== empId);
      if (newList.length === 0) {
        newList = ["all"];
      }
    } else {
      newList.push(empId);
    }
    setSelectedEmployees(newList);
  };

  const handleSelectAllEmployees = () => {
    setSelectedEmployees(["all"]);
  };

  // Compile final filter options
  const getFilterOptions = (): any => {
    let dateObj = new Date();
    if (intervalType === "daily") {
      dateObj = new Date(selectedDate);
    } else {
      dateObj = new Date(Number(selectedYear), Number(selectedMonth), 1);
    }

    return {
      employeeIds: selectedEmployees,
      interval: intervalType,
      date: dateObj,
      includeAccountability,
      includeActivity,
      includeRevenue
    };
  };

  const handleExport = async (type: "pdf" | "excel" | "csv") => {
    if (!includeAccountability && !includeActivity && !includeRevenue) {
      toast.error("Please select at least one report focus segment.");
      return;
    }

    setExportingType(type);
    
    try {
      const options = getFilterOptions();
      const payload = { leads, deals, calls, notes, employees, config, invoices };
      
      const dateString = format(options.date, intervalType === "daily" ? "yyyy-MM-dd" : "yyyy-MM");
      const baseFilename = `CRM_Performance_Report_${dateString}`;

      // Short delay to allow loading spinner to mount
      await new Promise(resolve => setTimeout(resolve, 300));

      if (type === "excel") {
        await generateCRMExcelReport(payload, options, baseFilename);
        toast.success("Excel report exported successfully!");
      } else if (type === "csv") {
        await generateCRMCSVReport(payload, options, baseFilename);
        toast.success("CSV report exported successfully!");
      } else if (type === "pdf") {
        await generateCRMPDFReport(payload, options, baseFilename);
        toast.success("PDF report generated successfully!");
      }
    } catch (error: any) {
      console.error("Export error:", error);
      toast.error(`Export failed: ${error.message || error}`);
    } finally {
      setExportingType(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-card/95 border border-border/40 shadow-2xl backdrop-blur-xl p-0 overflow-hidden rounded-[2rem] gap-0">
        <DialogHeader className="p-6 pb-4 border-b border-border/10 bg-secondary/10">
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-2xl bg-blue-600/10 text-blue-500">
              <FileText size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black tracking-tight uppercase">CRM Performance Reports</DialogTitle>
              <DialogDescription className="text-xs italic mt-0.5">Audit team adherence, touchpoints, call durations, and revenue conversions.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* 1. Employee Multi-Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Users size={12} className="text-blue-500" /> Select Team Members
              </h4>
              {selectedEmployees.length > 0 && !selectedEmployees.includes("all") && (
                <Button 
                  onClick={handleSelectAllEmployees} 
                  variant="ghost" 
                  className="h-6 text-[9px] font-black uppercase text-blue-500 hover:text-blue-600 hover:bg-blue-500/5 px-2"
                >
                  Clear to All
                </Button>
              )}
            </div>

            <div className="flex flex-wrap gap-2 p-3 rounded-2xl bg-secondary/20 border border-border/30 max-h-[140px] overflow-y-auto custom-scrollbar">
              <button
                onClick={() => handleEmployeeToggle("all")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-black uppercase tracking-wider transition-all ${
                  selectedEmployees.includes("all")
                    ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/15"
                    : "bg-card hover:bg-secondary/40 border-border/40 text-muted-foreground"
                }`}
              >
                All Employees
              </button>
              {employees.map(emp => {
                const isSelected = selectedEmployees.includes(emp.id);
                return (
                  <button
                    key={emp.id}
                    onClick={() => handleEmployeeToggle(emp.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/15"
                        : "bg-card hover:bg-secondary/40 border-border/40 text-foreground"
                    }`}
                  >
                    <Avatar className="size-4 border border-border/20">
                      <AvatarImage src={emp.avatar || emp.photoURL || `https://api.dicebear.com/9.x/initials/svg?seed=${emp.name || 'EMP'}`} />
                      <AvatarFallback className="text-[8px]">{emp.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>{emp.name || emp.displayName}</span>
                    {isSelected && <Check size={10} className="ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Date Basis Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <CalendarIcon size={12} className="text-blue-500" /> Interval Basis
              </h4>
              <div className="grid grid-cols-2 gap-2 p-1 bg-secondary/30 border border-border/20 rounded-xl">
                <button
                  type="button"
                  onClick={() => setIntervalType("monthly")}
                  className={`py-2 px-4 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                    intervalType === "monthly"
                      ? "bg-card border border-border/20 text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setIntervalType("daily")}
                  className={`py-2 px-4 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                    intervalType === "daily"
                      ? "bg-card border border-border/20 text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Daily
                </button>
              </div>
            </div>

            <div className="space-y-2 flex flex-col justify-end">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Select Timeframe</h4>
              {intervalType === "daily" ? (
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-10 rounded-xl border border-border/40 bg-card px-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
                />
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="h-10 rounded-xl border-border/40 bg-card">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map(m => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="h-10 rounded-xl border-border/40 bg-card">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map(y => (
                        <SelectItem key={y} value={y}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* 3. Report Focus Segments */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <AlertCircle size={12} className="text-blue-500" /> Customize Report Focus
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div 
                onClick={() => setIncludeAccountability(!includeAccountability)}
                className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                  includeAccountability 
                    ? "bg-blue-600/5 border-blue-500/30 hover:bg-blue-600/10" 
                    : "bg-card/40 border-border/20 opacity-60 hover:opacity-100"
                }`}
              >
                <Checkbox 
                  checked={includeAccountability} 
                  onCheckedChange={(checked) => setIncludeAccountability(!!checked)}
                  className="mt-0.5 rounded-md border-border"
                />
                <div>
                  <p className="text-xs font-black uppercase tracking-tight text-foreground flex items-center gap-1">
                    <Clock size={12} className="text-blue-500" /> Accountability
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">Missed follow-ups reasons directory and delays.</p>
                </div>
              </div>

              <div 
                onClick={() => setIncludeActivity(!includeActivity)}
                className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                  includeActivity 
                    ? "bg-blue-600/5 border-blue-500/30 hover:bg-blue-600/10" 
                    : "bg-card/40 border-border/20 opacity-60 hover:opacity-100"
                }`}
              >
                <Checkbox 
                  checked={includeActivity} 
                  onCheckedChange={(checked) => setIncludeActivity(!!checked)}
                  className="mt-0.5 rounded-md border-border"
                />
                <div>
                  <p className="text-xs font-black uppercase tracking-tight text-foreground flex items-center gap-1">
                    <Activity size={12} className="text-blue-500" /> Team Activity
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">Calls logged, call durations, notes, and stages count.</p>
                </div>
              </div>

              <div 
                onClick={() => setIncludeRevenue(!includeRevenue)}
                className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                  includeRevenue 
                    ? "bg-blue-600/5 border-blue-500/30 hover:bg-blue-600/10" 
                    : "bg-card/40 border-border/20 opacity-60 hover:opacity-100"
                }`}
              >
                <Checkbox 
                  checked={includeRevenue} 
                  onCheckedChange={(checked) => setIncludeRevenue(!!checked)}
                  className="mt-0.5 rounded-md border-border"
                />
                <div>
                  <p className="text-xs font-black uppercase tracking-tight text-foreground flex items-center gap-1">
                    <Coins size={12} className="text-blue-500" /> Revenue Won
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">Won/lost deals ratio and closed-won value.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 border-t border-border/10 bg-secondary/5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button
            onClick={() => handleExport("excel")}
            disabled={!!exportingType}
            className="rounded-2xl h-12 font-black uppercase tracking-wider text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/15"
          >
            {exportingType === "excel" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Exporting...
              </>
            ) : (
              <>
                <Download size={14} className="mr-2" /> Download Excel
              </>
            )}
          </Button>

          <Button
            onClick={() => handleExport("pdf")}
            disabled={!!exportingType}
            className="rounded-2xl h-12 font-black uppercase tracking-wider text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/15"
          >
            {exportingType === "pdf" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Exporting...
              </>
            ) : (
              <>
                <FileText size={14} className="mr-2" /> Download PDF
              </>
            )}
          </Button>

          <Button
            onClick={() => handleExport("csv")}
            disabled={!!exportingType}
            variant="outline"
            className="rounded-2xl h-12 font-black uppercase tracking-wider text-xs border-border/40 hover:bg-secondary"
          >
            {exportingType === "csv" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Exporting...
              </>
            ) : (
              <>
                <Download size={14} className="mr-2" /> Download CSV
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
