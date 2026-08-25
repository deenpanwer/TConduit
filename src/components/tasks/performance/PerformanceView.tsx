'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useTasks } from '@/hooks/useTasks';
import { useTeam } from '@/hooks/use-team';
import { TeamPerformanceOverview } from './TeamPerformanceOverview';
import { IndividualEmployeePerformance } from './IndividualEmployeePerformance';

interface PerformanceViewProps {
  onTaskClick?: (taskId: string) => void;
  initialEmployeeId?: string | null;
}

export function PerformanceView({ onTaskClick, initialEmployeeId }: PerformanceViewProps) {
  const { tasks } = useTasks();
  const { employees, owner } = useTeam();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const urlEmployeeId = searchParams.get('employeeId');

  const personnel = React.useMemo(() => {
    const list = [...(employees || [])].map((e: any) => ({
      ...e,
      id: e.id || e.uid || '',
    }));
    if (owner) {
      const ownerId = owner.id || owner.uid || 'owner';
      if (!list.some((e: any) => e.id === ownerId)) {
        list.unshift({
          ...owner,
          id: ownerId,
          role: owner.role || 'Owner',
        });
      }
    }
    return list.filter((p: any) => Boolean(p.id));
  }, [employees, owner]);

  const [selectedMonth, setSelectedMonth] = useState<Date>(() => new Date());
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(urlEmployeeId || initialEmployeeId || null);

  useEffect(() => {
    if (urlEmployeeId !== undefined) {
      setSelectedEmployeeId(urlEmployeeId);
    }
  }, [urlEmployeeId]);

  const handleSelectEmployee = (empId: string | null) => {
    setSelectedEmployeeId(empId);
    const params = new URLSearchParams(searchParams.toString());
    if (empId) {
      params.set('employeeId', empId);
    } else {
      params.delete('employeeId');
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  const selectedEmployee = React.useMemo(() => {
    if (!selectedEmployeeId) return null;
    return personnel.find((p: any) => p.id === selectedEmployeeId) || null;
  }, [selectedEmployeeId, personnel]);

  if (selectedEmployee) {
    return (
      <IndividualEmployeePerformance
        employee={selectedEmployee}
        tasks={tasks}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        onBack={() => handleSelectEmployee(null)}
        onTaskClick={onTaskClick}
      />
    );
  }

  return (
    <TeamPerformanceOverview
      personnel={personnel}
      tasks={tasks}
      selectedMonth={selectedMonth}
      onMonthChange={setSelectedMonth}
      onSelectEmployee={(emp) => handleSelectEmployee(emp.id)}
    />
  );
}
