
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import HeroSection from '@/components/ui/hero-section-with-gradient';

const FALLBACK_DOWNLOAD_LINK = "https://github.com/deenpanwer/TConduit/releases/download/1.0.7-2/Trac.Dairy.Setup.1.0.7-2.exe";

const OtherOSCard = ({ 
  icon, 
  title, 
  comingSoon, 
  href 
}: { 
  icon: React.ReactNode; 
  title: string; 
  comingSoon?: boolean; 
  href?: string;
}) => (
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
            href={href || FALLBACK_DOWNLOAD_LINK} 
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


export default function TracDiaryDownloadPage() {
  const [downloadUrl, setDownloadUrl] = useState(FALLBACK_DOWNLOAD_LINK);
  const [version, setVersion] = useState("1.0.7-2");

  useEffect(() => {
    fetch('https://api.github.com/repos/deenpanwer/TConduit/releases/latest')
      .then(res => res.json())
      .then(data => {
        const exeAsset = data.assets?.find((a: any) => a.name.toLowerCase().endsWith('.exe'));
        if (exeAsset) {
          setDownloadUrl(exeAsset.browser_download_url);
          setVersion(data.tag_name);
        }
      })
      .catch(err => console.error("Update fetch failed:", err));
  }, []);

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
        <HeroSection 
          downloadUrl={downloadUrl} 
          version={version} 
        />

        {/* "Available for" Section */}
        <section className="py-24 sm:py-32 relative">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold font-poppins mb-4">Cross-Platform Support</h2>
                <p className="text-muted-foreground text-lg">
                    Download Trac Diary for your preferred operating system and start building your verifiable profile today.
                </p>
                {version && (
                  <p className="mt-4 text-sm font-bold uppercase tracking-widest text-primary/60">
                    Latest Version: {version}
                  </p>
                )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <OtherOSCard
                icon={<img src="/diary/windows.png" alt="Windows Icon" className="h-10 w-10" />}
                title="Windows OS"
                href={downloadUrl}
              />
              <OtherOSCard
                icon={<img src="/diary/apple-logo.png" alt="macOS Icon" className="h-10 w-10" />}
                title="MacOS"
                comingSoon
              />
              <OtherOSCard
                icon={<img src="/diary/linux.png" alt="Linux Icon" className="h-10 w-10" />}
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

