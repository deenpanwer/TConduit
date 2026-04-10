'use client';

import React from 'react';
import { useTeam } from '@/hooks/use-team';
import { OwnerCockpit } from './OwnerCockpit';
import { IntelligenceUnit } from './IntelligenceUnit';
import { AIOrgPulse } from './AIOrgPulse';
import { PerformanceHorizon } from './PerformanceHorizon';
import { ApplicationUsage } from './ApplicationUsage';
import { WorkQualityFlow } from './WorkQualityFlow';
import { EliteWorkforce } from './EliteWorkforce';
import { GlobalPresence } from './GlobalPresence';
import { WorkforceRegistry } from './WorkforceRegistry';
import { Shimmer } from './shared/Shimmer';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { isEmployeeOnline } from '@/lib/utils';

const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
  }
};

interface MasterDashboardProps {
  orgData: any;
  ownerData: any;
}

export const MasterDashboard = ({ orgData, ownerData: initialOwnerData }: MasterDashboardProps) => {
  const { employees, owner: enrichedOwner, stats, loading, selectedDate, setSelectedDate } = useTeam();
  const ownerData = enrichedOwner || initialOwnerData;

  const dateStr = React.useMemo(() => format(selectedDate, "yyyy-MM-dd"), [selectedDate]);

  // --- SINGLE-PASS DATA ENGINE ---
  // SCHEMA COMPATIBILITY NOTICE:
  // This engine processes both Legacy and Modern workShift JSON structures.
  // Legacy: liveBreakdown[app] is a number.
  // Modern: liveBreakdown[app] is an object with { totalSeconds, activeSeconds, ... }.
  //
  // PHASE-OUT GUIDE:
  // Once 100% of employees migrate to modern app versions, simplify this engine
  // to remove 'typeof data === "number"' checks.
  const processedData = React.useMemo(() => {
    if (employees.length === 0) return { workforce: [], performance: [], sankey: { nodes: [], links: [] } };

    const now = new Date();
    const currentHour = now.getHours();
    const displayOrgName = (ownerData?.orgName || orgData?.orgName || "ORGANIZATION").toUpperCase();

    // 1. Initialize Performance Buckets
    const hourlyBuckets = Array.from({ length: 24 }, (_, i) => ({
        date: `${i.toString().padStart(2, '0')}:00`,
        fullDate: `Selected Day at ${i.toString().padStart(2, '0')}:00`,
        actualHours: 0,
        projectedHours: null as number | null
    }));

    // 2. Initialize Sankey Map
    const sankeyNodes: any[] = [{ name: displayOrgName, color: "#3b82f6" }];
    const sankeyLinks: any[] = [];
    const appNodeIndices: Record<string, number> = {};

    // 3. Process Workforce Table
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

            // Metrics aggregation for Selected Date
            if (shift.id.startsWith(dateStr)) {
                totalDaySeconds += shiftTotalSeconds;
                
                const metrics = shift.liveMetrics || shift.metrics || {};
                totalDayKeystrokes += (metrics.keystrokes || 0);
                totalDayClicks += (metrics.mouseClicks || 0);
                totalDayDistance += (metrics.mouseDistance || 0);

                // Process App Breakdown (Legacy: number, New: object)
                if (shift.liveBreakdown) {
                    Object.entries(shift.liveBreakdown).forEach(([appName, data]) => {
                        const s = typeof data === 'number' ? data : (data as any)?.totalSeconds || 0;
                        empAppMap[appName] = (empAppMap[appName] || 0) + s;
                    });
                }

                // Process Hourly Pulse (Legacy: flat, New: nested metrics)
                if (shift.hourlyPulse) {
                    Object.entries(shift.hourlyPulse).forEach(([hourKey, data]: [string, any]) => {
                        const hourIdx = parseInt(hourKey);
                        const hMetrics = data?.metrics || data; 
                        const hourSeconds = hMetrics.seconds || hMetrics.totalSeconds || 0;
                        
                        if (hourIdx >= 0 && hourIdx < 24) {
                            hourlyBuckets[hourIdx].actualHours += hourSeconds / 3600;
                        }
                        
                        // Collect for sparkline (Keystrokes + Clicks + Distance)
                        const activityScore = (hMetrics.keystrokes || 0) + ((hMetrics.mouseClicks || 0) * 5) + ((hMetrics.mouseDistance || 0) / 100);
                        
                        sparklineActivity.push({
                            timestamp: hourIdx,
                            score: activityScore
                        });
                    });
                }
            }
        });

        // Finalize Employee Node & Links for Sankey
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
            isLive: isEmployeeOnline(emp),
            prevHours: sparklineActivity.sort((a, b) => a.timestamp - b.timestamp).slice(-10).map(a => a.score)
        };
    });

    // 4. Finalize Performance Chart (Projections)
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-12 pb-24 animate-pulse">
        <Shimmer className="h-96 w-full rounded-[3rem]" />
        <Shimmer className="h-48 w-full rounded-[2.5rem]" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Shimmer className="h-[450px] lg:col-span-2 rounded-[2.5rem]" />
          <Shimmer className="h-[450px] rounded-[2.5rem]" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-24">
      {/* HUB 1: Cockpit */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={sectionVariants}>
        <OwnerCockpit 
            orgName={ownerData?.orgName || orgData?.orgName || orgData?.name || "Your Organization"} 
            ownerData={ownerData} 
            stats={stats}
            logoUrl={orgData?.logoUrl}
        />
      </motion.div>

      {/* NEW HUB: AI Collective Pulse */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={sectionVariants}>
        <AIOrgPulse 
          employees={[...employees, ownerData].filter(Boolean)} 
          selectedDate={selectedDate} 
          orgName={ownerData?.orgName || orgData?.orgName || orgData?.name || "Your Organization"}
        />
      </motion.div>

      {/* HUB 2: Intelligence Brief */}
      {/* <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={sectionVariants}>
        <IntelligenceUnit 
            velocity={stats?.velocity || 100} 
            topApp={stats?.topApps?.[0]?.name}
            activeCount={stats?.activeEmployees}
            totalHoursToday={stats?.totalHoursToday || "0.0"}
        />
      </motion.div> */}

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

      {/* HUB 6: Global Reach */}
      {/* <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={sectionVariants}>
        <GlobalPresence employees={employees} />
      </motion.div> */}

      {/* HUB 7: Ledger */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={sectionVariants}>
        <ForceRegistry employees={employees} />
      </motion.div>
    </div>
  );
};

const ForceRegistry = WorkforceRegistry;
