
"use client";

import { useEffect } from "react";
import { seedMockData } from "@/lib/mock-data";

export function MockDataSeeder() {
  useEffect(() => {
    seedMockData();
  }, []);

  return null;
}
