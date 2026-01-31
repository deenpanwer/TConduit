"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useAuth } from "./use-auth";

export function useTeam() {
  const { user, userData } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      
      // CRITICAL: Filter out the current user (the Owner/Founder) 
      // so they don't appear in their own monitoring lists.
      const filteredList = empList.filter(emp => emp.id !== user?.uid);
      
      setEmployees(filteredList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData?.ownedOrgId, userData?.orgId, user?.uid]);

  return { employees, loading };
}