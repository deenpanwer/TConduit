"use client";

import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import { 
  collection, query, onSnapshot, doc, orderBy,
  addDoc, setDoc, getDoc, serverTimestamp, limitToLast
} from "firebase/firestore";
import { useAuth } from "./use-auth";

export interface ChatMessage {
  id?: string;
  senderId: string;
  text: string;
  timestamp: any; // Firebase Timestamp
  type?: "text" | "image" | "video" | "audio" | "file";
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
}

interface UseEmployeeChatResult {
  messages: ChatMessage[];
  chatId: string | null;
  isSettingUpChat: boolean;
  getChatId: (orgId: string, employeeId: string) => string;
  ensureAndInitConversation: (orgId: string, employeeId: string, ownerId: string, employeeName: string) => Promise<void>;
  sendEmployeeMessage: (chatId: string, senderId: string, text: string) => Promise<void>;
  loadMore: () => void;
  hasMore: boolean;
}

export function useEmployeeChat(
  selectedEmployee: any | null, 
  owner: any | null, 
  userOrgId: string | undefined
): UseEmployeeChatResult {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatId, setChatId] = useState<string | null>(null);
  const [isSettingUpChat, setIsSettingUpChat] = useState(false);
  
  // Pagination limit state
  const [messageLimit, setMessageLimit] = useState(20);
  const [hasMore, setHasMore] = useState(true);

  const getChatId = useCallback((orgId: string, employeeId: string): string => {
    return `${orgId}_${employeeId}`;
  }, []);

  // Ensure organization-scoped conversation document exists
  const ensureAndInitConversation = useCallback(async (orgId: string, employeeId: string, ownerId: string, employeeName: string): Promise<void> => {
    const currentChatId = getChatId(orgId, employeeId);
    
    // Scopes direct chats under '/organizations/{orgId}/chats/{chatId}'
    const chatDocRef = doc(db, "organizations", orgId, "chats", currentChatId);
    const chatDoc = await getDoc(chatDocRef);

    if (!chatDoc.exists()) {
      await setDoc(chatDocRef, {
        orgId,
        employeeId,
        ownerId,
        participants: [employeeId, ownerId],
        createdAt: serverTimestamp(),
        lastMessageAt: serverTimestamp(),
      });

      if (user?.uid === ownerId) {
        const initialMessageText = `Hi ${employeeName}, welcome to our chat! How can I help you?`;
        const messagesRef = collection(db, "organizations", orgId, "chats", currentChatId, "messages");
        await addDoc(messagesRef, {
          senderId: ownerId,
          text: initialMessageText,
          timestamp: serverTimestamp(),
          type: "text"
        });
        await setDoc(chatDocRef, { lastMessageAt: serverTimestamp() }, { merge: true });
      }
    }
  }, [getChatId, user?.uid]);

  const sendEmployeeMessage = useCallback(async (currentChatId: string, senderId: string, text: string): Promise<void> => {
    if (!text.trim() || !userOrgId) return;

    // Writes directly to organization-scoped path
    const messagesRef = collection(db, "organizations", userOrgId, "chats", currentChatId, "messages");
    
    await addDoc(messagesRef, {
      senderId,
      text: text.trim(),
      timestamp: serverTimestamp(),
      type: "text"
    });

    const chatDocRef = doc(db, "organizations", userOrgId, "chats", currentChatId);
    await setDoc(chatDocRef, { 
      lastMessage: text.trim(), 
      lastMessageAt: serverTimestamp(),
      lastMessageSenderId: senderId
    }, { merge: true });
  }, [userOrgId]);

  const loadMore = useCallback(() => {
    setMessageLimit((prev) => prev + 20);
  }, []);

  // Synchronizes, merges, and pages messages
  useEffect(() => {
    if (!selectedEmployee || !user || !userOrgId || !owner) {
      setChatId(null);
      setMessages([]);
      setIsSettingUpChat(false);
      return;
    }

    setIsSettingUpChat(true);

    const currentChatId = getChatId(userOrgId, selectedEmployee.id);
    setChatId(currentChatId);

    let unsubModern: (() => void) | undefined;
    let unsubLegacy: (() => void) | undefined;
    
    let modernMsgs: ChatMessage[] = [];
    let legacyMsgs: ChatMessage[] = [];

    const handleMergeUpdate = () => {
      // Merge unique IDs and sort by timestamp
      const map = new Map<string, ChatMessage>();
      legacyMsgs.forEach((m) => {
        if (m.id) map.set(m.id, m);
      });
      modernMsgs.forEach((m) => {
        if (m.id) map.set(m.id, m);
      });

      const sorted = Array.from(map.values());
      sorted.sort((a, b) => {
        const timeA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0;
        const timeB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0;
        return timeA - timeB;
      });

      setMessages(sorted);
      
      // Determine if there are more messages to fetch
      const currentFetchedCount = sorted.length;
      setHasMore(currentFetchedCount >= messageLimit);
    };

    const setupChatLogic = async () => {
      try {
        await ensureAndInitConversation(userOrgId, selectedEmployee.id, user.uid, selectedEmployee.name);
        
        // 1. Subscribe to organization-scoped chat (MODERN SCHEMA)
        const modernMessagesRef = collection(db, "organizations", userOrgId, "chats", currentChatId, "messages");
        const modernQuery = query(modernMessagesRef, orderBy("timestamp", "asc"), limitToLast(messageLimit));
        
        unsubModern = onSnapshot(modernQuery, (snapshot) => {
          modernMsgs = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as ChatMessage[];
          handleMergeUpdate();
          setIsSettingUpChat(false);
        });

        // 2. Subscribe to root chats collection (LEGACY SCHEMA)
        // === DEPRECATED GRACE PERIOD FALLBACK (Remove after 1 month) ===
        const legacyMessagesRef = collection(db, "chats", currentChatId, "messages");
        const legacyQuery = query(legacyMessagesRef, orderBy("timestamp", "asc"), limitToLast(messageLimit));
        
        unsubLegacy = onSnapshot(legacyQuery, (snapshot) => {
          legacyMsgs = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as ChatMessage[];
          handleMergeUpdate();
        }, (error) => {
          // If root collection is not found or inaccessible, ignore and fall back
          console.warn("[EmployeeChat] Root chats collection fallback warning:", error.message);
          legacyMsgs = [];
          handleMergeUpdate();
        });
        // ==============================================================

      } catch (error) {
        console.error("Error setting up chat in useEmployeeChat:", error);
        setIsSettingUpChat(false);
      }
    };

    setupChatLogic();

    return () => {
      if (unsubModern) unsubModern();
      if (unsubLegacy) unsubLegacy();
    };
  }, [selectedEmployee, user, userOrgId, owner, messageLimit, getChatId, ensureAndInitConversation]);

  return {
    messages,
    chatId,
    isSettingUpChat,
    getChatId,
    ensureAndInitConversation,
    sendEmployeeMessage,
    loadMore,
    hasMore,
  };
}
