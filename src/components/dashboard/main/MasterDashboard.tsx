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

import { DUMMY_EMPLOYEES, DUMMY_STATS } from '@/lib/dashboard-demo-data';

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
}

export const MasterDashboard = ({ orgData, ownerData, isDemo = false }: MasterDashboardProps) => {
  const { stats: realStats, loading, employees: realEmployees } = useDashboardStats();

  const stats = isDemo ? DUMMY_STATS : realStats;
  const employees = isDemo ? DUMMY_EMPLOYEES : realEmployees;

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
            orgName={orgData?.orgName || orgData?.name || "Your Organization"} 
            ownerName={ownerData?.name || "Organization Owner"}
            ownerPhoto={ownerData?.photoUrl}
            stats={stats}
        />
      </motion.div>

      {/* HUB 2: Intelligence Brief */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={sectionVariants}>
        <IntelligenceUnit velocity={stats?.velocity || 100} />
      </motion.div>

      {/* HUB 3: Performance & Resources */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={sectionVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <PerformanceHorizon />
        </div>
        <ApplicationUsage apps={stats?.topApps} />
      </motion.div>

      {/* HUB 4: Workforce Pulse */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={sectionVariants}>
        <EliteWorkforce employees={employees} totalHours={stats?.totalHoursToday || "0.0"} stats={stats} />
      </motion.div>

      {/* HUB 5: Quality Flow */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={sectionVariants} className="grid grid-cols-1 gap-8">
        <WorkQualityFlow 
          employees={employees} 
          stats={stats} 
          orgName={orgData?.orgName || orgData?.name || "Your Organization"} 
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
