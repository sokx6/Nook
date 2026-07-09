import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Conversation, Message } from '@/types'
import { useSettingsStore } from './settingsStore'

interface MessagesCache {
  [conversationId: string]: Message[]
}

interface ConversationState {
  conversations: Conversation[]
  currentId: string | null
  loading: boolean
  messagesCache: MessagesCache

  setCurrentId: (id: string | null) => void
  fetchConversations: () => Promise<void>
  createConversation: (title: string) => Promise<Conversation | null>
  deleteConversation: (id: string) => Promise<boolean>
  cacheMessages: (conversationId: string, messages: Message[]) => void
  getCachedMessages: (conversationId: string) => Message[]
  clearMessageCache: (conversationId: string) => void
}

function getBaseUrl(): string {
  return useSettingsStore.getState().settings.baseUrl
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${getBaseUrl()}${path}`, {
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    ...options
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message || `HTTP ${res.status}`)
  }
  return res.json()
}

export const useConversationStore = create<ConversationState>()(
  persist(
    (set, get) => ({
      conversations: [],
      currentId: null,
      loading: false,
      messagesCache: {},

      setCurrentId: (id) => set({ currentId: id }),

      fetchConversations: async () => {
        set({ loading: true })
        try {
          const data = await apiFetch<Conversation[]>('/api/conversations')
          set({ conversations: data, loading: false })
        } catch {
          set({ loading: false })
        }
      },

      createConversation: async (title) => {
        try {
          const conv = await apiFetch<Conversation>('/api/conversations', {
            method: 'POST',
            body: JSON.stringify({ title })
          })
          set((s) => ({
            conversations: [conv, ...s.conversations],
            currentId: conv.id
          }))
          return conv
        } catch {
          return null
        }
      },

      deleteConversation: async (id) => {
        try {
          await apiFetch(`/api/conversations/${id}`, { method: 'DELETE' })
          set((s) => {
            const cache = { ...s.messagesCache }
            delete cache[id]
            return {
              conversations: s.conversations.filter((c) => c.id !== id),
              currentId: s.currentId === id ? (s.conversations[0]?.id ?? null) : s.currentId,
              messagesCache: cache
            }
          })
          return true
        } catch {
          return false
        }
      },

      cacheMessages: (conversationId, messages) =>
        set((s) => ({
          messagesCache: { ...s.messagesCache, [conversationId]: messages }
        })),

      getCachedMessages: (conversationId) => {
        return get().messagesCache[conversationId] || []
      },

      clearMessageCache: (conversationId) =>
        set((s) => {
          const cache = { ...s.messagesCache }
          delete cache[conversationId]
          return { messagesCache: cache }
        })
    }),
    {
      name: 'nook-messages-cache',
      partialize: (state) => ({ messagesCache: state.messagesCache })
    }
  )
)
