"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HiringModal, HiringData } from "@/components/HiringModal";
import { OnboardingHub } from "@/components/OnboardingHub";
import { Card } from "@/components/ui/card";
import { UserPlus } from "lucide-react";

export default function Test11Page() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hiringData, setHiringData] = useState<HiringData | null>(null);
  const [isOnboarding, setIsOnboarding] = useState(false);

  // Mock Candidate
  const candidateName = "Alex Developer";

  const handleStartHiring = () => {
    setIsModalOpen(true);
  };

  const handleHiringConfirmed = (data: HiringData) => {
    setHiringData(data);
    setIsModalOpen(false);
    setIsOnboarding(true);
  };

  const handleBackToStart = () => {
    setIsOnboarding(false);
    setHiringData(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 flex flex-col items-center justify-center">
      
      {!isOnboarding ? (
        <Card className="w-full max-w-md p-8 flex flex-col items-center text-center space-y-6 shadow-xl">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-2">
            <UserPlus className="w-10 h-10" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight">Hiring Simulator</h1>
            <p className="text-muted-foreground">
              Test the end-to-end hiring and document generation flow for 
              <strong> {candidateName}</strong>.
            </p>
          </div>

          <Button size="lg" className="w-full font-bold text-lg h-12" onClick={handleStartHiring}>
            Start Hiring Process
          </Button>

          <div className="text-xs text-muted-foreground pt-4 border-t w-full">
            This is a test harness for the <code>HiringModal</code> and <code>OnboardingHub</code> integration.
          </div>
        </Card>
      ) : (
        // Render the Onboarding Hub when data is ready
        hiringData && (
            <div className="w-full h-full flex flex-col">
                <div className="mb-4">
                    <Button variant="ghost" onClick={handleBackToStart}>
                        ← Reset Simulator
                    </Button>
                </div>
                <OnboardingHub 
                    candidateName={candidateName}
                    hiringData={hiringData}
                    onBack={handleBackToStart}
                />
            </div>
        )
      )}

      <HiringModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        candidateName={candidateName}
        onConfirm={handleHiringConfirmed}
      />
    </div>
  );
}
