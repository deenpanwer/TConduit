"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, getDocs, orderBy, limit, startAt, endAt } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";

export interface PayrollEmployee {
  id: string;
  name: string;
  designation: string;
  department?: string;
  salary: number;
  email: string;
  whatsapp?: string;
  systemPassword?: string;
  creationMode?: 'owner-created' | 'self-serve';
  avatar?: string;
  isPaid?: boolean;
  lastPaymentDate?: string | null;
}

export function usePayroll() {
  const { userData } = useAuth();
  const [employees, setEmployees] = useState<PayrollEmployee[]>([]);
  const [paidStatusMap, setPaidStatusMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [orgData, setOrgData] = useState<any>(null);

  const orgId = userData?.ownedOrgId || userData?.orgId;

  // 1. Listen to Organization Settings
  useEffect(() => {
    if (!orgId) return;
    const unsub = onSnapshot(doc(db, "organizations", orgId), (snap) => {
      if (snap.exists()) setOrgData(snap.data());
    }, (err) => console.error("Payroll: Org listener error:", err));
    return () => unsub();
  }, [orgId]);

  const cycleStartDay = orgData?.attendanceSettings?.payrollCycleStart || "25";

  // 2. Listen to Employees
  useEffect(() => {
    if (!orgId) return;

    const qUsers = query(collection(db, "users"), where("orgId", "==", orgId));
    
    const unsub = onSnapshot(qUsers, (userSnap) => {
      const emps: PayrollEmployee[] = userSnap.docs
        .map(d => {
          const data = d.data();
          if (data.active === false) return null;

          return {
            id: d.id,
            name: data.name || data.displayName || "Unknown",
            designation: data.designation || "Staff",
            department: data.department,
            salary: data.baseSalary || data.salary || 0,
            email: data.email || "",
            whatsapp: data.whatsapp || data.whatsappNumber,
            systemPassword: data.systemPassword,
            creationMode: (data.creationMode as 'owner-created' | 'self-serve') || "self-serve",
            avatar: data.photoUrl || data.photoURL || null,
          } as PayrollEmployee;
        })
        .filter((e): e is PayrollEmployee => e !== null);
      setEmployees(emps);
      if (loading && emps.length > 0) {
          // Keep loading true until we check payslips if we have emps
      } else if (emps.length === 0) {
          setLoading(false);
      }
    }, (err) => {
      console.error("Payroll: User listener error:", err);
      setLoading(false);
    });

    return () => unsub();
  }, [orgId]);

  // 3. Fetch Payslips (Payment Status) when employees or cycle changes
  useEffect(() => {
    if (!orgId || employees.length === 0) return;

    async function syncPaymentStatus() {
      try {
        const today = new Date();
        const startDay = parseInt(cycleStartDay);
        let cycleStartDate = new Date(today.getFullYear(), today.getMonth(), startDay);
        if (today.getDate() < startDay) {
          cycleStartDate.setMonth(cycleStartDate.getMonth() - 1);
        }
        const cycleEndDate = new Date(cycleStartDate);
        cycleEndDate.setMonth(cycleEndDate.getMonth() + 1);
        cycleEndDate.setDate(cycleEndDate.getDate() - 1);

        const payslipsRef = collection(db, "organizations", orgId, "payslips");
        const qPayslips = query(
          payslipsRef, 
          where("issueDate", ">=", format(cycleStartDate, "yyyy-MM-dd")),
          where("issueDate", "<=", format(cycleEndDate, "yyyy-MM-dd"))
        );
        
        const payslipSnap = await getDocs(qPayslips);
        const statusMap: Record<string, string> = {};
        payslipSnap.docs.forEach(d => {
            const data = d.data();
            statusMap[data.userId] = data.issueDate;
        });

        setPaidStatusMap(statusMap);
        setLoading(false);
      } catch (err) {
        console.error("Payroll: Error syncing payment status:", err);
        setLoading(false);
      }
    }

    syncPaymentStatus();
  }, [orgId, employees.length, cycleStartDay]);

  const finalEmployees = useMemo(() => {
    return employees.map(e => ({
      ...e,
      isPaid: !!paidStatusMap[e.id],
      lastPaymentDate: paidStatusMap[e.id] || null
    }));
  }, [employees, paidStatusMap]);

  const stats = useMemo(() => {
    const totalExpense = finalEmployees.reduce((sum, e) => sum + (e.salary || 0), 0);
    const paidCount = finalEmployees.filter(e => e.isPaid).length;
    return {
      totalExpense,
      paidCount,
      totalStaff: finalEmployees.length
    };
  }, [finalEmployees]);

  return {
    employees: finalEmployees,
    stats,
    loading,
    orgData
  };
}
