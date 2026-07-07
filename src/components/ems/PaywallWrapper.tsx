"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PaywallScreen } from "./PaywallScreen";

export function PaywallWrapper({ children }: { children: React.ReactNode }) {
  const { userData, loading } = useAuth();
  const [orgData, setOrgData] = useState<any>(null);

  useEffect(() => {
    if (loading) return;
    if (userData) {
      const targetOrgId = userData.ownedOrgId || userData.orgId;
      if (targetOrgId) {
        getDoc(doc(db, "organizations", targetOrgId)).then(d => {
          if (d.exists()) setOrgData({ id: d.id, ...d.data() });
        }).catch(console.error);
      }
    }
  }, [userData, loading]);

  const isSubscriptionActive = orgData?.subscriptionExpiry 
    ? orgData.subscriptionExpiry.toDate() > new Date() 
    : true; // Default to true while loading to prevent flash

  if (!isSubscriptionActive) {
    return (
      <div className="h-full w-full bg-background overflow-y-auto p-4 md:p-6 custom-scrollbar flex-1">
        <PaywallScreen orgData={orgData} userData={userData} />
      </div>
    );
  }

  return <>{children}</>;
}
