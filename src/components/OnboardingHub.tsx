"use client";

import { useEffect, useState } from "react";
import { HiringData } from "./HiringModal";
import { AnimatePresence } from "framer-motion";
import { 
    UserPlus, MessageSquare, Activity
} from "lucide-react";
import { DocumentPreviewModal } from "./DocumentPreviewModal";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OnboardingTab, DocItem } from "./onboarding/OnboardingTab";
import { CommsTab } from "./onboarding/CommsTab";
import { PerformanceTab } from "./onboarding/PerformanceTab";

interface OnboardingHubProps {
  candidateName: string;
  hiringData: HiringData;
  onBack: () => void;
}

export function OnboardingHub({ candidateName, hiringData, onBack }: OnboardingHubProps) {
  const [activeTab, setActiveTab] = useState("onboarding");
  const [previewDoc, setPreviewDoc] = useState<DocItem | null>(null);
  const [isSent, setIsSent] = useState(false);
  const { toast } = useToast();
  
  // Initialize docs based on hiring type
  const [docs, setDocs] = useState<DocItem[]>([
    {
      id: "offer",
      name: hiringData.hiringType === "hourly" ? "Independent Contractor Agreement" : "Employment Offer Letter",
      description: `Formal ${hiringData.hiringType === "hourly" ? "contract" : "offer"} detailing compensation and terms.`,
      status: "pending",
      type: "contract",
    },
    {
      id: "piia",
      name: "Proprietary Info & Inventions Assignment",
      description: "Ensures company ownership of all IP created.",
      status: "pending",
      type: "contract",
    },
    {
      id: "nda",
      name: "Non-Disclosure Agreement (NDA)",
      description: "Standard protection for confidential information.",
      status: "pending",
      type: "contract",
    },
    {
      id: "tax_form",
      name: hiringData.hiringType === "hourly" ? "Tax Form (W-9 / W-8BEN)" : "Form I-9",
      description: "Required tax and eligibility documentation.",
      status: "pending",
      type: "tax",
    }
  ]);

  const handleMarkReady = (id: string) => {
    setDocs(prev => prev.map(d => d.id === id ? { ...d, status: "ready" } : d));
  };

  const handleMarkAllReady = () => {
    setDocs(prev => prev.map(d => ({ ...d, status: "ready" })));
  };

  const handleSend = () => {
    setIsSent(true);
    toast({
      title: "Onboarding Packet Sent!",
      description: `The offer and compliance documents have been sent to ${candidateName}.`,
    });
  };

  return (
    <div className="w-full h-full flex flex-col font-poppins relative overflow-hidden bg-background">
      {/* Tablet Style Tab Header - Floating & Higher */}
      <div className="flex justify-center pt-4 md:pt-6 pb-2 md:pb-4 sticky top-0 z-30 pointer-events-none">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto pointer-events-auto max-w-full px-4">
            <TabsList className="bg-background/60 backdrop-blur-xl p-1 md:p-1.5 h-auto gap-0.5 md:gap-1 rounded-xl md:rounded-2xl border border-border shadow-2xl overflow-x-auto custom-scrollbar-hide max-w-full flex-nowrap justify-start md:justify-center">
                <TabsTrigger 
                    value="onboarding" 
                    className="rounded-lg md:rounded-xl px-3 md:px-6 py-2 md:py-2.5 text-[10px] md:text-xs font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all shrink-0"
                >
                    <UserPlus className="size-3 md:size-3.5 mr-1 md:mr-2" />
                    Onboard
                </TabsTrigger>
                <TabsTrigger 
                    value="comms" 
                    className="rounded-lg md:rounded-xl px-3 md:px-6 py-2 md:py-2.5 text-[10px] md:text-xs font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all shrink-0"
                >
                    <MessageSquare className="size-3 md:size-3.5 mr-1 md:mr-2" />
                    Comms
                </TabsTrigger>
                <TabsTrigger 
                    value="performance" 
                    className="rounded-lg md:rounded-xl px-3 md:px-6 py-2 md:py-2.5 text-[10px] md:text-xs font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all shrink-0"
                >
                    <Activity className="size-3 md:size-3.5 mr-1 md:mr-2" />
                    Performance
                </TabsTrigger>
            </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-8 lg:px-12 pb-8 md:pb-12 custom-scrollbar">
        <AnimatePresence mode="wait">
            {activeTab === "onboarding" && (
                <OnboardingTab 
                  key="onboarding-tab"
                  candidateName={candidateName}
                  hiringData={hiringData}
                  onBack={onBack}
                  isSent={isSent}
                  onSend={handleSend}
                  docs={docs}
                  onMarkReady={handleMarkReady}
                  onMarkAllReady={handleMarkAllReady}
                  onPreviewDoc={setPreviewDoc}
                />
            )}

            {activeTab === "comms" && (
                <CommsTab 
                  key="comms-tab"
                  candidateName={candidateName}
                  hiringData={hiringData}
                  isSent={isSent}
                />
            )}

            {activeTab === "performance" && (
                <PerformanceTab key="performance-tab" />
            )}
        </AnimatePresence>
      </div>

      {previewDoc && (
        <DocumentPreviewModal
            isOpen={!!previewDoc}
            onClose={() => setPreviewDoc(null)}
            docName={previewDoc.name}
            docId={previewDoc.id}
            candidateName={candidateName}
            hiringData={hiringData}
        />
      )}
    </div>
  );
}
