"use client";

import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useAuth } from "./use-auth";
import { useParams } from "next/navigation";

export function useTeam() {
  const { user, userData } = useAuth();
  const { id } = useParams();
  const [realEmployees, setRealEmployees] = useState<any[]>([]);
  
  const [demoEmployees, setDemoEmployees] = useState<any[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem("trac_demo_employees");
    try {
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("trac_demo_mode") === "true";
  });

  const [loading, setLoading] = useState(true);

  // Sync demo state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("trac_demo_mode", isDemoMode.toString());
    localStorage.setItem("trac_demo_employees", JSON.stringify(demoEmployees));
  }, [isDemoMode, demoEmployees]);

  useEffect(() => {
    const targetOrgId = userData?.ownedOrgId || userData?.orgId;
    if (!targetOrgId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "users"), 
      where("orgId", "==", targetOrgId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const empList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const filteredList = empList.filter(emp => emp.id !== user?.uid);
      setRealEmployees(filteredList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData?.ownedOrgId, userData?.orgId, user?.uid]);

  // Auto-disable demo mode if real employees exist
  useEffect(() => {
    if (realEmployees.length > 0 && isDemoMode) {
      setIsDemoMode(false);
    }
  }, [realEmployees.length, isDemoMode]);

  const toggleDemoMode = useCallback(() => {
    setIsDemoMode(prev => {
      const next = !prev;
      if (next && demoEmployees.length === 0) {
        import("@/lib/dashboard-demo-data").then(m => {
          setDemoEmployees([m.createDemoUser(undefined, undefined, undefined, "demo_member_1")]);
        });
      }
      return next;
    });
  }, [demoEmployees.length]);

  const addDemoEmployee = useCallback(() => {
    import("@/lib/dashboard-demo-data").then(m => {
      setDemoEmployees(prev => [...prev, m.createDemoUser()]);
    });
  }, []);

  const removeLastDemoEmployee = useCallback(() => {
    setDemoEmployees(prev => {
      const next = prev.slice(0, -1);
      if (next.length === 0) setIsDemoMode(false);
      return next;
    });
  }, []);

  const isViewingDemo = typeof id === 'string' && id.startsWith('demo_');
  const employees = (isDemoMode || isViewingDemo) ? demoEmployees : realEmployees;

  return { 
    employees, 
    realEmployees,
    demoEmployees,
    isDemoMode: isDemoMode || isViewingDemo,
    loading, 
    toggleDemoMode, 
    addDemoEmployee, 
    removeLastDemoEmployee 
  };
}