import { Layout, Button, Typography, Popconfirm, Tooltip, message } from 'antd'
import {
  PlusOutlined,
  DeleteOutlined,
  MessageOutlined,
  CommentOutlined,
  SearchOutlined,
  MenuFoldOutlined
} from '@ant-design/icons'
import { useConversationStore } from '@/stores/conversationStore'
import { useStreamChat } from '@/hooks/useStreamChat'
import { useEffect } from 'react'

const { Sider } = Layout
const { Text } = Typography

interface Props {
  collapsed: boolean
  onCollapse: (v: boolean) => void
}

export default function AppSidebar({ collapsed, onCollapse }: Props) {
  const { conversations, currentId, loading, fetchConversations, deleteConversation } =
    useConversationStore()
  const { selectConversation, newChat } = useStreamChat()

  useEffect(() => {
    fetchConversations()
  }, [])

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const ok = await deleteConversation(id)
    if (ok) message.success('已删除')
    else message.error('删除失败')
  }

  return (
    <Sider
      width={260}
      collapsedWidth={0}
      collapsed={collapsed}
      collapsible
      trigger={null}
      onCollapse={onCollapse}
      style={{
        background: 'var(--ds-sidebar-bg)',
        borderRight: '1px solid var(--ds-border)',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: 260,
          minWidth: 260
        }}
      >
        {/* Branding */}
        <div
          style={{
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--ds-border)'
          }}
        >
          <Text strong style={{ color: 'var(--ds-text-primary)', fontSize: 16, letterSpacing: 1 }}>
            Nook
          </Text>

          <Tooltip title="搜索" placement="right">
            <Button
              type="text"
              icon={<SearchOutlined />}
              style={{
                color: 'var(--ds-text-secondary)',
                borderRadius: 10,
                flexShrink: 0,
                marginLeft: 'auto' 
              }}
            />
          </Tooltip>

          <Button
            type="text"
            size="small"
            icon={<MenuFoldOutlined />}
            onClick={() => onCollapse(true)}
            style={{ color: 'var(--ds-text-secondary)', borderRadius: 8 }}
          />
        </div>

        {/* Conversation list */}
        <div style={{ flex: 1, overflow: 'hidden auto', padding: '8px' }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={newChat}
            block
            style={{
              background: 'var(--ds-accent)',
              borderColor: 'var(--ds-accent)',
              borderRadius: 10
            }}
          >
            新建对话
          </Button>

          {loading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--ds-text-tertiary)' }}>
              加载中...
            </div>
          ) : conversations.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center' }}>
              <CommentOutlined
                style={{ fontSize: 28, color: 'var(--ds-text-tertiary)', marginBottom: 12 }}
              />
              <div style={{ color: 'var(--ds-text-tertiary)', fontSize: 13 }}>
                暂无对话记录
              </div>
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = conv.id === currentId
              return (
                <div
                  key={conv.id}
                  onClick={() => selectConversation(conv.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    marginBottom: 2,
                    borderRadius: 10,
                    cursor: 'pointer',
                    background: isActive ? 'var(--ds-sidebar-active)' : 'transparent',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive)
                      (e.currentTarget as HTMLDivElement).style.background =
                        'var(--ds-sidebar-hover)'
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive)
                      (e.currentTarget as HTMLDivElement).style.background = 'transparent'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        color: isActive ? 'var(--ds-text-primary)' : 'var(--ds-text-secondary)',
                        fontSize: 13
                      }}
                    >
                      <MessageOutlined style={{ fontSize: 13, flexShrink: 0 }} />
                      <span
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {conv.title}
                      </span>
                    </div>
                    {conv.updated_at && (
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--ds-text-tertiary)',
                          marginTop: 2,
                          paddingLeft: 21
                        }}
                      >
                        {new Date(conv.updated_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  <Popconfirm
                    title="删除此对话？"
                    description="删除后不可恢复"
                    onConfirm={(e) => handleDelete(conv.id, e)}
                    onCancel={(e) => e?.stopPropagation()}
                    okText="删除"
                    cancelText="取消"
                    okButtonProps={{ danger: true, size: 'small' }}
                    cancelButtonProps={{ size: 'small' }}
                  >
                    <Button
                      type="text"
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        color: 'var(--ds-text-tertiary)',
                        opacity: 0,
                        transition: 'opacity 0.15s',
                        flexShrink: 0
                      }}
                      className="sidebar-delete-btn"
                    />
                  </Popconfirm>
                </div>
              )
            })
          )}
        </div>
      </div>
    </Sider>
  )
}
