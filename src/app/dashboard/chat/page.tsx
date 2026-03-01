"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTeam } from "@/hooks/use-team";
import { useEmployeeChat } from "@/hooks/use-employee-chat"; // New import
import { Menu, MessageSquare, X } from "lucide-react"; 
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// New Chat Components
import { EmployeeList } from "@/components/dashboard/chat/EmployeeList";
import { ChatHeader } from "@/components/dashboard/chat/ChatHeader";
import { MessageList } from "@/components/dashboard/chat/MessageList";
import { ChatInput } from "@/components/dashboard/chat/ChatInput";
import { Shimmer } from "@/components/dashboard/main/shared/Shimmer";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { InviteModal } from "@/components/dashboard/InviteModal";
import { PaywallScreen } from "@/components/dashboard/PaywallScreen";
import { SubscriptionBadge } from "@/components/dashboard/SubscriptionBadge";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function ChatPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const { employees, owner, loading: teamLoading } = useTeam();
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [orgData, setOrgData] = useState<any>(null);
  
  const targetOrgId = userData?.ownedOrgId || userData?.orgId;

  const {
    messages,
    chatId,
    isSettingUpChat,
    sendEmployeeMessage
  } = useEmployeeChat(selectedEmployee, owner, targetOrgId); // Use the new hook
  
  const [inputText, setInputText] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false); // Correctly initialized
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
    if (!inputText.trim() || !chatId || !user?.uid || !sendEmployeeMessage) {
      console.warn("Message not sent: Missing inputText, chatId, user.uid, or sendEmployeeMessage", { inputText, chatId, userUid: user?.uid });
      return;
    }

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

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
  }, []);

  const isLoadingInitialData = authLoading || teamLoading || (user && !userData);
  const isChatReady = !!selectedEmployee && !!user?.uid && !!chatId && !isSettingUpChat;

  if (isLoadingInitialData) {
    return (
      <div className="flex h-screen bg-background overflow-hidden">
        <Shimmer className="w-16 lg:w-64 h-full rounded-2xl mr-4" /> {/* Sidebar Shimmer */}
        <main className="flex-1 flex flex-col">
          <header className="h-16 border-b bg-card/50 flex items-center px-8 shrink-0">
            <Shimmer className="h-4 w-32 rounded-full" />
          </header>
          <div className="flex-1 p-4 flex"> {/* Adjust padding here */}
            <Shimmer className="w-64 h-full rounded-2xl mr-4" /> {/* EmployeeList Shimmer */}
            <div className="flex-1 flex flex-col">
              <Shimmer className="h-16 w-full rounded-2xl mb-4" /> {/* ChatHeader Shimmer */}
              <Shimmer className="flex-1 w-full rounded-2xl" /> {/* MessageList Shimmer */}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!user || !userData || !owner) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Please log in to view chats.</p>
      </div>
    );
  }

  const staffMembers = employees.filter(emp => emp.id !== user.uid);

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      <DashboardSidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileSidebarOpen={isMobileOpen}
        setIsMobileSidebarOpen={setIsMobileOpen}
        employees={employees}
        onInviteClick={() => setShowInviteModal(true)}
      />

      <InviteModal 
        isOpen={showInviteModal}
        onOpenChange={setShowInviteModal}
      />

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 border-b bg-card/50 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsMobileOpen(true)}>
              <Menu />
            </Button>
            <h2 className="font-black uppercase tracking-widest text-sm">Messages</h2> {/* Updated title */}
          </div>
          <div className="flex items-center gap-4">
            <SubscriptionBadge orgData={orgData} userData={userData} />
            {/* User avatar/settings button - copied from other dashboard pages */}
            <button 
              // onClick={() => { /* router.push("/dashboard/settings") */}} // Add settings route if needed
              className="size-10 rounded-full bg-secondary border-2 border-border flex items-center justify-center overflow-hidden transition-all hover:scale-105 active:scale-90"
            >
               <img 
                  src={userData.photoUrl || `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${user?.email || 'admin'}`} 
                  alt="Avatar" 
                  className="w-full h-full object-cover" 
                />
            </button>
          </div>
        </header>

        {/* Main chat content area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          {!isSubscriptionActive ? (
            <PaywallScreen 
              orgData={orgData}
              userData={userData}
            />
          ) : (
            <div className="flex h-full bg-card rounded-3xl overflow-hidden">
              <EmployeeList
                employees={staffMembers}
                selectedEmployee={selectedEmployee}
                onSelectEmployee={handleSelectEmployee}
                isLoading={teamLoading}
              />

              {/* Chat Window */}
              <div className="flex-1 flex flex-col">
                {selectedEmployee ? (
                  <>
                    <ChatHeader selectedEmployee={selectedEmployee} />
                    <MessageList
                      messages={messages}
                      userUid={user.uid}
                      selectedEmployeePhotoUrl={selectedEmployee.photoUrl}
                      selectedEmployeeName={selectedEmployee.name}
                      ownerPhotoUrl={userData.photoUrl || `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${userData.name}`}
                      ownerName={userData.name || user.displayName || user.email || "You"}
                      isLoading={isSettingUpChat}
                    />
                    <ChatInput
                      inputText={inputText}
                      onInputChange={handleInputChange}
                      onSendMessage={handleSendMessage}
                      isDisabled={!isChatReady}
                    />
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground">
                    <MessageSquare className="h-16 w-16 mb-4" />
                    <p className="text-lg font-semibold">Select a staff member to start chatting</p>
                    <p className="text-sm">Your conversations will appear here.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsMobileOpen(false)}>
          <div className="absolute right-4 top-4"><Button variant="ghost" size="icon" className="text-white"><X /></Button></div>
        </div>
      )}
    </div>
  );
};