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
  const router = useRouter();
  const { userData } = useAuth();
  
  const orgId = userData?.ownedOrgId || userData?.orgId;

  // Use a stable ID for new chats that doesn't change on every render
  const [newChatId] = useState(() => crypto.randomUUID());
  const sessionChatId = routeChatId || newChatId;

  const { chatMessages, setMessagesForChat } = useChatStore();
  
  // Memoize initial messages to prevent useChat from resetting unnecessarily
  const initialMessages = useMemo(() => 
    chatMessages[sessionChatId] || [], 
    [sessionChatId, chatMessages]
  );

  const { 
    messages, 
    setMessages, 
    sendMessage, 
    status 
  } = useChat<Message>({
    id: sessionChatId,
    messages: initialMessages,
    transport: new DefaultChatTransport({
        api: '/api/chat',
    }),
    onFinish: (result) => {
        // We no longer persist the whole dump here. 
        // The server-side /api/chat route handles writing the AI response to the sub-collection.
    },
    onError: (error) => {
        console.error("AI Chat Error:", error);
    }
  });

  const isLoading = status === 'submitted' || status === 'streaming';
  const [initialLoading, setInitialLoading] = useState(!!routeChatId);

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
            
            if (loadedMsgs.length > 0) {
                setMessages(loadedMsgs);
                setMessagesForChat(routeChatId, loadedMsgs);
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
  }, [userData?.uid, routeChatId, setMessages, setMessagesForChat]); 

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

    // 1. Create the User Message Object
    const userMsg: any = {
        role: 'user',
        parts: [{ type: 'text', text: content }],
        createdAt: new Date().toISOString() // Client-side timestamp for immediate UI
    };

    // 2. Persist Message to Firestore Sub-collection (Atomic)
    try {
        const messagesRef = collection(db, 'users', userId, 'chats', sessionChatId, 'messages');
        await addDoc(messagesRef, userMsg);

        // 3. Update Chat Summary (Metadata)
        const chatRef = doc(db, 'users', userId, 'chats', sessionChatId);
        await setDoc(chatRef, {
            updatedAt: serverTimestamp(),
            lastMessage: content.substring(0, 100),
            orgId: orgId || null,
            title: messages.length === 0 ? content.substring(0, 40) : undefined
        }, { merge: true });

        if (!routeChatId) {
            router.replace(`/dashboard/c/${sessionChatId}`, { scroll: false });
        }
    } catch (e) {
        console.error("Error persisting user message:", e);
    }

    // 4. Trigger AI SDK
    sendMessage({ text: content }, {
        body: {
            chatId: sessionChatId,
            orgId: orgId || null,
            userId: userId || null
        }
    });
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
