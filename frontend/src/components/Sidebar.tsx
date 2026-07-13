import { Layout, Button, Typography, Dropdown, Modal, Input, Tooltip, message } from 'antd'
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  MessageOutlined,
  CommentOutlined,
  SearchOutlined,
  MenuFoldOutlined
} from '@ant-design/icons'
import { useConversationStore } from '@/stores/conversationStore'
import { useStreamChat } from '@/hooks/useStreamChat'
import { useEffect, useState } from 'react'
import type { MenuProps } from 'antd'
import nookLogo from '@/renderer/assets/nook.svg'
import nookLogoDark from '@/renderer/assets/nook_dark.svg'

const { Sider } = Layout
const { Text } = Typography

interface Props {
  collapsed: boolean
  onCollapse: (v: boolean) => void
  onSearchOpen: () => void
}

export default function AppSidebar({ collapsed, onCollapse, onSearchOpen }: Props) {
  const { conversations, currentId, loading, fetchConversations, deleteConversation, renameTitle } =
    useConversationStore()
  const { selectConversation, newChat } = useStreamChat()

  const [renameOpen, setRenameOpen] = useState(false)
  const [renameId, setRenameId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [isDark, setIsDark] = useState(
    () => document.documentElement.getAttribute('data-theme') === 'dark'
  )

  useEffect(() => {
    fetchConversations()
  }, [])

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.getAttribute('data-theme') === 'dark')
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '删除对话',
      content: '确定要删除此对话吗？删除后不可恢复。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        const ok = await deleteConversation(id)
        if (ok) message.success('已删除')
        else message.error('删除失败')
      }
    })
  }

  const openRename = (id: string, title: string) => {
    setRenameId(id)
    setRenameValue(title)
    setRenameOpen(true)
  }

  const handleRename = async () => {
    if (!renameId || !renameValue.trim()) return
    const ok = await renameTitle(renameId, renameValue.trim())
    if (ok) message.success('重命名成功')
    else message.error('重命名失败')
    setRenameOpen(false)
    setRenameId(null)
    setRenameValue('')
  }

  const cancelRename = () => {
    setRenameOpen(false)
    setRenameId(null)
    setRenameValue('')
  }

  const menuItems = (conv: typeof conversations[0]): MenuProps['items'] => [
    {
      key: 'rename',
      icon: <EditOutlined />,
      label: '重命名',
      onClick: () => openRename(conv.id, conv.title)
    },
    { type: 'divider' },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: '删除',
      danger: true,
      onClick: () => handleDelete(conv.id)
    }
  ]

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
            borderBottom: '1px solid var(--ds-border)',
            transition: 'background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease'
          }}
        >
          <img src={isDark ? nookLogoDark : nookLogo} alt="Nook" style={{ height: 20 }} />

          <Tooltip title="搜索" placement="bottom">
            <Button
              type="text"
              icon={<SearchOutlined />}
              onClick={onSearchOpen}
              style={{
                color: 'var(--ds-text-secondary)',
                borderRadius: 10,
                flexShrink: 0,
                marginLeft: 'auto' 
              }}
            />
          </Tooltip>

          <Tooltip title="收起侧边栏" placement="bottom">
          <Button
            type="text"
            size="small"
            icon={<MenuFoldOutlined />}
            onClick={() => onCollapse(true)}
            style={{ color: 'var(--ds-text-secondary)', borderRadius: 8 }}
          />
          </Tooltip>
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
              borderRadius: 10,
              marginBottom: 10
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
                <Dropdown
                  key={conv.id}
                  menu={{ items: menuItems(conv) }}
                  trigger={['contextMenu']}
                >
                  <div
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
                  </div>
                </Dropdown>
              )
            })
          )}
        </div>
      </div>

      <Modal
        title="重命名对话"
        open={renameOpen}
        onOk={handleRename}
        onCancel={cancelRename}
        okText="确认"
        cancelText="取消"
      >
        <Input
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onPressEnter={handleRename}
          placeholder="请输入新标题"
        />
      </Modal>
    </Sider>
  )
}
