"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTeam } from "@/hooks/use-team";
import { useEmployeeChat } from "@/hooks/use-employee-chat";
import { Menu, MessageSquare, X } from "lucide-react"; 
import { cn, getUserAvatar } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmployeeList } from "@/components/ems/chat/EmployeeList";
import { ChatHeader } from "@/components/ems/chat/ChatHeader";
import { MessageList } from "@/components/ems/chat/MessageList";
import { ChatInput } from "@/components/ems/chat/ChatInput";
import { Shimmer } from "@/components/ems/main/shared/Shimmer";
import { InviteModal } from "@/components/ems/InviteModal";
import { PaywallScreen } from "@/components/ems/PaywallScreen";
import { SubscriptionBadge } from "@/components/ems/SubscriptionBadge";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useSidebar } from "@/hooks/use-sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSearchParams } from "next/navigation";

function ChatPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const { employees, owner, loading: teamLoading } = useTeam();
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [orgData, setOrgData] = useState<any>(null);
  const { setIsMobileOpen } = useSidebar();
  const isMobile = useIsMobile();
  const searchParams = useSearchParams();
  
  const targetOrgId = userData?.ownedOrgId || userData?.orgId;

  // Auto-select employee if ID is provided in URL
  useEffect(() => {
    const empId = searchParams.get("id");
    if (empId && employees.length > 0) {
      const emp = employees.find(e => e.id === empId);
      if (emp) {
        setSelectedEmployee(emp);
      }
    }
  }, [searchParams, employees]);

  const {
    messages,
    chatId,
    isSettingUpChat,
    sendEmployeeMessage
  } = useEmployeeChat(selectedEmployee, owner, targetOrgId);
  
  const [inputText, setInputText] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    if (userData) {
      fetchOrgDetails();
    }
  }, [userData]);

  const fetchOrgDetails = async () => {
    const targetOrgId = userData?.ownedOrgId || userData?.orgId;
    if (targetOrgId) {
      const orgDoc = await getDoc(doc(db, "organizations", targetOrgId));
      if (orgDoc.exists()) setOrgData(orgDoc.data());
    }
  };

  const isSubscriptionActive = orgData?.subscriptionExpiry 
    ? orgData.subscriptionExpiry.toDate() > new Date() 
    : true;

  // Reset inputText when selectedEmployee changes or chat is being set up
  useEffect(() => {
    setInputText("");
  }, [selectedEmployee, isSettingUpChat]);

    const handleSendMessage = useCallback(async () => {
      if (!inputText.trim() || !chatId || !user?.uid || !sendEmployeeMessage) return;

      try {
        await sendEmployeeMessage(chatId, user.uid, inputText);
        setInputText("");
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }, [inputText, chatId, user?.uid, sendEmployeeMessage]);

    const handleSelectEmployee = useCallback((employee: any) => {
      setSelectedEmployee(employee);
    }, []);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInputText(e.target.value);
    }, []);

    const isLoadingInitialData = authLoading || teamLoading || (user && !userData);
    const isChatReady = !!selectedEmployee && !!user?.uid && !!chatId && !isSettingUpChat;

    if (isLoadingInitialData) {
      return (
          <main className="flex-1 flex flex-col bg-background">
            <header className="h-16 border-b border-border/40 bg-card/50 backdrop-blur-xl flex items-center px-8 shrink-0">
              <Shimmer className="h-4 w-32 rounded-full" />
            </header>
            <div className="flex-1 p-0 flex">
              <Shimmer className="hidden lg:block w-72 h-full border-r border-border/40" />
              <div className="flex-1 flex flex-col p-4">
                <Shimmer className="h-16 w-full rounded-2xl mb-4" />
                <Shimmer className="flex-1 w-full rounded-2xl shadow-inner" />
              </div>
            </div>
          </main>
      );
    }

    if (!user || !userData || !owner) {
      return (
        <div className="flex h-screen items-center justify-center bg-background">
          <p className="text-muted-foreground animate-pulse font-medium">Authenticating...</p>
        </div>
      );
    }

    const staffMembers = employees.filter(emp => emp.id !== user.uid);

    return (
      <>
        <InviteModal 
          isOpen={showInviteModal}
          onOpenChange={setShowInviteModal}
        />
  
        <main className="flex-1 flex flex-col overflow-hidden bg-background relative">
          <header className="h-16 border-b border-border/40 bg-card/50 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-30 shrink-0">
            <div className="flex items-center gap-4">
              {(!selectedEmployee || !isMobile) ? (
                <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsMobileOpen(true)}>
                  <Menu size={20} />
                </Button>
              ) : (
                <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSelectedEmployee(null)}>
                  <X size={20} />
                </Button>
              )}
              <h2 className="font-bold text-sm tracking-widest uppercase">Messages</h2>
            </div>
            <div className="flex items-center gap-4">
              <SubscriptionBadge orgData={orgData} userData={userData} />
              <button className="size-9 rounded-full bg-secondary border border-border flex items-center justify-center overflow-hidden transition-all hover:ring-4 hover:ring-primary/10 active:scale-95">
                 <img 
                    src={getUserAvatar(userData)} 
                    alt="Avatar" 
                    className="w-full h-full object-cover" 
                  />
              </button>
            </div>
          </header>
  
          <div className="flex-1 flex overflow-hidden">
            {!isSubscriptionActive ? (
              <div className="flex-1 p-4 md:p-8">
                <PaywallScreen orgData={orgData} userData={userData} />
              </div>
            ) : (
              <div className="flex-1 flex bg-background overflow-hidden relative">
                <div className={cn(
                  "w-full lg:w-80 border-r border-border/40 flex flex-col transition-all duration-300 absolute lg:relative z-20 h-full bg-background",
                  selectedEmployee && isMobile ? "-translate-x-full opacity-0" : "translate-x-0 opacity-100"
                )}>
                  <EmployeeList
                    employees={staffMembers}
                    selectedEmployee={selectedEmployee}
                    onSelectEmployee={handleSelectEmployee}
                    isLoading={teamLoading}
                  />
                </div>
  
                <div className={cn(
                  "flex-1 flex flex-col h-full bg-card transition-all duration-300",
                  !selectedEmployee && isMobile ? "translate-x-full opacity-0" : "translate-x-0 opacity-100"
                )}>
                  {selectedEmployee ? (
                    <>
                      <ChatHeader selectedEmployee={selectedEmployee} chatId={chatId} />
                      <MessageList
                        messages={messages}
                        userUid={user.uid}
                        selectedEmployeePhotoUrl={selectedEmployee.photoUrl}
                        selectedEmployeeName={selectedEmployee.name}
                        ownerPhotoUrl={userData.photoUrl || `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${userData.name}`}
                        ownerName={userData.name || user.displayName || user.email || "You"}
                        isLoading={isSettingUpChat}
                        ownerData={userData}
                        selectedEmployeeData={selectedEmployee}
                      />
                      <ChatInput
                        inputText={inputText}
                        onInputChange={handleInputChange}
                        onSendMessage={handleSendMessage}
                        isDisabled={!isChatReady}
                      />
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground bg-secondary/10">
                      <div className="p-6 rounded-full bg-secondary/30 mb-6 animate-in zoom-in duration-500">
                        <MessageSquare className="h-10 w-10 text-primary/40" />
                      </div>
                      <p className="text-sm font-bold uppercase tracking-widest text-foreground">Select a contact</p>
                      <p className="text-xs text-muted-foreground/60 mt-2">Start a category-defining conversation</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </>
    );
  };

export default function SuspendedChatPage() {
    return (
        <Suspense fallback={
          <main className="flex-1 flex flex-col bg-background">
            <header className="h-16 border-b border-border/40 bg-card/50 backdrop-blur-xl flex items-center px-8 shrink-0">
              <Shimmer className="h-4 w-32 rounded-full" />
            </header>
            <div className="flex-1 p-0 flex">
              <Shimmer className="hidden lg:block w-72 h-full border-r border-border/40" />
              <div className="flex-1 flex flex-col p-4">
                <Shimmer className="h-16 w-full rounded-2xl mb-4" />
                <Shimmer className="flex-1 w-full rounded-2xl shadow-inner" />
              </div>
            </div>
          </main>
        }>
            <ChatPage />
        </Suspense>
    )
}