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
    Component Data & Calculation Documentation
    ------------------------------------------
    This parent dashboard is responsible for fetching all necessary data and performing
    primary calculations. Child components receive this data as props.

    1. PerformanceHorizon:
        - Data Requirements:
            - user doc: 0
            - timeEntries: All (for today, across the entire org)
            - projects: 0
            - screenshots: 0
        - Calculations (Performed HERE in `useMemo`):
            - `performanceData`: Creates 24 hourly buckets and sums the `duration` of all org-wide `timeEntries` that fall into each bucket for the current day.
        - Child Component Role: Purely for VISUALIZATION of the `performanceData` prop.

    2. WorkforceRegistry:
        - Data Requirements:
            - user doc: All
            - timeEntries: 0
            - projects: 0
            - screenshots: 0
        - Calculations (Performed HERE in `useMemo`):
            - `workforceData`: The `employees` array (derived from all user docs in the org) is processed here to calculate `hoursToday`, `totalHours`, and `topApp` for each employee.
        - Child Component Role: VISUALIZES the list of employees. Handles its own internal state for pagination (which users are visible).

    3. OwnerCockpit:
        - Data Requirements:
            - user doc: 1 (the owner's document)
            - timeEntries: All
            - projects: 0
            - screenshots: 0
        - Calculations (Performed HERE in `useMemo`):
            - All aggregate statistics (`totalStaff`, `totalHoursToday`, `activeEmployees`, `topApp`) are calculated in the parent `stats` object.
        - Child Component Role: Primarily for VISUALIZATION of owner data and the pre-calculated `stats` prop.

    4. IntelligenceUnit:
        - Data Requirements:
            - user doc: All
            - timeEntries: All
            - projects: 0
            - screenshots: All
        - Calculations (Performed HERE in `useMemo`):
            - `velocity`: Calculated from the average `productivityScore` of all employees.
            - `topApp`, `activeCount`: Derived from the parent `stats` object.
        - Child Component Role: VISUALIZES the organization's overall velocity and displays an AI-generated or formatted text brief.

    5. ApplicationUsage:
        - Data Requirements:
            - user doc: 0
            - timeEntries: All
            - projects: 0
            - screenshots: 0
        - Calculations (Performed HERE in `useMemo`):
            - The `stats` object calculates `topApps` by aggregating `hoursToday` for each application across all employees.
        - Child Component Role: Purely for VISUALIZATION of the `topApps` data passed in the `stats` prop.

    6. EliteWorkforce:
        - Data Requirements:
            - user doc: All
            - timeEntries: All
            - projects: 0
            - screenshots: 10 (per user, for sparkline)
        - Calculations (Performed HERE in `useMemo`):
            - The `workforceData` object is passed to this component. It contains pre-calculated `hoursToday` and `prevHours` (sparkline data) for each employee.
        - Child Component Role: VISUALIZES the top-performing employees and their individual stats.

    7. WorkQualityFlow:
        - Data Requirements:
            - user doc: All
            - timeEntries: 0
            - projects: 0
            - screenshots: All
        - Calculations (Performed HERE in `useMemo`):
            - `sankeyData`: Creates nodes for the org, employees, and apps, and calculates links between them based on time spent. App usage is determined by analyzing the `activeWindow` in screenshot data.
        - Child Component Role: Purely for VISUALIZATION of the `sankeyData` prop using the d3-sankey library.

    8. GlobalPresence:
        - Data Requirements:
            - user doc: All
            - timeEntries: 0
            - projects: 0
            - screenshots: 0
        - Calculations (Performed in the CHILD component):
            - `countryData`: Counts the number of employees per country based on the `lastLoginLocation` in the `employees` prop.
        - Child Component Role: Calculates and VISUALIZES a world map highlighting the countries where employees are located.
  */

  const { stats: realStats, loading, employees: realEmployees } = useDashboardStats();

  const employees = isDemo ? demoEmployees : realEmployees;

  const workforceData = React.useMemo(() => {
    const now = new Date();
    const todayStr = format(now, "yyyy-MM-dd");
    
    return employees.map(emp => {
        const entries = emp.timeEntries || [];
        
        // Sum today's seconds specifically
        const todaySeconds = entries.reduce((acc: number, entry: any) => {
            const start = entry.startTime?.toDate ? entry.startTime.toDate() : (entry.startTime?.seconds ? new Date(entry.startTime.seconds * 1000) : null);
            // Relaxed filter for Demo: use totalHoursClocked as fallback if no entries match current day
            if (isDemo && acc === 0 && emp.totalHoursClocked) return parseFloat(emp.totalHoursClocked) * 3600;
            
            if (start && format(start, "yyyy-MM-dd") === todayStr) return acc + (entry.duration || 0);
            return acc;
        }, 0);

        const totalSeconds = entries.reduce((acc: number, entry: any) => acc + (entry.duration || 0), 0);

        // Map most used app for this specific member
        const appMap: Record<string, number> = {};
        entries.forEach((e: any) => { 
            const name = e.projectName || "General";
            appMap[name] = (appMap[name] || 0) + (e.duration || 0); 
        });
        const topApp = Object.entries(appMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "---";

        return {
            ...emp, 
            location: emp.lastLoginLocation?.city || "Remote",
            hoursToday: (todaySeconds / 3600).toFixed(1),
            totalHours: (totalSeconds / 3600).toFixed(1),
            topApp,
            isLive: emp.heartbeat?.isCurrentlyRunning || false,
            prevHours: emp.screenshots?.slice(-10).map((s: any) => {
                const act = s.activity || {};
                // Combined activity score: keys + clicks*2 + distance/100
                return (act.keystrokes || 0) + ((act.mouseClicks || 0) * 2) + ((act.mouseDistance || 0) / 100);
            }).reverse() || []
        };
    });
  }, [employees, isDemo]);

  // Recalculate stats for demo if dynamic employees exist
  const stats = React.useMemo(() => {
    if (!isDemo) return realStats;
    
    // For demo mode, always calculate from current workforceData to keep it synced
    const totalHoursToday = workforceData.reduce((acc, emp) => acc + parseFloat(emp.hoursToday || 0), 0);
    const avgVelocity = employees.length > 0 
        ? employees.reduce((acc, emp) => acc + parseInt(emp.productivityScore || 0), 0) / employees.length 
        : 100;
    
    // Aggregate top apps from processed workforceData
    const appMap: Record<string, number> = {};
    workforceData.forEach(emp => {
        if (emp.topApp && emp.topApp !== "---") {
            appMap[emp.topApp] = (appMap[emp.topApp] || 0) + parseFloat(emp.hoursToday);
        }
    });

    const topApps = Object.entries(appMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, hours]) => ({ 
            name, 
            hours: hours.toFixed(1), 
            percentage: Math.round((hours / (totalHoursToday || 1)) * 100) 
        }));

    return {
      totalHoursToday: totalHoursToday.toFixed(1),
      velocity: Math.round(avgVelocity),
      topApps: topApps.length > 0 ? topApps : [{ name: "General", hours: totalHoursToday.toFixed(1), percentage: 100 }],
      activeEmployees: employees.filter(e => e.heartbeat?.isCurrentlyRunning).length,
      totalStaff: employees.length,
      locationsCount: new Set(employees.map(e => e.lastLoginLocation?.country)).size
    };
  }, [isDemo, workforceData, realStats, employees]);

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

    const todayStr = format(now, "yyyy-MM-dd");

    employees.forEach(emp => {
        const entries = emp.timeEntries || [];
        entries.forEach((entry: any) => {
            const start = entry.startTime?.toDate ? entry.startTime.toDate() : (entry.startTime?.seconds ? new Date(entry.startTime.seconds * 1000) : null);
            if (start && format(start, "yyyy-MM-dd") === todayStr) {
                const hour = start.getHours();
                hourlyBuckets[hour].actualHours += (entry.duration || 0) / 3600;
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
  }, [employees, isDemo, stats]);

  // Calculate Sankey Data for WorkQualityFlow
  const sankeyData = React.useMemo(() => {
    const displayOrgName = ownerData?.orgName || orgData?.orgName || orgData?.name || "ORGANIZATION";
    const nodes: any[] = [{ name: displayOrgName.toUpperCase(), color: "#3b82f6" }];
    const links: any[] = [];
    
    if (employees.length === 0) return { nodes, links };

    const employeeNodeIndices: Record<string, number> = {};
    const appNodeIndices: Record<string, number> = {};

    employees.forEach(emp => {
      // 1. Add Employee Node
      const empIdx = nodes.length;
      employeeNodeIndices[emp.id] = empIdx;
      nodes.push({ name: emp.name.toUpperCase(), color: "#8b5cf6" });

      const totalHours = parseFloat(emp.totalHoursClocked || 0);
      if (totalHours > 0) {
        // Link Org -> Employee
        links.push({ source: 0, target: empIdx, value: totalHours });

        // 2. Process App Usage for this employee
        const appFrequency: Record<string, number> = {};
        const logs = emp.screenshots || [];
        
        logs.forEach((log: any) => {
          const appName = log.activity?.activeWindow?.owner || "General";
          appFrequency[appName] = (appFrequency[appName] || 0) + 1;
        });

        Object.entries(appFrequency).forEach(([appName, count]) => {
          const appPercentage = logs.length > 0 ? count / logs.length : 0;
          const appHours = totalHours * appPercentage;

          if (appHours > 0.05) {
            if (!appNodeIndices[appName]) {
              appNodeIndices[appName] = nodes.length;
              nodes.push({ name: appName.toUpperCase(), color: "#10b981" });
            }
            
            // Link Employee -> App
            links.push({
              source: empIdx,
              target: appNodeIndices[appName],
              value: appHours
            });
          }
        });
      }
    });

    return { nodes, links };
  }, [employees, orgData]);

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
