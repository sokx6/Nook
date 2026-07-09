import { useCallback, useRef } from 'react'
import { v4 as uuid } from 'uuid'
import { useChatStore } from '@/stores/chatStore'
import { useConversationStore } from '@/stores/conversationStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { Message, ChatStreamChunk } from '@/types'

export function useStreamChat() {
  const {
    currentConversationId, messages, input, isLoading,
    setInput, setIsLoading, addMessage, updateLastAssistantMessage,
    setCurrentConversationId, setMessages, clearChat
  } = useChatStore()

  const {
    currentId, setCurrentId, createConversation, fetchConversations,
    cacheMessages, getCachedMessages, clearMessageCache
  } = useConversationStore()

  const { settings } = useSettingsStore()
  const abortRef = useRef<AbortController | null>(null)

  async function doStream(convId: string, userMsgContent: string) {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch(`${settings.baseUrl}/api/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsgContent,
          conversation_id: convId,
          model: settings.model
        }),
        signal: controller.signal
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let full = ''
      let buf = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })

        while (true) {
          const idx = buf.indexOf('\n\n')
          if (idx === -1) break
          const block = buf.slice(0, idx)
          buf = buf.slice(idx + 2)

          const dataLine = block
            .split('\n')
            .find((line) => line.startsWith('data: '))
          if (!dataLine) continue

          const raw = dataLine.slice(6)
          if (raw === '[DONE]') continue

          try {
            const p: ChatStreamChunk = JSON.parse(raw)
            if (p.content) {
              full += p.content
              updateLastAssistantMessage(full)
            }
          } catch { /* skip */ }
        }
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      const msg = '请求失败: ' + (err instanceof Error ? err.message : '系统错误')
      updateLastAssistantMessage(msg)
    } finally {
      setIsLoading(false)
      const currentMessages = useChatStore.getState().messages
      const convIdForCache = useChatStore.getState().currentConversationId || currentId
      if (convIdForCache) {
        cacheMessages(convIdForCache, currentMessages)
      }
      await fetchConversations()
    }
  }

  const sendMessage = useCallback(async () => {
    const t = input.trim()
    if (!t || isLoading) return

    let convId = currentConversationId || currentId

    if (!convId) {
      const title = t.length > 20 ? t.slice(0, 20) : t
      const conv = await createConversation(title)
      if (!conv) return
      convId = conv.id
      setCurrentConversationId(convId)
      setCurrentId(convId)
    }

    setInput('')
    setIsLoading(true)

    addMessage({
      id: uuid(),
      conversationId: convId,
      role: 'user',
      content: t,
      timestamp: Date.now()
    })

    addMessage({
      id: uuid(),
      conversationId: convId,
      role: 'assistant',
      content: '',
      timestamp: Date.now()
    })

    await doStream(convId, t)
  }, [
    input, isLoading, currentConversationId, currentId,
    createConversation, setCurrentConversationId, setCurrentId,
    setInput, setIsLoading, addMessage
  ])

  const handleRegenerate = useCallback(async () => {
    const convId = currentConversationId || currentId
    if (!convId) return

    const lastUser = [...messages].reverse().find((m) => m.role === 'user')
    const lastAsst = [...messages].reverse().find((m) => m.role === 'assistant')
    if (!lastUser) return

    const filtered = lastAsst
      ? messages.filter((m) => m.id !== lastAsst.id)
      : messages

    setIsLoading(true)

    const newAsst: Message = {
      id: uuid(),
      conversationId: convId,
      role: 'assistant',
      content: '',
      timestamp: Date.now()
    }

    const newMsgs = [...filtered, newAsst]
    setMessages(newMsgs)

    await doStream(convId, lastUser.content)
  }, [
    currentConversationId, currentId, messages,
    setIsLoading, setMessages
  ])

  const handleDeleteMessage = useCallback(
    (messageId: string) => {
      const convId = currentConversationId || currentId
      if (!convId) return

      const msg = messages.find((m) => m.id === messageId)
      if (!msg) return

      let newMsgs: Message[]

      if (msg.role === 'user') {
        const idx = messages.findIndex((m) => m.id === messageId)
        const next = messages[idx + 1]
        const toRemove = new Set([messageId])
        if (next?.role === 'assistant') toRemove.add(next.id)
        newMsgs = messages.filter((m) => !toRemove.has(m.id))
      } else {
        newMsgs = messages.filter((m) => m.id !== messageId)
      }

      setMessages(newMsgs)
      cacheMessages(convId, newMsgs)
    },
    [currentConversationId, currentId, messages, setMessages, cacheMessages]
  )

  const selectConversation = useCallback(
    (id: string) => {
      abortRef.current?.abort()
      setCurrentConversationId(id)
      setCurrentId(id)
      const cached = getCachedMessages(id)
      setMessages(cached)
    },
    [setCurrentConversationId, setCurrentId, setMessages, getCachedMessages]
  )

  const newChat = useCallback(() => {
    abortRef.current?.abort()
    clearChat()
    setCurrentId(null)
  }, [clearChat, setCurrentId])

  return {
    sendMessage,
    handleRegenerate,
    handleDeleteMessage,
    selectConversation,
    newChat
  }
}
