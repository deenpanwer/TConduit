'use client';

import React from 'react';
import { OwnerCockpit } from '@/components/ems/main/OwnerCockpit';
import { AIOrgPulse } from '@/components/ems/main/AIOrgPulse';
import { PerformanceHorizon } from '@/components/ems/main/PerformanceHorizon';
import { ApplicationUsage } from '@/components/ems/main/ApplicationUsage';
import { WorkQualityFlow } from '@/components/ems/main/WorkQualityFlow';
import { EliteWorkforce } from '@/components/ems/main/EliteWorkforce';
import { WorkforceRegistry } from '@/components/ems/main/WorkforceRegistry';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { isEmployeeOnline } from '@/lib/utils';
import { demoEmployees, demoOrgData, demoOwnerData, demoStats } from '@/lib/demo-data';

const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
  }
};

export const DemoMasterDashboard = () => {
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  
  const employees = demoEmployees;
  const ownerData = demoOwnerData;
  const orgData = demoOrgData;
  const stats = demoStats;
  const loading = false;

  const dateStr = React.useMemo(() => format(selectedDate, "yyyy-MM-dd"), [selectedDate]);

  const processedData = React.useMemo(() => {
    if (employees.length === 0) return { workforce: [], performance: [], sankey: { nodes: [], links: [] } };

    const now = new Date();
    const currentHour = now.getHours();
    const displayOrgName = (ownerData?.orgName || orgData?.name || "ORGANIZATION").toUpperCase();

    const hourlyBuckets = Array.from({ length: 24 }, (_, i) => ({
        date: `${i.toString().padStart(2, '0')}:00`,
        fullDate: `Selected Day at ${i.toString().padStart(2, '0')}:00`,
        actualHours: 0,
        projectedHours: null as number | null
    }));

    const sankeyNodes: any[] = [{ name: displayOrgName, color: "#3b82f6" }];
    const sankeyLinks: any[] = [];
    const appNodeIndices: Record<string, number> = {};

    const workforce = employees.map(emp => {
        const shifts = emp.workShifts || [];
        let totalDaySeconds = 0;
        let totalSeconds = 0;
        const empAppMap: Record<string, number> = {};
        const sparklineActivity: { timestamp: number, score: number }[] = [];
        
        let totalDayKeystrokes = 0;
        let totalDayClicks = 0;
        let totalDayDistance = 0;

        shifts.forEach((shift: any) => {
            const shiftTotalSeconds = (shift.liveMetrics?.totalSeconds || shift.totalSeconds || 0);
            totalSeconds += shiftTotalSeconds;

            if (shift.date === dateStr || shift.id.startsWith(dateStr)) {
                totalDaySeconds += shiftTotalSeconds;
                
                const metrics = shift.liveMetrics || shift.metrics || {};
                totalDayKeystrokes += (metrics.keystrokes || 0);
                totalDayClicks += (metrics.mouseClicks || 0);
                totalDayDistance += (metrics.mouseDistance || 0);

                if (shift.liveBreakdown) {
                    Object.entries(shift.liveBreakdown).forEach(([appName, data]) => {
                        const s = typeof data === 'number' ? data : (data as any)?.totalSeconds || 0;
                        empAppMap[appName] = (empAppMap[appName] || 0) + s;
                    });
                }

                if (shift.hourlyPulse) {
                    Object.entries(shift.hourlyPulse).forEach(([hourKey, data]: [string, any]) => {
                        const hourIdx = parseInt(hourKey);
                        const hMetrics = data?.metrics || data; 
                        const hourSeconds = hMetrics.seconds || hMetrics.totalSeconds || 0;
                        
                        if (hourIdx >= 0 && hourIdx < 24) {
                            hourlyBuckets[hourIdx].actualHours += hourSeconds / 3600;
                        }
                        
                        const activityScore = (hMetrics.keystrokes || 0) + ((hMetrics.mouseClicks || 0) * 5) + ((hMetrics.mouseDistance || 0) / 100);
                        
                        sparklineActivity.push({
                            timestamp: hourIdx,
                            score: activityScore
                        });
                    });
                }
            }
        });

        const empTotalHoursSelectedDay = totalDaySeconds / 3600;
        if (empTotalHoursSelectedDay > 0.05) {
            const empIdx = sankeyNodes.length;
            sankeyNodes.push({ name: emp.name.toUpperCase(), color: "#8b5cf6" });
            sankeyLinks.push({ source: 0, target: empIdx, value: empTotalHoursSelectedDay });

            Object.entries(empAppMap).forEach(([appName, seconds]) => {
                const appHours = seconds / 3600;
                if (appHours > 0.01) {
                    const formattedAppName = appName.replace(/_/g, ' ').toUpperCase();
                    if (!appNodeIndices[formattedAppName]) {
                        appNodeIndices[formattedAppName] = sankeyNodes.length;
                        sankeyNodes.push({ name: formattedAppName, color: "#10b981" });
                    }
                    sankeyLinks.push({ source: empIdx, target: appNodeIndices[formattedAppName], value: appHours });
                }
            });
        }

        return {
            ...emp, 
            location: emp.lastLoginLocation?.city || "Remote",
            hoursToday: (totalDaySeconds / 3600).toFixed(1),
            totalHours: (totalSeconds / 3600).toFixed(1),
            totalDayKeystrokes,
            totalDayClicks,
            totalDayDistance,
            topApp: Object.entries(empAppMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "---",
            isLive: true,
            prevHours: sparklineActivity.sort((a, b) => a.timestamp - b.timestamp).slice(-10).map(a => a.score)
        };
    });

    const isToday = format(new Date(), "yyyy-MM-dd") === dateStr;
    const totalHoursSoFar = hourlyBuckets.slice(0, currentHour + 1).reduce((acc, b) => acc + b.actualHours, 0);
    const avgHourlyRate = totalHoursSoFar > 0 ? totalHoursSoFar / (currentHour + 1) : 0;

    const performance = hourlyBuckets.map((b, i) => {
        const isPast = !isToday || i <= currentHour;
        const projectedValue = isToday && avgHourlyRate > 0 ? Math.max(0.1, parseFloat(avgHourlyRate.toFixed(1))) : null;
        return {
            ...b,
            actualHours: isPast ? parseFloat(b.actualHours.toFixed(1)) : (isToday ? null : parseFloat(b.actualHours.toFixed(1))),
            projectedHours: isToday && i >= currentHour ? (i === currentHour ? parseFloat(b.actualHours.toFixed(1)) : projectedValue) : null
        };
    });

    return { 
        workforce, 
        performance, 
        sankey: { nodes: sankeyNodes, links: sankeyLinks } 
    };
  }, [employees, dateStr, ownerData, orgData, selectedDate]);

  return (
    <div className="w-full p-4 md:p-6 space-y-12 pb-24">
      {/* HUB 1: Cockpit */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={sectionVariants}>
        <OwnerCockpit 
            orgName={orgData?.name || "Your Organization"} 
            ownerData={ownerData} 
            stats={stats}
            logoUrl={null}
        />
      </motion.div>

      {/* NEW HUB: AI Collective Pulse */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={sectionVariants}>
        <AIOrgPulse 
          employees={[...employees, ownerData].filter(Boolean)} 
          selectedDate={selectedDate} 
          orgName={orgData?.name || "Your Organization"}
        />
      </motion.div>

      {/* HUB 3: Performance & Resources */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={sectionVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <PerformanceHorizon data={processedData.performance} />
        </div>
        <ApplicationUsage apps={stats?.topApps} />
      </motion.div>

      {/* HUB 4: Workforce Pulse */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={sectionVariants}>
        <EliteWorkforce 
          employees={processedData.workforce} 
          totalHours={stats?.totalHoursToday || "0.0"} 
          isLoading={loading} 
        />
      </motion.div>

      {/* HUB 5: Quality Flow */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={sectionVariants} className="grid grid-cols-1 gap-8">
        <WorkQualityFlow 
          data={processedData.sankey} 
          isLoading={loading} 
        />
      </motion.div>

      {/* HUB 7: Ledger */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={sectionVariants}>
        <WorkforceRegistry employees={employees} />
      </motion.div>
    </div>
  );
};
