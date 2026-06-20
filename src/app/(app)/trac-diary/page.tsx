'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import HeroSection from '@/components/ui/hero-section-with-gradient';
import { getDeviceCapabilities } from '@/lib/performance';

// COMMENTED OUT: GitHub direct .exe download — now distributing via Microsoft Store
// const FALLBACK_DOWNLOAD_LINK = "https://github.com/deenpanwer/TConduit/releases/download/1.0.7-2/Trac.Diary.Setup.1.0.7-2.exe";

const MICROSOFT_STORE_URL = "https://apps.microsoft.com/detail/9nx8z15j752f";

const OtherOSCard = ({ 
  icon, 
  title, 
  comingSoon, 
  onClick,
  platform,
  subtitle
}: { 
  icon: React.ReactNode; 
  title: string; 
  comingSoon?: boolean; 
  onClick?: () => void;
  platform: string;
  subtitle?: string;
}) => (
  <div 
    className={cn(
      "flex-1 p-8 rounded-2xl border bg-card/50 backdrop-blur-sm text-card-foreground shadow-sm transition-all duration-300",
      comingSoon ? "opacity-40" : "hover:shadow-xl hover:border-[#7B61FF]/50 hover:bg-card/80 group",
      !comingSoon && "cursor-pointer"
    )}
    onClick={!comingSoon ? onClick : undefined}
  >
    <div className="flex flex-col h-full items-center text-center">
      <div className="p-4 rounded-2xl bg-secondary/50 mb-4 group-hover:scale-110 transition-transform duration-300 flex items-center justify-center">
        {icon}
      </div>
      <div className="mt-2">
        <h3 className="text-lg font-bold font-poppins">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        {comingSoon ? (
          <p className="text-sm font-medium mt-2 text-muted-foreground">
            Coming Soon
          </p>
        ) : (
          <span
            className="text-sm font-medium mt-2 text-[#7B61FF] dark:text-white hover:underline block transition-colors font-bold uppercase tracking-wider"
          >
            Available Now →
          </span>
        )}
      </div>
    </div>
  </div>
);

export default function TracDiaryDownloadPage() {
  // COMMENTED OUT: GitHub-based download URL and version fetch
  // const [downloadUrl, setDownloadUrl] = useState(FALLBACK_DOWNLOAD_LINK);
  const [version, setVersion] = useState("1.0.8-18");

  useEffect(() => {
    fetch('https://api.github.com/repos/deenpanwer/TConduit/releases/latest')
      .then(res => res.json())
      .then(data => {
        if (data && data.tag_name) {
          setVersion(data.tag_name);
        }

        // COMMENTED OUT: If direct GitHub exe download is needed in the future
        // const exeAsset = data.assets?.find((a: any) => a.name.toLowerCase().endsWith('.exe'));
        // if (exeAsset) {
        //   setDownloadUrl(exeAsset.browser_download_url);
        // }
      })
      .catch(err => console.error("Update fetch failed:", err));
  }, []);

  const handleDownload = (platform: string) => {
    const deviceCapabilities = getDeviceCapabilities();

    // Fire-and-forget the logging event
    fetch('/api/trac-diary/increment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ version, platform, deviceCapabilities }),
    });

    // Open Microsoft Store instead of direct .exe download
    window.open(MICROSOFT_STORE_URL, '_blank');
  };

  // Structured SoftwareApplication JSON-LD Schema
  const diarySchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Trac Diary",
    "operatingSystem": "Windows 10, Windows 11",
    "applicationCategory": "BusinessApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "downloadUrl": MICROSOFT_STORE_URL,
    "softwareVersion": version,
    "publisher": {
      "@type": "Organization",
      "name": "TRAC AI LLC",
      "logo": "https://www.heytracai.com/trac-ai-logo.png"
    },
    "sameAs": [
      "https://apps.microsoft.com/detail/9nx8z15j752f",
    ]
  };

  return (
    <div className="bg-background min-h-screen text-foreground relative isolate">
      {/* Inject JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(diarySchema) }}
      />

      <header className="px-6 py-6 flex justify-between items-center z-50 relative">
        <Link href="/dashboard">
          <h1 className="font-poppins font-bold text-2xl text-foreground">
            TRAC AI
          </h1>
        </Link>
      </header>

      <main className="pb-12 sm:pb-20">
        <HeroSection 
          onDownload={() => handleDownload('Windows (Hero)')}
          version={version} 
        />

        {/* "Available for" Section with Microsoft Store Badge */}
        <section className="py-24 sm:py-32 relative">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold font-poppins mb-4">Cross-Platform Support</h2>
              <p className="text-muted-foreground text-lg">
                Download Trac Diary from the Microsoft Store — verified, secure, and always up to date.
              </p>
              {version && (
                <p className="mt-4 text-sm font-bold uppercase tracking-widest text-[#7B61FF]/80">
                  Latest Version: {version}
                </p>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Microsoft Store Integration — PRIMARY DOWNLOAD METHOD */}
              <div 
                className="sm:col-span-2 lg:col-span-1 p-10 rounded-3xl border-4 border-black dark:border-white bg-gradient-to-br from-[#7B61FF]/15 via-[#7B61FF]/5 to-transparent text-card-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] hover:-translate-y-2 transition-all duration-300 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                onClick={() => window.open(MICROSOFT_STORE_URL, '_blank')}
              >

                <div className="flex flex-col h-full items-center text-center justify-between">
                  <div className="p-5 rounded-2xl bg-white dark:bg-black/50 mb-6 group-hover:scale-110 transition-transform duration-300 flex items-center justify-center border-2 border-black dark:border-white shadow-lg">
                    <svg viewBox="0 0 23 23" className="h-12 w-12">
                      <path fill="#f35325" d="M0 0h11v11H0z"/>
                      <path fill="#81bc06" d="M12 0h11v11H12z"/>
                      <path fill="#05a6f0" d="M0 12h11v11H0z"/>
                      <path fill="#ffba08" d="M12 12h11v11H12z"/>
                    </svg>
                  </div>
                  <div className="mt-2">
                    <h3 className="text-xl font-extrabold font-poppins">Microsoft Store</h3>
                    <p className="text-xs text-muted-foreground mt-1">Verified & Secure App Store Install</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">Auto-updates • Trusted Publisher • Windows 10/11</p>
                    <span
                      className="text-xs font-black mt-6 text-white bg-black dark:bg-white dark:text-black py-3 px-8 inline-block rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg"
                    >
                      GET IT FROM MICROSOFT
                    </span>
                  </div>
                </div>
              </div>

              {/* COMMENTED OUT: Direct .exe download from GitHub — now using Microsoft Store exclusively
              <OtherOSCard
                icon={<img src="/diary/windows.png" alt="Windows Icon" className="h-10 w-10" />}
                title="Windows OS"
                subtitle="Direct Setup (.exe installer)"
                platform="Windows"
                onClick={() => handleDownload('Windows')}
              />
              */}

              {/* MacOS */}
              <OtherOSCard
                icon={<img src="/diary/apple-logo.png" alt="macOS Icon" width={40} height={40} className="h-10 w-10" />}
                title="MacOS"
                platform="macOS"
                comingSoon
              />

              {/* Linux */}
              <OtherOSCard
                icon={<img src="/diary/linux.png" alt="Linux Icon" width={40} height={40} className="h-10 w-10" />}
                title="Linux"
                platform="Linux"
                comingSoon
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
