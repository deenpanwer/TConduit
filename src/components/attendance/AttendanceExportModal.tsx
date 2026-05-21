"use client";

import React, { useState } from "react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { cn, getUserAvatar } from "@/lib/utils";
import { generateAttendanceFile } from "@/lib/attendance-export-service";
import { useAttendance } from "@/hooks/use-attendance";

interface AttendanceExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSelectedEmployees?: string[]; // IDs
  initialFormat?: "csv" | "xlsx";
  allEmployees: { id: string; name: string }[];
}

export function AttendanceExportModal({
  isOpen,
  onClose,
  initialSelectedEmployees,
  initialFormat,
  allEmployees
}: AttendanceExportModalProps) {
  const [formatType, setFormatType] = useState<"csv" | "xlsx">(initialFormat || "csv");
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>(initialSelectedEmployees || allEmployees.map(e => e.id));
  const [dateRange, setDateRange] = useState<string>("1day");
  const [loading, setLoading] = useState(false);
  const { todayLogs } = useAttendance();

  // Sync format and employees if prop changes (for triggers)
  React.useEffect(() => {
    if (initialFormat) setFormatType(initialFormat);
    if (initialSelectedEmployees) setSelectedEmployees(initialSelectedEmployees);
  }, [initialFormat, initialSelectedEmployees]);

  const handleExport = async () => {
    setLoading(true);
    toast.info("Exporting in the background. Please do not close the tab.");
    try {
      const logsToExport = todayLogs.filter(l => selectedEmployees.includes(l.userId));
      await generateAttendanceFile(logsToExport, formatType, `attendance_export_${new Date().getTime()}`);
      
      toast.success("Export successful.");
      onClose();
    } catch (err) {
      toast.error("Failed to export data");
    } finally {
      setLoading(false);
    }
  };

  const toggleEmployee = (id: string) => {
    setSelectedEmployees(prev => 
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedEmployees(allEmployees.map(e => e.id));
  const deselectAll = () => setSelectedEmployees([]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-3xl border-border/50 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black uppercase tracking-tighter">Export Attendance</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Format</Label>
              <RadioGroup value={formatType} onValueChange={(v: "csv" | "xlsx") => setFormatType(v)} className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="csv" id="csv" />
                  <Label htmlFor="csv">CSV</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="xlsx" id="xlsx" />
                  <Label htmlFor="xlsx">Excel (XLSX)</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Time Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-full rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1day">1 Day</SelectItem>
                  <SelectItem value="1week">1 Week</SelectItem>
                  <SelectItem value="2week">2 Weeks</SelectItem>
                  <SelectItem value="3week">3 Weeks</SelectItem>
                  <SelectItem value="1month">1 Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Employees</Label>
                <div className="flex gap-2">
                    <Button variant="link" onClick={selectAll} className="text-[10px] h-auto p-0 uppercase font-black">All</Button>
                    <Button variant="link" onClick={deselectAll} className="text-[10px] h-auto p-0 uppercase font-black">None</Button>
                </div>
            </div>
            <ScrollArea className="h-60 rounded-2xl border border-border/50 bg-secondary/20 p-2">
                <div className="space-y-1">
                    {allEmployees.map(emp => (
                        <div key={emp.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-secondary transition-colors">
                            <div className="flex items-center gap-3">
                                <img src={getUserAvatar({ id: emp.id, email: emp.name })} className="size-8 rounded-full bg-secondary" alt={emp.name} />
                                <span className="text-sm font-bold">{emp.name}</span>
                            </div>
                            <Checkbox 
                                checked={selectedEmployees.includes(emp.id)} 
                                onCheckedChange={() => toggleEmployee(emp.id)} 
                            />
                        </div>
                    ))}
                </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleExport} disabled={loading || selectedEmployees.length === 0}>
            {loading ? "Exporting..." : "Start Export"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
