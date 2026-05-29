"use client";

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import type { TracAiUIMessage as Message } from '@/lib/ai/agents/trac-ai';
import { useAuth } from '@/hooks/use-auth';
import { ChatItem } from "./ChatItem";
import { ChatInput } from "./ChatInput";
import { motion, AnimatePresence } from "framer-motion";
import { useRef, useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, setDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { useChatStore } from '@/store/use-chat-store';

export function ChatInterface() {
  const params = useParams();
  const routeChatId = params.id as string | undefined;

  // Use a stable ID for new chats
  const [newChatId] = useState(() => crypto.randomUUID());
  const sessionChatId = routeChatId || newChatId;

  // KEY-BASED REMOUNTING:
  // By providing a unique key to the inner component, we force a 
  // complete unmount/remount when switching chats. This clears 
  // all internal state of the useChat hook and other effects.
  return <ChatContent key={sessionChatId} sessionChatId={sessionChatId} routeChatId={routeChatId} />;
}

function ChatContent({ sessionChatId, routeChatId }: { sessionChatId: string, routeChatId?: string }) {
  const router = useRouter();
  const { userData } = useAuth();
  const orgId = userData?.ownedOrgId || userData?.orgId;

  const { setChatMetadata } = useChatStore();

  const {
    messages,
    setMessages,
    sendMessage,
    status
  } = useChat<Message>({
    id: sessionChatId,
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
    onFinish: (result) => {
      // Hydration is handled by Firestore listener
    },
    onError: (error) => {
      console.error("AI Chat Error:", error);
    }
  });

  const isLoading = status === 'submitted' || status === 'streaming';
  const [initialLoading, setInitialLoading] = useState(!!routeChatId);

  // Refs to break dependency cycles in the listener
  const statusRef = useRef(status);
  const messagesLengthRef = useRef(messages.length);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    messagesLengthRef.current = messages.length;
  }, [messages.length]);

  // 1. Effect: Real-time Hydration from Firestore Sub-collection
  useEffect(() => {
    const userId = userData?.uid;
    if (userId && routeChatId) {
      setInitialLoading(true);
      const messagesRef = collection(db, 'users', userId, 'chats', routeChatId, 'messages');
      const q = query(messagesRef, orderBy('createdAt', 'asc'));

      const unsub = onSnapshot(q, (snapshot) => {
        const loadedMsgs = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data(),
        })) as unknown as Message[];

        const isIdle = statusRef.current === 'ready';
        const hasCaughtUp = loadedMsgs.length >= messagesLengthRef.current;

        // Only sync from Firestore if we are NOT currently streaming an AI response
        // AND Firestore has caught up to our optimistic local state.
        if (loadedMsgs.length > 0 && isIdle && (hasCaughtUp || messagesLengthRef.current === 0)) {
          setMessages(loadedMsgs);
        }
        setInitialLoading(false);
      }, (error) => {
        console.error("History hydration error:", error);
        setInitialLoading(false);
      });

      return () => unsub();
    } else {
      setInitialLoading(false);
    }
  }, [userData?.uid, routeChatId, setMessages]); // Removed 'status' to prevent re-subscribing

  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    const userId = userData?.uid;
    if (!userId) return;

    // 1. Trigger AI SDK first (Optimistic UI)
    sendMessage({ text: content }, {
      body: {
        chatId: sessionChatId,
        orgId: orgId || null,
        userId: userId || null,
        userName: userData?.name || null,
        userRole: userData?.role || null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    });

    // 2. Persist Message to Firestore Sub-collection (Background)
    try {
      const userMsg: any = {
        role: 'user',
        parts: [{ type: 'text', text: content }],
        createdAt: new Date().toISOString()
      };

      const messagesRef = collection(db, 'users', userId, 'chats', sessionChatId, 'messages');
      await addDoc(messagesRef, userMsg);

      // 3. Update Chat Summary (Metadata)
      const chatRef = doc(db, 'users', userId, 'chats', sessionChatId);
      const chatUpdate: any = {
        updatedAt: serverTimestamp(),
        lastMessage: "You: " + content.substring(0, 100),
        orgId: orgId || null,
      };

      // Only set title if this is the first message
      if (messages.length === 0) {
        chatUpdate.title = content.substring(0, 40);
      }

      await setDoc(chatRef, chatUpdate, { merge: true });
      setChatMetadata(sessionChatId, chatUpdate);

      if (!routeChatId) {
        router.replace(`/dashboard/c/${sessionChatId}`, { scroll: false });
      }
    } catch (e) {
      console.error("Error persisting user message:", e);
    }
  };

  // Zero-state condition
  const showZeroState = !routeChatId && messages.length === 0 && !initialLoading && !isLoading;

  return (
    <div className="flex flex-col h-full relative">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto custom-scrollbar px-4 md:px-8 py-8 space-y-6"
      >
        <AnimatePresence mode="wait">
          {initialLoading ? (
            <motion.div
              key="loading-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center min-h-[60vh]"
            >
              <div className="size-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            </motion.div>
          ) : showZeroState ? (
            <motion.div
              key="zero-state"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
            >
              <h1 className="text-4xl md:text-6xl font-poppins font-bold tracking-tighter mb-4 max-w-3xl leading-tight">
                Hello, I am <span className="text-primary">Trac AI</span>
              </h1>
              <p className="text-xl md:text-2xl font-poppins font-bold text-muted-foreground max-w-2xl leading-relaxed">
                Your AI Manager. I help you run, monitor, and manage your team.
              </p>
            </motion.div>
          ) : (
            <div className="max-w-4xl mx-auto w-full space-y-6">
              {messages.map((msg: Message) => (
                <ChatItem key={msg.id} message={msg} />
              ))}
              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <ChatItem
                  message={{ id: "loading", role: "assistant", parts: [{ type: 'text', text: '' }] } as unknown as Message}
                  isLoading={true}
                />
              )}
            </div>
          )}
        </AnimatePresence>
      </div>

      <div className="shrink-0 pt-4">
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
}
