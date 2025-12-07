"use client";

import React from "react";
import { Shimmer } from "./shimmer"; // Assuming shimmer.tsx is in the same directory

const PlanSkeleton = () => (
  <div className="mt-4 w-full max-w-2xl rounded-lg border bg-card text-card-foreground shadow-sm p-6">
    {/* PlanHeader Mimic */}
    <div className="flex items-start justify-between mb-4">
      <div className="flex flex-col gap-2 w-full">
        <div className="flex items-center gap-2">
          {/* Icon Placeholder */}
          <div className="h-4 w-4 bg-muted rounded-full animate-pulse"></div>
          {/* Title Placeholder */}
          <div className="h-6 w-3/4 bg-muted rounded-md animate-pulse"></div>
        </div>
        {/* Description Placeholder */}
        <div className="h-4 w-1/2 bg-muted rounded-md animate-pulse mt-2"></div>
      </div>
      {/* Trigger Icon Placeholder */}
      <div className="h-8 w-8 bg-muted rounded-full animate-pulse shrink-0"></div>
    </div>

    {/* Key Steps Heading Placeholder */}
    <div className="h-5 w-48 bg-muted rounded-md animate-pulse mb-4"></div>

    {/* Key Steps List Mimic */}
    <div className="space-y-3">
      <div className="h-4 w-full bg-muted rounded-md animate-pulse"></div>
      <div className="h-4 w-11/12 bg-muted rounded-md animate-pulse"></div>
      <div className="h-4 w-full bg-muted rounded-md animate-pulse"></div>
      <div className="h-4 w-10/12 bg-muted rounded-md animate-pulse"></div>
      <div className="h-4 w-full bg-muted rounded-md animate-pulse"></div>
    </div>

    {/* PlanFooter Mimic (Button) */}
    <div className="mt-8 flex justify-end">
      <div className="h-9 w-32 bg-muted rounded-md animate-pulse"></div>
    </div>
    
    {/* Add Shimmer effect over the entire skeleton */}
    <Shimmer />
  </div>
);

export default PlanSkeleton;