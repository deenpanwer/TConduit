import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { TracAiUIMessage as Message } from '@/lib/ai/agents/trac-ai';

interface ChatState {
  chatMessages: Record<string, Message[]>;
  setMessagesForChat: (chatId: string, messages: Message[]) => void;
  clearChat: (chatId: string) => void;
  clearAll: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      chatMessages: {},
      setMessagesForChat: (chatId, messages) => 
        set((state) => ({
          chatMessages: { 
            ...state.chatMessages, 
            [chatId]: messages 
          }
        })),
      clearChat: (chatId) =>
        set((state) => {
          const newMessages = { ...state.chatMessages };
          delete newMessages[chatId];
          return { chatMessages: newMessages };
        }),
      clearAll: () => set({ chatMessages: {} }),
    }),
    {
      name: 'trac-ai-chat-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
