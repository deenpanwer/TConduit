"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { OnboardingHub } from "@/components/OnboardingHub";
import { useHiredCandidates } from "@/hooks/use-hired-candidates";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

const HiredCandidatePage = () => {
  const params = useParams();
  const router = useRouter();
  const { hiredCandidates } = useHiredCandidates();
  const [candidate, setCandidate] = useState<any>(null);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    if (params.id && hiredCandidates.length > 0) {
      const found = hiredCandidates.find((c) => c.id === params.id);
      if (found) setCandidate(found);
    }
  }, [params.id, hiredCandidates]);

  useEffect(() => {
    const email = sessionStorage.getItem("userEmail");
    if (email) {
      setUserEmail(email);
      fetchWorkspace(email);
    }
  }, []);

  const fetchWorkspace = async (email: string) => {
    try {
      const res = await fetch("/api/search-usage", {
        method: "POST",
        body: JSON.stringify({ action: "get_workspace", email }),
      });
      const data = await res.json();
      setHistory(data.history || []);
    } catch (e) {}
  };

  if (!candidate) return <div className="flex h-screen items-center justify-center font-black uppercase tracking-widest animate-pulse">Initializing Channel...</div>;

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden relative">
      <div className="lg:hidden absolute top-4 left-4 z-50">
        <Button variant="outline" size="icon" onClick={() => setIsMobileSidebarOpen(true)}>
          <Menu className="size-5" />
        </Button>
      </div>

      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileSidebarOpen={isMobileSidebarOpen}
        setIsMobileSidebarOpen={setIsMobileSidebarOpen}
        history={history}
        isHistoryLoading={false}
        userEmail={userEmail}
        isEmailResolved={true}
        onRenameSearch={() => {}}
        onDeleteSearch={() => {}}
      />

      {isMobileSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsMobileSidebarOpen(false)} />
      )}

      <main className="flex-1 h-full overflow-hidden bg-background">
        <OnboardingHub
          candidateName={candidate.candidateName}
          hiringData={candidate.hiringData}
          onBack={() => router.back()}
        />
      </main>
    </div>
  );
};

export default HiredCandidatePage;