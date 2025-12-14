
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Apple, Windows } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const TuxIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <img src="https://www.svgrepo.com/show/303623/tux-linux-logo.svg" alt="Linux" {...props} />
);

const OperatingSystemButtons = () => {
  const [selectedOs, setSelectedOs] = useState<'windows' | 'mac' | 'linux'>('windows');

  return (
    <div className="flex flex-col items-start gap-4">
      <div className="flex rounded-lg border p-1">
        <Button
          variant={selectedOs === 'windows' ? 'secondary' : 'ghost'}
          onClick={() => setSelectedOs('windows')}
          className="flex items-center gap-2"
        >
          <Windows size={18} />
          <span>Windows</span>
        </Button>
        <Button
          variant={selectedOs === 'mac' ? 'secondary' : 'ghost'}
          onClick={() => setSelectedOs('mac')}
          className="flex items-center gap-2"
          disabled
        >
          <Apple size={18} />
          <span>macOS</span>
        </Button>
        <Button
          variant={selectedOs === 'linux' ? 'secondary' : 'ghost'}
          onClick={() => setSelectedOs('linux')}
          className="flex items-center gap-2"
          disabled
        >
          <TuxIcon className="w-[18px] h-[18px]" />
          <span>Linux</span>
        </Button>
      </div>
      <div>
        {selectedOs === 'windows' ? (
          <a href="/downloads/TracDairy-Installer.exe" download>
            <Button size="lg" className="h-12 px-8 text-base rounded-lg shadow-md bg-green-600 hover:bg-green-700 text-white">
              <Download className="mr-3 h-5 w-5" />
              Download
            </Button>
          </a>
        ) : (
          <Button size="lg" className="h-12 px-8 text-base rounded-lg shadow-md" disabled>
            Coming Soon
          </Button>
        )}
      </div>
    </div>
  );
};


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

      <main className="pt-24">
        {/* Hero Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col gap-4">
              <h1 className="text-5xl font-bold font-playfair tracking-tight">Get Trac on your desktop</h1>
              <p className="text-lg text-muted-foreground">
                Build your verifiable work profile by letting our AI log your activity and identify your core competencies. Stay connected to opportunity.
              </p>
              <div className="mt-4">
                <OperatingSystemButtons />
              </div>
            </div>
            <div className="flex items-center justify-center">
              <Image
                src="https://picsum.photos/seed/app-ui/600/400"
                alt="Trac Dairy App UI"
                width={600}
                height={400}
                className="rounded-lg shadow-2xl"
                data-ai-hint="desktop app ui"
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
      </main>
    </div>
  );
}
