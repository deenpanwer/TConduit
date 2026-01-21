"use client";

import { useState, useEffect } from "react";
import { HiringData } from "@/components/HiringModal";

export interface HiredCandidate {
  id: string;
  candidateName: string;
  hiringData: HiringData;
  hiredAt: string;
  status: "onboarding" | "active";
}

export function useHiredCandidates() {
  const [hiredCandidates, setHiredCandidates] = useState<HiredCandidate[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("hired_candidates");
    if (stored) {
      try {
        setHiredCandidates(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse hired candidates", e);
      }
    }
  }, []);

  const hireCandidate = (candidate: HiredCandidate) => {
    const updated = [...hiredCandidates, candidate];
    setHiredCandidates(updated);
    localStorage.setItem("hired_candidates", JSON.stringify(updated));
  };

  return { hiredCandidates, hireCandidate };
}
