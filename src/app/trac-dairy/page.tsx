
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Apple } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


const downloadOptions = [
    {
      label: "Latest",
      options: [
        { value: "win32-latest", label: "Windows (32-bit)", href: "/downloads/TracDairy-Installer.exe" },
        { value: "win64-latest", label: "Windows (64-bit)", href: "/downloads/TracDairy-Installer-x64.exe" },
      ]
    }
];

const DownloadManager = () => {
    const [selectedDownload, setSelectedDownload] = useState('');
  
    const findDownload = (value: string) => {
        for (const group of downloadOptions) {
            const found = group.options.find(opt => opt.value === value);
            if (found) return found;
        }
        return null;
    };

    const currentDownload = findDownload(selectedDownload);
  
    return (
      <div className="flex flex-col items-start gap-4">
        <div className="flex items-center gap-2">
            <Select value={selectedDownload} onValueChange={setSelectedDownload}>
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder="Select a version" />
              </SelectTrigger>
              <SelectContent>
                {downloadOptions.map(group => (
                    <SelectGroup key={group.label}>
                        <SelectLabel>{group.label}</SelectLabel>
                        {group.options.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                ))}
              </SelectContent>
            </Select>

            <Button
                asChild
                size="lg"
                className="h-10 px-6 text-base rounded-md shadow-md bg-green-600 hover:bg-green-700 text-white disabled:bg-green-600/50 disabled:cursor-not-allowed"
                disabled={!currentDownload}
            >
                <a href={currentDownload?.href} download>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                </a>
            </Button>
        </div>
      </div>
    );
};

const OtherOSCard = ({ icon, title, comingSoon }: { icon: React.ReactNode; title: string; comingSoon?: boolean }) => (
  <div className={cn(
    "flex-1 p-6 rounded-lg border bg-card text-card-foreground shadow-sm transition-all",
    comingSoon ? "bg-muted/50 opacity-60" : "hover:shadow-md"
  )}>
    <div className="flex flex-col h-full">
      <div className="flex-grow">
        {icon}
      </div>
      <div className="mt-4">
        <a href="#" className={cn(
          "text-sm font-medium text-primary hover:underline",
          comingSoon && "pointer-events-none text-muted-foreground"
        )}>
          {title} {comingSoon ? '' : '→'}
          {comingSoon && <span className="text-xs ml-1">(Coming Soon)</span>}
        </a>
      </div>
    </div>
  </div>
);


export default function TracDairyDownloadPage() {

  return (
    <div className="bg-background min-h-screen text-foreground">
      <header className="absolute top-0 left-0 right-0 px-6 py-6 flex justify-between items-center z-10">
        <Link href="/" className="font-poppins font-bold text-2xl">
          TRAC
        </Link>
        <Link href="/join">
          <Button variant="outline" className="h-8 animate-shake">
            Join the Network
          </Button>
        </Link>
      </header>

      <main className="pt-24 pb-20">
        {/* Hero Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col gap-4">
              <h1 className="text-5xl font-bold font-playfair tracking-tight">Get Trac on your desktop</h1>
              <p className="text-lg text-muted-foreground">
                Build your verifiable work profile by letting our AI log your activity and identify your core competencies. Stay connected to opportunity.
              </p>
              <div className="mt-4">
                <DownloadManager />
              </div>
            </div>
            <div className="flex items-center justify-center">
              <Image
                src="https://picsum.photos/seed/app-ui/600/400"
                alt="Trac Dairy App UI"
                width={600}
                height={400}
                className="rounded-lg shadow-2xl"
                data-ai-hint="desktop app time tracking"
              />
            </div>
          </div>
        </section>

        {/* Feature 1 */}
        <section className="py-20">
          <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="flex items-center justify-center">
              <Image
                src="https://picsum.photos/seed/proof-of-work/600/400"
                alt="Verifiable Proof of Work"
                width={600}
                height={400}
                className="rounded-lg shadow-xl"
                data-ai-hint="abstract proof"
              />
            </div>
            <div className="flex flex-col gap-3">
              <h2 className="text-3xl font-bold font-playfair">Verifiable Proof of Work</h2>
              <p className="text-muted-foreground">
                Create an undeniable, minute-by-minute record of your work and competence that you can share with anyone. When you turn on the tracker, our AI builds a verifiable log of your contributions and skills.
              </p>
            </div>
          </div>
        </section>

        {/* Feature 2 */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col gap-3">
              <h2 className="text-3xl font-bold font-playfair">What the app captures</h2>
              <p className="text-muted-foreground mb-4">
                When you turn the tracker on, Trac will see:
              </p>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start">
                  <svg className="h-5 w-5 mr-3 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  <span>Images of your screen taken randomly up to 6 times an hour.</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 mr-3 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  <span>The names of the applications you are using.</span>
                </li>
              </ul>
              <p className="mt-4 text-sm text-muted-foreground/80">
                The app does not track what you type, your individual mouse clicks, or webcam footage. Your privacy and trust are paramount.
              </p>
            </div>
             <div className="flex items-center justify-center">
              <Image
                src="https://picsum.photos/seed/developer-working/600/400"
                alt="Developer working"
                width={600}
                height={400}
                className="rounded-lg shadow-xl"
                data-ai-hint="developer working"
              />
            </div>
          </div>
        </section>

        {/* "Also Available For" Section */}
        <section className="py-20">
          <div className="container mx-auto">
            <h2 className="text-2xl font-bold mb-6">Also available for</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <OtherOSCard
                icon={<img src="https://www.svgrepo.com/show/303144/windows-10-logo.svg" alt="Windows Icon" className="h-8 w-8" />}
                title="Windows OS"
              />
              <OtherOSCard
                icon={<img src="https://www.svgrepo.com/show/303139/apple-13-logo.svg" alt="macOS Icon" className="h-8 w-8" />}
                title="MacOS"
                comingSoon
              />
              <OtherOSCard
                icon={<img src="https://www.svgrepo.com/show/354429/tux.svg" alt="Linux Icon" className="h-8 w-8" />}
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
