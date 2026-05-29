import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { TracAiUIMessage as Message } from '@/lib/ai/agents/trac-ai';

interface ChatMetadata {
  id: string;
  title?: string;
  lastMessage?: string;
  updatedAt?: any;
}

interface ChatState {
  chatMetadata: Record<string, ChatMetadata>;
  setChatMetadata: (chatId: string, metadata: Partial<ChatMetadata>) => void;
  clearChat: (chatId: string) => void;
  clearAll: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      chatMetadata: {},
      setChatMetadata: (chatId, metadata) =>
        set((state) => ({
          chatMetadata: {
            ...state.chatMetadata,
            [chatId]: { ...(state.chatMetadata[chatId] || { id: chatId }), ...metadata }
          }
        })),
      clearChat: (chatId) =>
        set((state) => {
          const newMetadata = { ...state.chatMetadata };
          delete newMetadata[chatId];
          return { chatMetadata: newMetadata };
        }),
      clearAll: () => set({ chatMetadata: {} }),
    }),
    {
      name: 'trac-ai-chat-metadata',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
