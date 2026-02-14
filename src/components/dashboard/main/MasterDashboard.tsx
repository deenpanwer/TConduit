'use client';

import React from 'react';
import { useDashboardStats } from '@/hooks/use-dashboard-stats';
import { OwnerCockpit } from './OwnerCockpit';
import { IntelligenceUnit } from './IntelligenceUnit';
import { PerformanceHorizon } from './PerformanceHorizon';
import { ApplicationUsage } from './ApplicationUsage';
import { WorkQualityFlow } from './WorkQualityFlow';
import { EliteWorkforce } from './EliteWorkforce';
import { GlobalPresence } from './GlobalPresence';
import { WorkforceRegistry } from './WorkforceRegistry';
import { Shimmer } from './shared/Shimmer';
import { motion } from 'framer-motion';
import { subDays, addDays, format } from 'date-fns';

import { DUMMY_EMPLOYEES, DUMMY_STATS, DUMMY_OWNER, DUMMY_ORG, DUMMY_ORG_BRIEF } from '@/lib/dashboard-demo-data';

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
  isDemo?: boolean;
  demoEmployees?: any[];
}

export const MasterDashboard = ({ orgData, ownerData, isDemo = false, demoEmployees = [] }: MasterDashboardProps) => {
  /*
    Component Data & Calculation Documentation (SHIFT-BASED ARCHITECTURE)
    ------------------------------------------
    This parent dashboard is responsible for fetching all necessary data and performing
    primary calculations using the workShifts model. Child components receive this data as props.

    1. PerformanceHorizon:
        - Data Source: workShifts (hourlyPulse)
        - Calculations: Aggregates seconds from 24 hourly buckets across all today's shifts.
        - Role: Visualization of the organization's real-time productivity flow.

    2. WorkforceRegistry:
        - Data Source: user doc + workShifts
        - Calculations: Determines "Hours Today" and "Top App" by iterating through daily shifts.
        - Role: Detailed personnel directory and status audit.

    3. OwnerCockpit:
        - Data Source: stats prop (aggregated from useDashboardStats)
        - Calculations: Sums output, staff counts, and live session totals org-wide.
        - Role: High-level management identity and global metrics.

    4. IntelligenceUnit:
        - Data Source: stats prop + productivityScores
        - Calculations: Derives velocity from the average productivity score across today's shifts.
        - Role: AI-generated organization status brief and performance dial.

    5. ApplicationUsage:
        - Data Source: workShifts (liveBreakdown)
        - Calculations: Aggregates organization-wide application usage into a ranked list.
        - Role: Resource composition audit.

    6. EliteWorkforce:
        - Data Source: workforceData (derived from workShifts)
        - Calculations: Processes "prevHours" sparkline by summing keystrokes/clicks from hourlyPulse.
        - Role: Top-performer spotlight and team activity summary.

    7. WorkQualityFlow:
        - Data Source: workShifts (liveBreakdown)
        - Calculations: Maps Organization -> Employee -> Application flow using shift totals.
        - Role: Balanced Sankey diagram showing time utilization.

    8. GlobalPresence:
        - Data Source: user doc (lastLoginLocation)
        - Calculations: Grouping employees by country code.
        - Role: Geographic workforce distribution map.
  */

  const { stats: realStats, loading, employees: realEmployees } = useDashboardStats();

  const employees = isDemo ? demoEmployees : realEmployees;

  // Shared Helper to extract JS Date safely
  const getDate = React.useCallback((ts: any) => {
    if (!ts) return new Date(0);
    if (ts.toDate) return ts.toDate();
    if (ts instanceof Date) return ts;
    if (ts.seconds) return new Date(ts.seconds * 1000);
    try { return new Date(ts); } catch(e) { return new Date(0); }
  }, []);

  const todayStr = React.useMemo(() => format(new Date(), "yyyy-MM-dd"), []);

  const workforceData = React.useMemo(() => {
    return employees.map(emp => {
        const shifts = emp.workShifts || [];
        
        let todaySeconds = 0;
        let totalSeconds = 0;
        const appMap: Record<string, number> = {};

        shifts.forEach((shift: any) => {
            const shiftStart = getDate(shift.startTime);
            const shiftTotalSeconds = shift.liveMetrics?.totalSeconds || 0;

            totalSeconds += shiftTotalSeconds;

            if (format(shiftStart, "yyyy-MM-dd") === todayStr) {
                todaySeconds += shiftTotalSeconds;

                if (shift.liveBreakdown) {
                    for (const appName in shift.liveBreakdown) {
                        appMap[appName] = (appMap[appName] || 0) + (shift.liveBreakdown[appName] || 0);
                    }
                }
            }
        });

        const hourlyActivity: { timestamp: number, score: number }[] = [];
        shifts.forEach((shift: any) => {
            const shiftDate = format(getDate(shift.startTime), "yyyy-MM-dd");
            if (shift.hourlyPulse) {
                Object.entries(shift.hourlyPulse).forEach(([hour, metrics]: [string, any]) => {
                    const dt = new Date(shiftDate);
                    dt.setHours(parseInt(hour));
                    hourlyActivity.push({
                        timestamp: dt.getTime(),
                        score: (metrics.keystrokes || 0) + ((metrics.mouseClicks || 0) * 2) + ((metrics.mouseDistance || 0) / 100)
                    });
                });
            }
        });

        const prevHours = hourlyActivity
            .sort((a, b) => a.timestamp - b.timestamp)
            .slice(-10)
            .map(a => a.score);

        const topApp = Object.entries(appMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "---";

        return {
            ...emp, 
            location: emp.lastLoginLocation?.city || "Remote",
            hoursToday: (todaySeconds / 3600).toFixed(1),
            totalHours: (totalSeconds / 3600).toFixed(1),
            topApp,
            isLive: emp.heartbeat?.isCurrentlyRunning || false,
            prevHours
        };
    });
  }, [employees, todayStr, getDate]);

  // Recalculate stats for demo if dynamic employees exist
  const stats = React.useMemo(() => {
    if (!isDemo) return realStats;
    
    // For demo mode, always calculate from current workforceData to keep it synced
    const totalHoursToday = workforceData.reduce((acc, emp) => acc + parseFloat(emp.hoursToday || 0), 0);
    const avgVelocity = employees.length > 0 
        ? employees.reduce((acc, emp) => acc + parseInt(emp.productivityScore || 0), 0) / employees.length 
        : 100;
    
    // Aggregate ALL apps from liveBreakdown for all employees (not just topApp)
    const orgAppMap: Record<string, number> = {};

    employees.forEach(emp => {
        const shifts = emp.workShifts || [];
        shifts.forEach((shift: any) => {
            const shiftStart = getDate(shift.startTime);
            if (format(shiftStart, "yyyy-MM-dd") === todayStr && shift.liveBreakdown) {
                Object.entries(shift.liveBreakdown).forEach(([app, secs]) => {
                    orgAppMap[app] = (orgAppMap[app] || 0) + (secs as number);
                });
            }
        });
    });

    const allApps = Object.entries(orgAppMap)
        .sort((a, b) => b[1] - a[1])
        .map(([name, seconds]) => ({ 
            name: name.replace(/_/g, ' '), 
            hours: (seconds / 3600).toFixed(1), 
            percentage: Math.round((seconds / (totalHoursToday * 3600 || 1)) * 100) 
        }));

    return {
      totalHoursToday: totalHoursToday.toFixed(1),
      velocity: Math.round(avgVelocity),
      topApps: allApps.length > 0 ? allApps : [{ name: "General", hours: totalHoursToday.toFixed(1), percentage: 100 }],
      activeEmployees: employees.filter(e => e.heartbeat?.isCurrentlyRunning).length,
      totalStaff: employees.length,
      locationsCount: new Set(employees.map(e => e.lastLoginLocation?.country)).size
    };
  }, [isDemo, workforceData, realStats, employees, todayStr, getDate]);

  const performanceData = React.useMemo(() => {
    if (employees.length === 0) return [];

    const now = new Date();
    const currentHour = now.getHours();

    if (isDemo) {
        const baseHours = parseFloat(stats?.totalHoursToday || "10");
        
        return Array.from({ length: 24 }, (_, i) => {
            const isPast = i <= currentHour;
            const hourLabel = `${i.toString().padStart(2, '0')}:00`;
            
            const peak = Math.exp(-Math.pow(i - 11, 2) / 10) + Math.exp(-Math.pow(i - 15, 2) / 10);
            const hours = (baseHours / 8) * peak * (0.8 + Math.random() * 0.4);
            const projected = (baseHours / 8) * peak;

            return {
                date: hourLabel,
                fullDate: `Today at ${hourLabel}`,
                actualHours: isPast ? parseFloat(hours.toFixed(1)) : null,
                projectedHours: i >= currentHour ? parseFloat(projected.toFixed(1)) : null,
            };
        });
    }

    // --- REAL DATA PATH ---
    const hourlyBuckets = Array.from({ length: 24 }, (_, i) => ({
        date: `${i.toString().padStart(2, '0')}:00`,
        fullDate: `Today at ${i.toString().padStart(2, '0')}:00`,
        actualHours: 0,
        projectedHours: null as number | null
    }));

    employees.forEach(emp => {
        const shifts = emp.workShifts || [];
        shifts.forEach((shift: any) => {
            const shiftStart = getDate(shift.startTime);
            if (format(shiftStart, "yyyy-MM-dd") === todayStr && shift.hourlyPulse) {
                Object.entries(shift.hourlyPulse).forEach(([hourKey, metrics]: [string, any]) => {
                    const hourIdx = parseInt(hourKey);
                    if (hourIdx >= 0 && hourIdx < 24) {
                        hourlyBuckets[hourIdx].actualHours += (metrics.seconds || 0) / 3600;
                    }
                });
            }
        });
    });    
    const totalHoursSoFar = hourlyBuckets.slice(0, currentHour + 1).reduce((acc, b) => acc + b.actualHours, 0);
    const hoursPassed = currentHour + 1;
    const avgHourlyRate = totalHoursSoFar > 0 ? totalHoursSoFar / hoursPassed : 0;

    return hourlyBuckets.map((b, i) => {
        const isPast = i <= currentHour;
        const projectedValue = avgHourlyRate > 0 ? Math.max(0.1, parseFloat(avgHourlyRate.toFixed(1))) : null;

        return {
            ...b,
            actualHours: isPast ? parseFloat(b.actualHours.toFixed(1)) : null,
            projectedHours: i >= currentHour 
                ? (i === currentHour ? parseFloat(b.actualHours.toFixed(1)) : projectedValue) 
                : null
        };
    });
  }, [employees, isDemo, stats, todayStr, getDate]);

  // Calculate Sankey Data for WorkQualityFlow
  const sankeyData = React.useMemo(() => {
    const displayOrgName = ownerData?.orgName || orgData?.orgName || orgData?.name || "ORGANIZATION";
    const nodes: any[] = [{ name: displayOrgName.toUpperCase(), color: "#3b82f6" }];
    const links: any[] = [];
    
    if (employees.length === 0) return { nodes, links };

    const appNodeIndices: Record<string, number> = {};

    employees.forEach(emp => {
      const shifts = emp.workShifts || [];
      const appMap: Record<string, number> = {};
      let totalAppSeconds = 0;

      shifts.forEach((shift: any) => {
          const shiftStart = getDate(shift.startTime);
          if (format(shiftStart, "yyyy-MM-dd") === todayStr && shift.liveBreakdown) {
              Object.entries(shift.liveBreakdown).forEach(([app, secs]) => {
                  const s = secs as number;
                  appMap[app] = (appMap[app] || 0) + s;
                  totalAppSeconds += s;
              });
          }
      });

      const totalAppHours = totalAppSeconds / 3600;

      if (totalAppHours > 0.05) {
        // 1. Add Employee Node ONLY if they have work today
        const empIdx = nodes.length;
        nodes.push({ name: emp.name.toUpperCase(), color: "#8b5cf6" });

        // 2. Link Org -> Employee (using sum of apps for balance)
        links.push({ source: 0, target: empIdx, value: totalAppHours });

        // 3. Process App Usage
        Object.entries(appMap).forEach(([appName, seconds]) => {
          const appHours = seconds / 3600;

          if (appHours > 0.01) {
            const formattedAppName = appName.replace(/_/g, ' ').toUpperCase();
            
            if (!appNodeIndices[formattedAppName]) {
              appNodeIndices[formattedAppName] = nodes.length;
              nodes.push({ name: formattedAppName, color: "#10b981" });
            }
            
            // Link Employee -> App
            links.push({
              source: empIdx,
              target: appNodeIndices[formattedAppName],
              value: appHours
            });
          }
        });
      }
    });

    return { nodes, links };
  }, [employees, orgData, ownerData, todayStr, getDate]);

  if (loading && !isDemo) {
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
            ownerData={isDemo ? { 
                ...DUMMY_OWNER, 
                ...ownerData,
                // Force real identity if it exists
                name: ownerData?.name || DUMMY_OWNER.name,
                role: ownerData?.role || DUMMY_OWNER.role,
                photoUrl: ownerData?.photoUrl || null // logoUrl in Cockpit takes priority anyway
            } : ownerData} 
            stats={stats}
            logoUrl={orgData?.logoUrl}
        />
      </motion.div>

      {/* HUB 2: Intelligence Brief */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={sectionVariants}>
        <IntelligenceUnit 
            velocity={stats?.velocity || 100} 
            orgBrief={isDemo ? DUMMY_ORG_BRIEF : null}
            topApp={stats?.topApps?.[0]?.name}
            activeCount={stats?.activeEmployees}
        />
      </motion.div>

      {/* HUB 3: Performance & Resources */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={sectionVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <PerformanceHorizon data={performanceData} />
        </div>
        <ApplicationUsage apps={stats?.topApps} />
      </motion.div>

      {/* HUB 4: Workforce Pulse */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={sectionVariants}>
        <EliteWorkforce 
          employees={workforceData} 
          totalHours={stats?.totalHoursToday || "0.0"} 
          isLoading={loading && !isDemo} 
        />
      </motion.div>

      {/* HUB 5: Quality Flow */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={sectionVariants} className="grid grid-cols-1 gap-8">
        <WorkQualityFlow 
          data={sankeyData} 
          isLoading={loading && !isDemo} 
        />
      </motion.div>

      {/* HUB 6: Global Reach */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={sectionVariants}>
        <GlobalPresence employees={employees} />
      </motion.div>

      {/* HUB 7: Ledger */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={sectionVariants}>
        <WorkforceRegistry employees={employees} />
      </motion.div>
    </div>
  );
};
