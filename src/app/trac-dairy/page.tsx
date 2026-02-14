
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const downloadOptions = [
    {
      label: "Latest",
      options: [
        { value: "win-latest", label: "Windows", href: "https://github.com/deenpanwer/TConduit/releases/download/1.0.7-1/Trac.Dairy.Setup.1.0.7-1.exe" },
      ]
    }
];

import HeroSection from '@/components/ui/hero-section-with-gradient';

const OtherOSCard = ({ icon, title, comingSoon }: { icon: React.ReactNode; title: string; comingSoon?: boolean }) => (
  <div className={cn(
    "flex-1 p-8 rounded-2xl border bg-card/50 backdrop-blur-sm text-card-foreground shadow-sm transition-all duration-300",
    comingSoon ? "opacity-40" : "hover:shadow-xl hover:border-primary/50 hover:bg-card/80 group"
  )}>
    <div className="flex flex-col h-full items-center text-center">
      <div className="p-4 rounded-2xl bg-secondary/50 mb-4 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <div className="mt-2">
        <h3 className="text-lg font-bold font-poppins">{title}</h3>
        {comingSoon ? (
          <p className="text-sm font-medium mt-2 text-muted-foreground">
            Coming Soon
          </p>
        ) : (
          <a 
            href="https://github.com/deenpanwer/TConduit/releases/download/1.0.7-1/Trac.Dairy.Setup.1.0.7-1.exe" 
            download
            className="text-sm font-medium mt-2 text-primary dark:text-white hover:underline block transition-colors"
          >
            Available Now →
          </a>
        )}
      </div>
    </div>
  </div>
);


export default function TracDairyDownloadPage() {

  return (
    <div className="bg-background min-h-screen text-foreground relative isolate">
       <header className="px-6 py-6 flex justify-between items-center z-50 relative">
        <Link href="/">
            <h1 className="font-poppins font-bold text-2xl text-foreground">
            TRAC AI
            </h1>
        </Link>
      </header>

      <main className="pb-12 sm:pb-20">
        <HeroSection />

        {/* "Available for" Section */}
        <section className="py-24 sm:py-32 relative">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold font-poppins mb-4">Cross-Platform Support</h2>
                <p className="text-muted-foreground text-lg">
                    Download Trac Dairy for your preferred operating system and start building your verifiable profile today.
                </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <OtherOSCard
                icon={<img src="/dairy/windows.png" alt="Windows Icon" className="h-10 w-10" />}
                title="Windows OS"
              />
              <OtherOSCard
                icon={<img src="/dairy/apple-logo.png" alt="macOS Icon" className="h-10 w-10" />}
                title="MacOS"
                comingSoon
              />
              <OtherOSCard
                icon={<img src="/dairy/linux.png" alt="Linux Icon" className="h-10 w-10" />}
                title="Linux"
                comingSoon
              />
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
