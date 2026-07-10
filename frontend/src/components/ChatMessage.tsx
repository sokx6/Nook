import { Button, Tooltip, message as messageApi } from 'antd'
import {
  CopyOutlined,
  RedoOutlined,
  DeleteOutlined,
  CheckOutlined,
  RobotOutlined,
  UserOutlined
} from '@ant-design/icons'
import type { Message } from '@/types'
import { useStreamChat } from '@/hooks/useStreamChat'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'

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
          <RobotOutlined style={{ color: 'var(--ds-accent)', fontSize: 14 }} />
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
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            )
          ) : (
            <span style={{ color: 'var(--ds-text-tertiary)', fontStyle: 'italic' }}>
              思考中...
            </span>
          )}
        </div>

        {isUser && !isStreaming && hovered && message.content && (
          <div style={{ display: 'flex', gap: 4, marginTop: 6, justifyContent: 'flex-end' }}>
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

        {!isUser && !isStreaming && hovered && message.content && (
          <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
            {actionButton(
              copied ? <CheckOutlined /> : <CopyOutlined />,
              '复制',
              handleCopyButton
            )}
          </div>
        )}
      </div>
    </div>
  )
}
