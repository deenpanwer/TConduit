'use client';

import React from 'react';
import MinimalHero from '@/components/ui/hero-minimalism';
import CombinedFeaturedSection from '@/components/ui/combined-featured-section';

export default function Test12Page() {
  return (
    <div className="relative min-h-screen bg-background">
      {/* Hero minimalism is fixed/absolute in its implementation, 
          so we wrap it or place it first. 
          Note: MinimalHero uses position: fixed in its CSS, 
          so it might cover the whole screen. 
          We may need to adjust its styling if we want to scroll to the next section.
      */}
      <div className="relative h-screen">
        <MinimalHero />
      </div>

      <div className="relative z-10 bg-background">
        <CombinedFeaturedSection />
      </div>
    </div>
  );
}
