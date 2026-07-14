import { Button, Tooltip, message as messageApi } from 'antd'
import {
  CopyOutlined,
  RedoOutlined,
  DeleteOutlined,
  CheckOutlined,
  UserOutlined
} from '@ant-design/icons'
import type { Message } from '@/types'
import { useStreamChat } from '@/hooks/useStreamChat'
import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { Highlight, themes } from 'prism-react-renderer'
import logoIcon from '@/renderer/assets/logo.svg'

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false)
  const [isLight, setIsLight] = useState(
    () => document.documentElement.getAttribute('data-theme') === 'light'
  )

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsLight(document.documentElement.getAttribute('data-theme') === 'light')
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = code
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      style={{
        borderRadius: 10,
        overflow: 'hidden',
        border: '1px solid var(--ds-border)',
        margin: '12px 0'
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '6px 12px',
          background: 'var(--ds-sidebar-bg)',
          borderBottom: '1px solid var(--ds-border)'
        }}
      >
        <span
          style={{
            fontSize: 12,
            color: 'var(--ds-text-tertiary)',
            fontWeight: 500
          }}
        >
          {language || 'text'}
        </span>
        <Tooltip title={copied ? '已复制' : '复制代码'}>
          <Button
            type="text"
            size="small"
            icon={copied ? <CheckOutlined /> : <CopyOutlined />}
            onClick={handleCopy}
            style={{ color: 'var(--ds-text-tertiary)', fontSize: 12 }}
          />
        </Tooltip>
      </div>
      <Highlight code={code} language={language || 'text'} theme={isLight ? themes.nightOwlLight : themes.nightOwl}>
        {({ tokens, getLineProps, getTokenProps }) => (
          <pre
            style={{
              margin: 0,
              padding: '12px 16px',
              overflow: 'auto',
              background: 'var(--ds-bg)',
              fontSize: 13,
              lineHeight: 1.6,
              textAlign: 'left',
              fontFamily: 'Consolas, monospace'
            }}
          >
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  )
}

interface Props {
  message: Message
  isStreaming: boolean
}

export default function ChatMessageItem({ message, isStreaming }: Props) {
  const { handleRegenerate, handleDeleteMessage } = useStreamChat()
  const [hovered, setHovered] = useState(false)
  const [copied, setCopied] = useState(false)

  const isUser = message.role === 'user'

  const doCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = message.content
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    messageApi.success('已复制')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyButton = (e: React.MouseEvent) => {
    e.stopPropagation()
    doCopy()
  }

  const actionButton = (icon: React.ReactNode, tooltip: string, onClick: (e: React.MouseEvent) => void) => (
    <Tooltip title={tooltip}>
      <Button
        type="text"
        size="small"
        icon={icon}
        onClick={onClick}
        style={{ color: 'var(--ds-text-tertiary)', borderRadius: 8 }}
      />
    </Tooltip>
  )

  return (
    <div
      id={`msg-${message.id}`}
      style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        gap: 12,
        marginBottom: 24,
        padding: '0 4px'
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isUser ? 'var(--ds-accent)' : 'var(--ds-surface)',
          flexShrink: 0,
          marginTop: 2
        }}
      >
        {isUser ? (
          <UserOutlined style={{ color: '#fff', fontSize: 14 }} />
        ) : (
          <img src={logoIcon} alt="Nook" style={{ width: 18, height: 18 }} />
        )}
      </div>

      <div style={{ maxWidth: '75%', minWidth: 0 }}>
        <div
          style={{
            fontSize: 11,
            color: 'var(--ds-text-tertiary)',
            marginBottom: 4,
            textAlign: isUser ? 'right' : 'left'
          }}
        >
          {isUser ? 'You' : 'Nook'}
          {isStreaming && !isUser && (
            <span
              style={{
                display: 'inline-block',
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--ds-accent)',
                marginLeft: 6,
                animation: 'pulse 1.2s infinite'
              }}
            />
          )}
        </div>

        <div
          style={{
            padding: '12px 16px',
            borderRadius: isUser ? '16px 16px 0 16px' : '16px 16px 16px 0',
            background: isUser ? 'var(--ds-accent)' : 'var(--ds-surface)',
            color: isUser ? '#fff' : 'var(--ds-text-primary)',
            fontSize: 14,
            lineHeight: 1.65,
            wordBreak: 'break-word',
            border: isUser ? 'none' : '1px solid var(--ds-border)'
          }}
        >
          {message.content ? (
            isUser ? (
              <span>{message.content}</span>
            ) : (
              <div className="ds-markdown">
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    pre: ({ children }) => <>{children}</>,
                    code: ({ className, children, ...props }: any) => {
                      const match = /language-(\w+)/.exec(className || '')
                      if (match) {
                        const code = String(children).replace(/\n$/, '')
                        return <CodeBlock language={match[1]} code={code} />
                      }
                      return <code className={className} {...props}>{children}</code>
                    }
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )
          ) : (
            <span style={{ color: 'var(--ds-text-tertiary)', fontStyle: 'italic' }}>
              思考中...
            </span>
          )}
        </div>

        {isUser && !isStreaming && message.content && (
          <div style={{
            display: 'flex',
            gap: 4,
            marginTop: 6,
            justifyContent: 'flex-end',
            height: 26,
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.15s',
            pointerEvents: hovered ? 'auto' : 'none'
          }}>
            {actionButton(
              copied ? <CheckOutlined /> : <CopyOutlined />,
              '复制',
              handleCopyButton
            )}
            {actionButton(
              <DeleteOutlined />,
              '删除',
              (e) => { e.stopPropagation(); handleDeleteMessage(message.id) }
            )}
          </div>
        )}

        {!isUser && !isStreaming && message.content && (
          <div style={{
            display: 'flex',
            gap: 4,
            marginTop: 6,
            height: 26,
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.15s',
            pointerEvents: hovered ? 'auto' : 'none'
          }}>
            {actionButton(
              copied ? <CheckOutlined /> : <CopyOutlined />,
              '复制',
              handleCopyButton
            )}
            {actionButton(
              <RedoOutlined />,
              '重新生成',
              (e) => { e.stopPropagation(); handleRegenerate(message.id) }
            )}
            {actionButton(
              <DeleteOutlined />,
              '删除',
              (e) => { e.stopPropagation(); handleDeleteMessage(message.id) }
            )}
          </div>
        )}
      </div>
    </div>
  )
}
