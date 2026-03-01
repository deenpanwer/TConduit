"use client";

import { useState, useEffect, useCallback, useContext } from "react";
import { db } from "@/lib/firebase";
import { 
  collection, query, onSnapshot, doc, orderBy,
  addDoc, setDoc, getDoc, serverTimestamp 
} from "firebase/firestore";
import { useAuth } from "./use-auth"; // Assuming useAuth is in the same hooks directory

interface ChatMessage {
  id?: string;
  senderId: string;
  text: string;
  timestamp: any; // Firebase Timestamp
}

const CHATS_COLLECTION = "chats";
const MESSAGES_SUBCOLLECTION = "messages";

interface UseEmployeeChatResult {
  messages: ChatMessage[];
  chatId: string | null;
  isSettingUpChat: boolean;
  getChatId: (orgId: string, employeeId: string) => string;
  ensureAndInitConversation: (orgId: string, employeeId: string, ownerId: string, employeeName: string) => Promise<void>;
  subscribeToEmployeeChat: (chatId: string, callback: (messages: ChatMessage[]) => void) => () => void;
  sendEmployeeMessage: (chatId: string, senderId: string, text: string) => Promise<void>;
}

export function useEmployeeChat(
  selectedEmployee: any | null, 
  owner: any | null, 
  userOrgId: string | undefined
): UseEmployeeChatResult {
  const { user, userData } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatId, setChatId] = useState<string | null>(null);
  const [isSettingUpChat, setIsSettingUpChat] = useState(false);

  // --- Chat Functions ---

  const getChatId = useCallback((orgId: string, employeeId: string): string => {
    return `${orgId}_${employeeId}`;
  }, []);

  const ensureAndInitConversation = useCallback(async (orgId: string, employeeId: string, ownerId: string, employeeName: string): Promise<void> => {
    const currentChatId = getChatId(orgId, employeeId);
    const chatDocRef = doc(db, CHATS_COLLECTION, currentChatId);

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
        const messagesRef = collection(db, CHATS_COLLECTION, currentChatId, MESSAGES_SUBCOLLECTION);
        await addDoc(messagesRef, {
          senderId: ownerId,
          text: initialMessageText,
          timestamp: serverTimestamp(),
        });
        await setDoc(chatDocRef, { lastMessageAt: serverTimestamp() }, { merge: true });
      }
    }
  }, [getChatId, user?.uid]);

  const subscribeToEmployeeChat = useCallback((currentChatId: string, callback: (messages: ChatMessage[]) => void) => {
    const messagesRef = collection(db, CHATS_COLLECTION, currentChatId, MESSAGES_SUBCOLLECTION);
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as ChatMessage[];
      callback(msgs);
    });
    return unsubscribe;
  }, []);

  const sendEmployeeMessage = useCallback(async (currentChatId: string, senderId: string, text: string): Promise<void> => {
    if (!text.trim()) return;

    const messagesRef = collection(db, CHATS_COLLECTION, currentChatId, MESSAGES_SUBCOLLECTION);
    
    await addDoc(messagesRef, {
      senderId,
      text: text.trim(),
      timestamp: serverTimestamp(),
    });

    const chatDocRef = doc(db, CHATS_COLLECTION, currentChatId);
    await setDoc(chatDocRef, { lastMessageAt: serverTimestamp() }, { merge: true });
  }, []);

  // Effect to setup chat when selectedEmployee, user, userData, or owner changes
  // Effect to setup chat when selectedEmployee, user, userData, or owner changes
  useEffect(() => {
    // Define ownerId specifically for the current authenticated user (who is the owner in this context)
    const currentAuthenticatedOwnerId = user?.uid; 

    if (!selectedEmployee || !user || !userOrgId || !owner || !currentAuthenticatedOwnerId) { // Check currentAuthenticatedOwnerId
      setChatId(null);
      setMessages([]);
      setIsSettingUpChat(false); // Ensure this is false if conditions aren't met
      return;
    }

    setIsSettingUpChat(true);

    const currentChatId = getChatId(userOrgId, selectedEmployee.id);
    setChatId(currentChatId);

    const setupChatLogic = async () => {
      try {
        await ensureAndInitConversation(userOrgId, selectedEmployee.id, currentAuthenticatedOwnerId, selectedEmployee.name); // Pass currentAuthenticatedOwnerId
        
        const unsubscribe = subscribeToEmployeeChat(currentChatId, (newMessages) => {
          setMessages(newMessages);
        });
        return unsubscribe;
      } catch (error) {
        console.error("Error setting up chat in useEmployeeChat:", error);
        // Handle error as needed
      } finally {
        setIsSettingUpChat(false);
      }
    };

    let unsubscribe: (() => void) | undefined;
    setupChatLogic().then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [selectedEmployee, user, userOrgId, owner, getChatId, ensureAndInitConversation, subscribeToEmployeeChat]);

  return {
    messages,
    chatId,
    isSettingUpChat,
    getChatId,
    ensureAndInitConversation,
    subscribeToEmployeeChat,
    sendEmployeeMessage,
  };
}
