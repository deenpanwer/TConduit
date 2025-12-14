
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, CheckCircle, Zap, Shield, Clock, Handshake, FileText, BrainCircuit } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const FeatureCard = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
  <div className="flex flex-col items-center p-6 text-center">
    <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-primary/10 text-primary">
      <Icon className="w-6 h-6" />
    </div>
    <h3 className="mb-2 text-lg font-semibold">{title}</h3>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);

export default function TracDairyDownloadPage() {
  return (
    <div className="bg-background min-h-screen">
      <header className="absolute top-0 left-0 right-0 px-6 py-6 flex justify-between items-center">
        <Link href="/" className="font-poppins font-bold text-2xl text-foreground">
          TRAC
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/join">
            <Button variant="outline" className="h-8 animate-shake">
              Join the Network
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-32 pb-16 flex flex-col items-center text-center">
        <h1 className="text-4xl md:text-5xl font-bold font-playfair tracking-tight text-foreground">
          Build Your Verifiable Work Profile
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Turn your daily tasks into a verifiable record of your skills and unlock new hiring opportunities.
        </p>

        <div className="mt-8">
          <a href="/downloads/TracDairy-Installer.exe" download>
            <Button size="lg" className="h-14 px-8 text-lg rounded-xl shadow-lg">
              <Download className="mr-3 h-5 w-5" />
              Download for Windows
            </Button>
          </a>
          <p className="mt-3 text-xs text-muted-foreground">
            Windows 10/11
          </p>
        </div>

        <div className="mt-16 w-full max-w-4xl">
          <div className="aspect-video bg-muted/50 rounded-2xl p-2 border shadow-inner">
            <Image
              src="https://picsum.photos/seed/trac-dairy-app/1200/675"
              alt="Trac Dairy App Screenshot"
              width={1200}
              height={675}
              className="rounded-lg object-cover w-full h-full"
              data-ai-hint="proof of work desktop app"
            />
          </div>
        </div>

        <section className="mt-20 w-full max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={Shield}
              title="Verifiable Proof of Work"
              description="Create an undeniable, minute-by-minute record of your work and competence that you can share with anyone."
            />
            <FeatureCard
              icon={BrainCircuit}
              title="AI-Powered Skill Insights"
              description="Our AI analyzes your activity to identify your core competencies and areas for growth, helping you level-up."
            />
            <FeatureCard
              icon={Zap}
              title="Unlock Hiring Opportunities"
              description="Connect your verified skill profile directly to the Trac network and get matched with relevant job opportunities."
            />
          </div>
        </section>

        <footer className="mt-24 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} TRAC. All rights reserved.</p>
          <div className="mt-2">
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
            <span className="mx-2">&middot;</span>
            <Link href="/terms" className="hover:underline">Terms of Service</Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
