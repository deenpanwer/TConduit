"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTeam } from "@/hooks/use-team";
import { useEmployeeChat } from "@/hooks/use-employee-chat";
import { useGroupChat } from "@/hooks/use-group-chat";
import { Menu, MessageSquare, X } from "lucide-react"; 
import { cn, getUserAvatar } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmployeeList } from "@/components/ems/chat/EmployeeList";
import { ChatHeader } from "@/components/ems/chat/ChatHeader";
import { MessageList } from "@/components/ems/chat/MessageList";
import { ChatInput } from "@/components/ems/chat/ChatInput";
import { Shimmer } from "@/components/ems/main/shared/Shimmer";
import { InviteModal } from "@/components/ems/InviteModal";
import { CreateGroupModal } from "@/components/ems/chat/CreateGroupModal";
import { ManageGroupModal } from "@/components/ems/chat/ManageGroupModal";
import { DeletedGroupsModal } from "@/components/ems/chat/DeletedGroupsModal";
import { PaywallScreen } from "@/components/ems/PaywallScreen";
import { SubscriptionBadge } from "@/components/ems/SubscriptionBadge";
import { db, storage } from "@/lib/firebase";
import { doc, getDoc, collection, addDoc, setDoc, serverTimestamp, query, where, onSnapshot } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useSidebar } from "@/hooks/use-sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

function ChatPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const { employees, owner, loading: teamLoading } = useTeam();
  
  // Navigation states
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"direct" | "group">("direct");
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showManageGroupModal, setShowManageGroupModal] = useState(false);
  const [showDeletedGroupsModal, setShowDeletedGroupsModal] = useState(false);
  
  const [orgData, setOrgData] = useState<any>(null);
  const { setIsMobileOpen } = useSidebar();
  const isMobile = useIsMobile();
  const searchParams = useSearchParams();
  
  const targetOrgId = userData?.ownedOrgId || userData?.orgId;

  const router = useRouter();
  const pathname = usePathname();

  // Helper to push state changes to URL
  const updateUrlParams = useCallback((params: Record<string, string | null>) => {
    if (typeof window === "undefined") return;
    const newParams = new URLSearchParams(window.location.search);
    Object.entries(params).forEach(([key, value]) => {
      if (value === null) {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });
    router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
  }, [pathname, router]);

  // 1. Direct one-to-one Chat Hook with Pagination & Grace Fallback
  const {
    messages: directMessages,
    chatId,
    isSettingUpChat: isSettingUpDirectChat,
    loadMore: loadMoreDirect,
    hasMore: hasMoreDirect
  } = useEmployeeChat(selectedEmployee, owner, targetOrgId);

  // 2. Organization Group Chat Hook with Pagination
  const {
    groups,
    deletedGroups,
    messages: groupMessages,
    isSettingUpChat: isSettingUpGroupChat,
    createGroupChat,
    updateGroupChat,
    softDeleteGroupChat,
    restoreGroupChat,
    sendGroupMessage,
    uploadGroupFile,
    loadMore: loadMoreGroup,
    hasMore: hasMoreGroup
  } = useGroupChat(selectedGroup?.id || null, targetOrgId);

  // Sync selectedGroup with latest groups data
  useEffect(() => {
    if (selectedGroup) {
      const latest = groups.find(g => g.id === selectedGroup.id);
      if (latest) {
        setSelectedGroup(latest);
      } else {
        setSelectedGroup(null);
      }
    }
  }, [groups]);
  
  const [inputText, setInputText] = useState("");
  const [directChats, setDirectChats] = useState<any[]>([]);
  const [viewedTimes, setViewedTimes] = useState<Record<string, number>>({});

  // 1. Subscribe to all organization direct chats containing the current user
  useEffect(() => {
    if (!user?.uid || !targetOrgId) {
      setDirectChats([]);
      return;
    }

    const chatsRef = collection(db, "organizations", targetOrgId, "chats");
    const q = query(chatsRef, where("participants", "array-contains", user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setDirectChats(chatList);
    }, (error) => {
      console.error("Error subscribing to direct chats list:", error);
    });

    return () => unsubscribe();
  }, [user?.uid, targetOrgId]);

  // 2. Initialize viewedTimes from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("chat_viewed_times");
        if (stored) {
          setViewedTimes(JSON.parse(stored));
        }
      } catch (e) {
        console.error("Error parsing chat_viewed_times from localStorage", e);
      }
    }
  }, []);

  // Update viewedTimes helper
  const markChatAsRead = useCallback((id: string) => {
    setViewedTimes((prev) => {
      const updated = { ...prev, [id]: Date.now() };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("chat_viewed_times", JSON.stringify(updated));
        } catch (e) {
          console.error("Error writing chat_viewed_times to localStorage", e);
        }
      }
      return updated;
    });
  }, []);

  // Mark direct chat as read on selection
  useEffect(() => {
    if (activeTab === "direct" && selectedEmployee && targetOrgId) {
      const currentChatId = `${targetOrgId}_${selectedEmployee.id}`;
      markChatAsRead(currentChatId);
    }
  }, [selectedEmployee, activeTab, targetOrgId, markChatAsRead]);

  // Mark group chat as read on selection
  useEffect(() => {
    if (activeTab === "group" && selectedGroup) {
      markChatAsRead(selectedGroup.id);
    }
  }, [selectedGroup, activeTab, markChatAsRead]);

  // Mark as read in real-time when new messages arrive in the active room
  useEffect(() => {
    if (activeTab === "direct" && selectedEmployee && targetOrgId && directMessages.length > 0) {
      const currentChatId = `${targetOrgId}_${selectedEmployee.id}`;
      markChatAsRead(currentChatId);
    }
  }, [directMessages.length, selectedEmployee, activeTab, targetOrgId, markChatAsRead]);

  useEffect(() => {
    if (activeTab === "group" && selectedGroup && groupMessages.length > 0) {
      markChatAsRead(selectedGroup.id);
    }
  }, [groupMessages.length, selectedGroup, activeTab, markChatAsRead]);
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
      if (orgDoc.exists()) setOrgData({ id: orgDoc.id, ...orgDoc.data() });
    }
  };

  const isSubscriptionActive = orgData?.subscriptionExpiry 
    ? orgData.subscriptionExpiry.toDate() > new Date() 
    : true;

  // Reset inputText when selection changes
  useEffect(() => {
    setInputText("");
  }, [selectedEmployee, selectedGroup]);

  // Generic direct chat file uploader helper (matching scoped path rules) supporting progress
  const uploadDirectFile = async (
    currentChatId: string, 
    file: File | Blob,
    onProgress?: (progress: number) => void
  ): Promise<string> => {
    const fileId = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const originalName = file instanceof File ? file.name : "voice_note.webm";
    
    // Scopes uploads inside '/organizations/{orgId}/chats/{chatId}'
    const storagePath = `organizations/${targetOrgId}/chats/${currentChatId}/${fileId}_${originalName}`;
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(progress);
        },
        (err) => reject(err),
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  };

  // Consolidated sender dispatch supporting rich media payloads
  const sendRichMessage = async (
    text: string, 
    type: "text" | "image" | "video" | "audio" | "file" = "text",
    fileUrl?: string,
    fileName?: string,
    fileSize?: number
  ) => {
    if (activeTab === "direct" && chatId && user?.uid && targetOrgId) {
      // Scopes direct message collections under '/organizations/{orgId}/chats/{chatId}/messages'
      const messagesRef = collection(db, "organizations", targetOrgId, "chats", chatId, "messages");
      
      const payload: any = {
        senderId: user.uid,
        text: text.trim(),
        timestamp: serverTimestamp(),
        type
      };

      if (fileUrl) {
        payload.fileUrl = fileUrl;
        payload.fileName = fileName;
        payload.fileSize = fileSize;
      }

      await addDoc(messagesRef, payload);
      
      let previewText = text.trim();
      if (!previewText && type !== "text") {
        previewText = `Shared a ${type}`;
      }

      const chatDocRef = doc(db, "organizations", targetOrgId, "chats", chatId);
      await setDoc(chatDocRef, { 
        lastMessage: previewText, 
        lastMessageAt: serverTimestamp(),
        lastMessageSenderId: user.uid
      }, { merge: true });

    } else if (activeTab === "group" && selectedGroup) {
      await sendGroupMessage(selectedGroup.id, text, type, fileUrl, fileName, fileSize);
    }
  };

  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim()) return;

    try {
      await sendRichMessage(inputText, "text");
      setInputText("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }, [inputText, activeTab, chatId, selectedGroup, user?.uid]);

  // Unified File upload wrapper (passed to ChatInput)
  const handleUploadFile = async (file: File, onProgress: (progress: number) => void) => {
    if (activeTab === "direct" && chatId) {
      return uploadDirectFile(chatId, file, onProgress);
    } else if (activeTab === "group" && selectedGroup) {
      return uploadGroupFile(selectedGroup.id, file, onProgress);
    }
    throw new Error("No active conversation selected");
  };

  // Upload completion success handler
  const handleUploadSuccess = async (url: string, file: File) => {
    let category: "image" | "video" | "audio" | "file" = "file";
    if (file.type.startsWith("image/")) {
      category = "image";
    } else if (file.type.startsWith("video/")) {
      category = "video";
    } else if (file.type.startsWith("audio/")) {
      category = "audio";
    }
    await sendRichMessage("", category, url, file.name, file.size);
  };

  // Browser MediaRecorder voice note recording callback
  const handleSendVoiceNote = async (audioBlob: Blob) => {
    try {
      let fileUrl = "";
      
      if (activeTab === "direct" && chatId) {
        fileUrl = await uploadDirectFile(chatId, audioBlob);
      } else if (activeTab === "group" && selectedGroup) {
        fileUrl = await uploadGroupFile(selectedGroup.id, audioBlob);
      }

      if (fileUrl) {
        await sendRichMessage("", "audio", fileUrl, "Voice Note.webm", audioBlob.size);
      }
    } catch (err) {
      console.error("Failed uploading voice note:", err);
      alert("Voice note upload failed.");
    }
  };

  // 1. Initial State Hydration from URL Search Parameters
  useEffect(() => {
    const tabParam = searchParams.get("tab") as "direct" | "group" | null;
    const idParam = searchParams.get("id");
    const groupIdParam = searchParams.get("groupId");

    if (tabParam) {
      setActiveTab(tabParam);
    }

    if (idParam && employees.length > 0) {
      const emp = employees.find(e => e.id === idParam);
      if (emp) {
        setSelectedEmployee(emp);
        setSelectedGroup(null);
      }
    }

    if (groupIdParam && groups.length > 0) {
      const grp = groups.find(g => g.id === groupIdParam);
      if (grp) {
        setSelectedGroup(grp);
        setSelectedEmployee(null);
      }
    }
  }, [employees.length, groups.length]);

  const handleSelectEmployee = useCallback((employee: any) => {
    setSelectedEmployee(employee);
    setSelectedGroup(null);
    setActiveTab("direct");
    updateUrlParams({
      tab: "direct",
      id: employee.id,
      groupId: null
    });
  }, [updateUrlParams]);

  const handleSelectGroup = useCallback((group: any) => {
    setSelectedGroup(group);
    setSelectedEmployee(null);
    setActiveTab("group");
    updateUrlParams({
      tab: "group",
      groupId: group.id,
      id: null
    });
  }, [updateUrlParams]);

  const handleTabChange = useCallback((tab: "direct" | "group") => {
    setActiveTab(tab);
    if (tab === "direct") {
      updateUrlParams({
        tab: "direct",
        id: selectedEmployee?.id || null,
        groupId: null
      });
    } else {
      updateUrlParams({
        tab: "group",
        groupId: selectedGroup?.id || null,
        id: null
      });
    }
  }, [selectedEmployee, selectedGroup, updateUrlParams]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
  }, []);

  const handleCreateGroup = async (name: string, members: string[], imageFile: File | null) => {
    let photoUrl = "";
    if (imageFile && targetOrgId) {
      const fileId = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const storagePath = `organizations/${targetOrgId}/group_avatars/${fileId}_${imageFile.name}`;
      const storageRef = ref(storage, storagePath);
      const uploadTask = await uploadBytesResumable(storageRef, imageFile);
      photoUrl = await getDownloadURL(uploadTask.ref);
    }
    const groupId = await createGroupChat(name, members, photoUrl);
    const orgGroupRef = doc(db, "organizations", targetOrgId!, "group_chats", groupId);
    const snap = await getDoc(orgGroupRef);
    if (snap.exists()) {
      handleSelectGroup({ id: snap.id, ...snap.data() });
    }
  };

  const handleUpdateGroup = async (
    groupId: string,
    name: string,
    members: string[],
    imageFile: File | null,
    removeImage?: boolean
  ) => {
    if (!targetOrgId) return;
    let photoUrl = selectedGroup?.photoUrl || "";
    if (imageFile) {
      const fileId = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const storagePath = `organizations/${targetOrgId}/group_avatars/${fileId}_${imageFile.name}`;
      const storageRef = ref(storage, storagePath);
      const uploadTask = await uploadBytesResumable(storageRef, imageFile);
      photoUrl = await getDownloadURL(uploadTask.ref);
    } else if (removeImage) {
      photoUrl = "";
    }

    await updateGroupChat(groupId, {
      name,
      members,
      photoUrl
    });

    setSelectedGroup((prev: any) => prev ? {
      ...prev,
      name,
      members,
      photoUrl
    } : null);
  };

  const handleDeleteGroup = async (groupId: string) => {
    await softDeleteGroupChat(groupId);
    setSelectedGroup(null);
    setShowManageGroupModal(false);
  };

  const handleRestoreGroup = async (groupId: string) => {
    await restoreGroupChat(groupId);
  };

  const handleUpdateGroupImage = async (file: File) => {
    if (!selectedGroup || !targetOrgId) return;
    try {
      const fileId = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const storagePath = `organizations/${targetOrgId}/group_avatars/${fileId}_${file.name}`;
      const storageRef = ref(storage, storagePath);
      const uploadTask = await uploadBytesResumable(storageRef, file);
      const downloadUrl = await getDownloadURL(uploadTask.ref);

      // Update in Firestore
      const groupDocRef = doc(db, "organizations", targetOrgId, "group_chats", selectedGroup.id);
      await setDoc(groupDocRef, { photoUrl: downloadUrl }, { merge: true });

      // Update local state
      setSelectedGroup((prev: any) => prev ? { ...prev, photoUrl: downloadUrl } : null);
    } catch (err) {
      console.error("Failed to update group image:", err);
    }
  };

  const isLoadingInitialData = authLoading || teamLoading || (user && !userData);
  const isChatReady = activeTab === "direct" 
    ? (!!selectedEmployee && !!user?.uid && !!chatId && !isSettingUpDirectChat)
    : (!!selectedGroup && !!user?.uid && !isSettingUpGroupChat);

  const activeMessages = activeTab === "direct" ? directMessages : groupMessages;
  const isChatLoading = activeTab === "direct" ? isSettingUpDirectChat : isSettingUpGroupChat;

  const activeHasMore = activeTab === "direct" ? hasMoreDirect : hasMoreGroup;
  const activeLoadMore = activeTab === "direct" ? loadMoreDirect : loadMoreGroup;

  const isLeadership = userData?.role?.toLowerCase() === 'owner' || 
                        userData?.role?.toLowerCase() === 'founder' || 
                        userData?.role?.toLowerCase() === 'manager' || 
                        !!userData?.ownedOrgId;

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

  const activeAvatar = activeTab === "direct" && selectedEmployee
    ? getUserAvatar(selectedEmployee)
    : undefined;

  const activeName = activeTab === "direct" && selectedEmployee
    ? selectedEmployee.name
    : (selectedGroup ? selectedGroup.name : undefined);

  return (
    <>
      <InviteModal 
        isOpen={showInviteModal}
        onOpenChange={setShowInviteModal}
      />

      <CreateGroupModal
        isOpen={showCreateGroupModal}
        onOpenChange={setShowCreateGroupModal}
        employees={staffMembers}
        onCreateGroup={handleCreateGroup}
      />

      <ManageGroupModal
        isOpen={showManageGroupModal}
        onOpenChange={setShowManageGroupModal}
        group={selectedGroup}
        employees={employees}
        currentUserId={user.uid}
        isLeadership={isLeadership}
        onUpdateGroup={handleUpdateGroup}
        onDeleteGroup={handleDeleteGroup}
      />

      <DeletedGroupsModal
        isOpen={showDeletedGroupsModal}
        onOpenChange={setShowDeletedGroupsModal}
        deletedGroups={deletedGroups}
        onRestoreGroup={handleRestoreGroup}
      />

      <main className="flex-1 flex flex-col overflow-hidden bg-background relative h-full">
        <header className="h-16 border-b border-border/40 bg-card/50 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-4">
            {(!(selectedEmployee || selectedGroup) || !isMobile) ? (
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsMobileOpen(true)}>
                <Menu size={20} />
              </Button>
            ) : (
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => {
                setSelectedEmployee(null);
                setSelectedGroup(null);
              }}>
                <X size={20} />
              </Button>
            )}
            <h2 className="font-bold text-sm tracking-widest uppercase">Chat</h2>
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
            <div className="flex-1 flex bg-background overflow-hidden relative h-full">
              <div className={cn(
                "w-full lg:w-80 border-r border-border/40 flex flex-col transition-all duration-300 absolute lg:relative z-20 h-full bg-background",
                (selectedEmployee || selectedGroup) && isMobile ? "-translate-x-full opacity-0" : "translate-x-0 opacity-100"
              )}>
                <EmployeeList
                  employees={staffMembers}
                  selectedEmployee={selectedEmployee}
                  onSelectEmployee={handleSelectEmployee}
                  isLoading={teamLoading}
                  groups={groups}
                  selectedGroup={selectedGroup}
                  onSelectGroup={handleSelectGroup}
                  isLeadership={isLeadership}
                  onCreateGroupClick={() => setShowCreateGroupModal(true)}
                  onDeletedGroupsClick={() => setShowDeletedGroupsModal(true)}
                  activeTab={activeTab}
                  setActiveTab={handleTabChange}
                  directChats={directChats}
                  viewedTimes={viewedTimes}
                  currentUserId={user.uid}
                />
              </div>

              <div className={cn(
                "flex-1 flex flex-col h-full bg-card transition-all duration-300 min-w-0 relative overflow-hidden z-0",
                !(selectedEmployee || selectedGroup) && isMobile ? "translate-x-full opacity-0" : "translate-x-0 opacity-100"
              )}>
                {((activeTab === "direct" && selectedEmployee) || (activeTab === "group" && selectedGroup)) ? (
                  <>
                    <div 
                      className="absolute inset-0 bg-cover bg-center -z-20 transition-all duration-500" 
                      style={{ backgroundImage: `url(https://picsum.photos/seed/${selectedGroup ? selectedGroup.id : (selectedEmployee ? selectedEmployee.id : 'default')}/1200/800)` }} 
                    />
                    <div className="absolute inset-0 bg-[#efeae2]/85 dark:bg-[#0b141a]/90 -z-10 transition-colors duration-300" />
                    <ChatHeader 
                      selectedEmployee={selectedEmployee} 
                      selectedGroup={selectedGroup}
                      onUpdateGroupImage={handleUpdateGroupImage}
                      onManageGroupClick={() => setShowManageGroupModal(true)}
                    />
                    <MessageList
                      key={selectedGroup ? selectedGroup.id : (selectedEmployee ? selectedEmployee.id : 'empty')}
                      messages={activeMessages}
                      userUid={user.uid}
                      selectedEmployeePhotoUrl={activeAvatar}
                      selectedEmployeeName={activeName}
                      ownerPhotoUrl={userData.photoUrl || `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${userData.name}`}
                      ownerName={userData.name || user.displayName || user.email || "You"}
                      isLoading={isChatLoading}
                      ownerData={userData}
                      selectedEmployeeData={selectedEmployee}
                      employees={employees}
                      hasMore={activeHasMore}
                      onLoadMore={activeLoadMore}
                    />
                    <ChatInput
                      inputText={inputText}
                      onInputChange={handleInputChange}
                      onSendMessage={handleSendMessage}
                      isDisabled={!isChatReady}
                      isPremium={isSubscriptionActive}
                      employees={staffMembers}
                      isGroupChat={activeTab === "group"}
                      onUploadFile={handleUploadFile}
                      onUploadSuccess={handleUploadSuccess}
                      onSendVoiceNote={handleSendVoiceNote}
                    />
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground bg-secondary/10">
                    <div className="p-6 rounded-full bg-secondary/30 mb-6 animate-in zoom-in duration-500">
                      <MessageSquare className="h-10 w-10 text-primary/40" />
                    </div>
                    <p className="text-sm font-bold uppercase tracking-widest text-foreground">Select a contact or group</p>
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
}

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