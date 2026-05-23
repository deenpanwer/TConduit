"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSidebar } from "@/hooks/use-sidebar";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Menu } from "lucide-react";
import { EmployeeHeader } from "@/components/ems/employee/EmployeeHeader";
import { ShiftPulse } from "@/components/ems/employee/ShiftPulse";
import { RecentEvidence } from "@/components/ems/employee/RecentEvidence";
import { ActivityMatrix } from "@/components/ems/employee/ActivityMatrix";
import { WorkHistory } from "@/components/ems/employee/WorkHistory";
import { AttendanceLedger } from "@/components/ems/employee/AttendanceLedger";
import { YieldCalculator } from "@/components/ems/employee/YieldCalculator";
import { WorkflowTimeline } from "@/components/ems/employee/WorkflowTimeline";
import { motion } from "framer-motion";
import { demoEmployees, demoOwnerData, demoScreenshots, demoTimeEntries } from "@/lib/demo-data";
import { GlobalDateSelector } from "@/components/ems/shared/GlobalDateSelector";
import { AIPersonnelPulse } from "@/components/ems/employee/AIPersonnelPulse";

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
  }
};

export default function DemoEmployeePage() {
  const { id } = useParams();
  const router = useRouter();
  const { setIsMobileOpen } = useSidebar();
  
  const [selectedDate, setSelectedDate] = useState(new Date());

  const employee = useMemo(() => {
    return demoEmployees.find(e => e.id === id);
  }, [id]);

  const workShifts = employee?.workShifts || [];
  const screenshots = demoScreenshots; 
  const timeEntries = demoTimeEntries; 

  const { currentShiftHours, todayTotalHours, topApp } = useMemo(() => {
    if (workShifts.length === 0) {
      return { currentShiftHours: "0.0", todayTotalHours: "0.0", topApp: "---" };
    }

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    let activeShiftSeconds = 0;
    let todayTotalSeconds = 0;
    const todayAppBreakdown: Record<string, number> = {};

    workShifts.forEach((shift: any) => {
      if (shift.id.startsWith(dateStr) || shift.date === dateStr) {
        const shiftDuration = shift.liveMetrics?.totalSeconds || shift.totalSeconds || 0;
        todayTotalSeconds += shiftDuration;
        activeShiftSeconds = shiftDuration; // mocking active shift for demo
        
        if (shift.liveBreakdown) {
          for (const appName in shift.liveBreakdown) {
            const data = shift.liveBreakdown[appName];
            const secs = typeof data === 'number' ? data : (data as any)?.totalSeconds || 0;
            todayAppBreakdown[appName] = (todayAppBreakdown[appName] || 0) + secs;
          }
        }
      }
    });

    const top = Object.entries(todayAppBreakdown)
      .sort(([, secondsA], [, secondsB]) => secondsB - secondsA)
      .find(([appName]) => appName !== "Idle")?.[0] || "---"; 

    return {
      currentShiftHours: (activeShiftSeconds / 3600).toFixed(1),
      todayTotalHours: (todayTotalSeconds / 3600).toFixed(1),
      topApp: top.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    };
  }, [employee, workShifts, selectedDate]);  

  const joinedDate = new Date("2024-01-15T08:00:00Z");

  const activeShift = useMemo(() => {
    return workShifts[0]; // just return first for demo pulse
  }, [workShifts]);

  if (!employee) {
    return <div className="p-8 text-center text-muted-foreground">Employee not found.</div>;
  }

  return (
    <main className="flex-1 flex flex-col overflow-hidden relative">
      <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar space-y-12 pb-32">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants}>
          <EmployeeHeader 
              employee={{...employee, createdAt: joinedDate}} 
              totalHours={todayTotalHours}
              topApp={topApp}
              joinedDate={joinedDate}
          />
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants}>
          <AIPersonnelPulse 
            employee={employee} 
            workShifts={workShifts} 
            screenshots={screenshots} 
          />
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants}>
          <ShiftPulse activeShift={activeShift} employee={employee} />
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants}>
          <RecentEvidence screenshots={screenshots} />
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants}>
          <AttendanceLedger employee={{...employee, createdAt: joinedDate}} workShifts={workShifts} joinedDate={joinedDate} />
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants}>
          <WorkflowTimeline workShifts={workShifts} />
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants} className="space-y-6">
          <ActivityMatrix workShifts={workShifts} screenshots={screenshots} />
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants}>
          <YieldCalculator 
              employeeId={id as string} 
              employeeName={employee?.name || "Member"} 
              workShifts={workShifts} 
              screenshots={screenshots}
              joinedDate={joinedDate}
          />
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants}>
          <WorkHistory 
            timeEntries={timeEntries} 
            screenshots={screenshots} 
            onLoadMore={() => {}}
          />
        </motion.div>
      </div>
    </main>
  );
}
