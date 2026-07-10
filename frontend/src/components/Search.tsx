import { useState, useEffect, useRef } from 'react'
import { Input, Button, Radio, Typography, Empty, Spin, message } from 'antd'
import {
  SearchOutlined,
  ArrowLeftOutlined,
  MessageOutlined
} from '@ant-design/icons'
import { useConversationStore } from '@/stores/conversationStore'
import { useStreamChat } from '@/hooks/useStreamChat'
import { useSettingsStore } from '@/stores/settingsStore'
import { Conversation } from '@/types'

const { Text } = Typography

interface Props {
  open: boolean
  onClose: () => void
}

type SearchScope = 'title' | 'content'

export default function SearchPanel({ open, onClose }: Props) {
  const { conversations, fetchConversations } = useConversationStore()
  const { selectConversation } = useStreamChat()
  const settings = useSettingsStore((s) => s.settings)

  const [keyword, setKeyword] = useState('')
  const [scope, setScope] = useState<SearchScope>('title')
  const [results, setResults] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (open) {
      fetchConversations()
    } else {
      setKeyword('')
      setResults([])
      setSearched(false)
    }
  }, [open])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!keyword.trim()) {
      setResults([])
      setSearched(false)
      setLoading(false)
      return
    }

    setLoading(true)
    const kw = keyword.trim()

    debounceRef.current = setTimeout(async () => {
      try {
        if (scope === 'title') {
          const filtered = conversations.filter((c) =>
            c.title.toLowerCase().includes(kw.toLowerCase())
          )
          setResults(filtered)
        } else {
          const baseUrl = settings.baseUrl
          const res = await fetch(
            `${baseUrl}/api/conversations?keyword=${encodeURIComponent(kw)}`,
            { headers: { Accept: 'application/json' } }
          )
          if (!res.ok) throw new Error('search failed')
          const data = await res.json()
          setResults(Array.isArray(data) ? data : [])
        }
        setSearched(true)
      } catch {
        message.error('搜索失败')
        setResults([])
        setSearched(true)
      } finally {
        setLoading(false)
      }
    }, 1000)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [keyword, scope, conversations])

  const handleSelect = (conv: Conversation) => {
    selectConversation(conv.id)
    onClose()
  }

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          width: 560,
          maxHeight: '80vh',
          background: 'var(--ds-surface)',
          borderRadius: 16,
          border: '1px solid var(--ds-border)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            padding: '16px 20px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderBottom: '1px solid var(--ds-border)'
          }}
        >
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={onClose}
            style={{ color: 'var(--ds-text-secondary)', borderRadius: 8, flexShrink: 0 }}
          />
          <Input
            prefix={<SearchOutlined style={{ color: 'var(--ds-text-tertiary)' }} />}
            placeholder="搜索对话..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            allowClear
            autoFocus
            style={{
              flex: 1,
              borderRadius: 10,
              background: 'var(--ds-bg)',
              borderColor: 'var(--ds-border)',
              color: 'var(--ds-text-primary)'
            }}
          />
        </div>

        <div style={{ padding: '8px 20px 0', borderBottom: '1px solid var(--ds-border)' }}>
          <Radio.Group
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            size="small"
            buttonStyle="solid"
            style={{ marginBottom: 8 }}
          >
            <Radio.Button value="title">对话标题</Radio.Button>
            <Radio.Button value="content">对话内容</Radio.Button>
          </Radio.Group>
        </div>

        <div style={{ flex: 1, overflow: 'hidden auto', padding: '12px 20px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 32 }}>
              <Spin size="small" />
            </div>
          ) : searched && results.length === 0 ? (
            <Empty
              description={
                <span style={{ color: 'var(--ds-text-tertiary)' }}>未找到相关对话</span>
              }
              style={{ marginTop: 32 }}
            />
          ) : results.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {results.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => handleSelect(conv)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 10,
                    cursor: 'pointer',
                    background: 'transparent',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background =
                      'var(--ds-sidebar-hover)'
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background = 'transparent'
                  }}
                >
                  <MessageOutlined style={{ color: 'var(--ds-text-tertiary)', fontSize: 13 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ color: 'var(--ds-text-primary)', fontSize: 13 }} ellipsis>
                      {conv.title}
                    </Text>
                    {conv.updated_at && (
                      <div
                        style={{ fontSize: 11, color: 'var(--ds-text-tertiary)', marginTop: 2 }}
                      >
                        {new Date(conv.updated_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
