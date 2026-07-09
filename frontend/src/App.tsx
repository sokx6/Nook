import { Layout, Typography, ConfigProvider, theme, Button, Tooltip } from 'antd'
import {
  CommentOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SunOutlined,
  MoonOutlined
} from '@ant-design/icons'
import Sidebar from '@/components/Sidebar'
import ChatInput from '@/components/ChatInput'
import ChatMessageItem from '@/components/ChatMessage'
import { useChatStore } from '@/stores/chatStore'
import { useConversationStore } from '@/stores/conversationStore'
import { useEffect, useRef, useState, useCallback } from 'react'

const { Header, Content } = Layout
const { Text } = Typography

const MOBILE_WIDTH = 768
const THEME_KEY = 'nook-theme'

function getInitialTheme(): boolean {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    if (stored !== null) return stored === 'dark'
  } catch {}
  return true
}

function saveTheme(isDark: boolean) {
  try {
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light')
  } catch {}
}

export default function App() {
  const { messages, isLoading } = useChatStore()
  const { conversations, currentId } = useConversationStore()
  const chatEndRef = useRef<HTMLDivElement>(null)

  const [isDark, setIsDark] = useState(getInitialTheme)
  const [collapsed, setCollapsed] = useState(() => window.innerWidth < MOBILE_WIDTH)
  const [manualToggle, setManualToggle] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    saveTheme(isDark)
  }, [isDark])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleResize = useCallback(() => {
    if (!manualToggle) {
      setCollapsed(window.innerWidth < MOBILE_WIDTH)
    }
  }, [manualToggle])

  useEffect(() => {
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [handleResize])

  const currentConv = conversations.find((c) => c.id === currentId)

  const toggleSidebar = () => {
    setManualToggle(true)
    setCollapsed((v) => !v)
  }

  const toggleTheme = () => setIsDark((v) => !v)

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: isDark ? '#3b82f6' : '#39C5BB',
          borderRadius: 10,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }
      }}
    >
      <Layout style={{ height: '100vh' }}>
        <Sidebar collapsed={collapsed} onCollapse={setCollapsed} />

        <Layout style={{ background: 'var(--ds-bg)' }}>
          <Header
            style={{
              background: 'var(--ds-bg)',
              borderBottom: '1px solid var(--ds-border)',
              padding: '0 24px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              height: 56
            }}
          >
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={toggleSidebar}
              style={{ color: 'var(--ds-text-secondary)', fontSize: 16, borderRadius: 8 }}
            />
            <Text
              style={{
                color: 'var(--ds-text-primary)',
                fontSize: 14,
                fontWeight: 500,
                flex: 1
              }}
            >
              {currentConv ? currentConv.title : '新对话'}
            </Text>
            <Tooltip title={isDark ? '切换到白天模式' : '切换到夜间模式'}>
              <Button
                type="text"
                icon={isDark ? <SunOutlined /> : <MoonOutlined />}
                onClick={toggleTheme}
                style={{
                  color: 'var(--ds-text-secondary)',
                  fontSize: 16,
                  borderRadius: 8
                }}
              />
            </Tooltip>
          </Header>

          <Content style={{ flex: 1, overflow: 'hidden auto', padding: '24px 24px 0' }}>
            {messages.length === 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: 'var(--ds-text-tertiary)'
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 20,
                    background: 'var(--ds-surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                    border: '1px solid var(--ds-border)'
                  }}
                >
                  <CommentOutlined style={{ fontSize: 26, color: 'var(--ds-accent)' }} />
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 500,
                    color: 'var(--ds-text-secondary)',
                    marginBottom: 6
                  }}
                >
                  开始一段新对话
                </div>
                <div style={{ fontSize: 13 }}>
                  在下方输入您的问题，AI 将实时回复
                </div>
              </div>
            ) : (
              <div style={{ maxWidth: 768, margin: '0 auto', paddingBottom: 8 }}>
                {messages.map((msg) => (
                  <ChatMessageItem
                    key={msg.id}
                    message={msg}
                    isStreaming={
                      isLoading &&
                      msg.role === 'assistant' &&
                      msg.id === messages[messages.length - 1]?.id
                    }
                  />
                ))}
                <div ref={chatEndRef} />
              </div>
            )}
          </Content>

          <ChatInput />
        </Layout>
      </Layout>
    </ConfigProvider>
  )
}
