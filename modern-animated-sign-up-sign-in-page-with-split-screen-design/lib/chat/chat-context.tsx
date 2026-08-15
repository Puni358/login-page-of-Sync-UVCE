"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { ChatConversation, OpenChatParams } from "./types"
import {
  getConversations,
  getConversationById,
  getOrCreateConversation,
  getTotalUnreadCount,
  markConversationRead,
  sendMessage as sendMessageToStore,
} from "./chat-store"

type ChatView = "closed" | "list" | "thread"

interface ChatContextValue {
  isOpen: boolean
  view: ChatView
  conversations: ChatConversation[]
  activeConversation: ChatConversation | null
  unreadCount: number
  openInbox: () => void
  openChat: (params: OpenChatParams) => void
  closeChat: () => void
  backToList: () => void
  selectConversation: (id: string) => void
  sendMessage: (body: string) => void
  refresh: () => void
}

const ChatContext = createContext<ChatContextValue | null>(null)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [view, setView] = useState<ChatView>("closed")
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [hasMounted, setHasMounted] = useState(false)

  const refresh = useCallback(() => {
    if (typeof window === "undefined") return
    setConversations(getConversations())
    setUnreadCount(getTotalUnreadCount())
    if (activeId) {
      const updated = getConversationById(activeId)
      if (updated) setActiveId(updated.id)
    }
  }, [activeId])

  useEffect(() => {
    setHasMounted(true)
    refresh()
  }, [refresh])

  const activeConversation = useMemo(
    () => (activeId ? getConversationById(activeId) : null),
    [activeId, conversations]
  )

  const openInbox = useCallback(() => {
    refresh()
    setIsOpen(true)
    setView("list")
    setActiveId(null)
  }, [refresh])

  const openChat = useCallback(
    (params: OpenChatParams) => {
      const conv = getOrCreateConversation(params)
      markConversationRead(conv.id)
      refresh()
      setActiveId(conv.id)
      setIsOpen(true)
      setView("thread")
    },
    [refresh]
  )

  const closeChat = useCallback(() => {
    setIsOpen(false)
    setView("closed")
    setActiveId(null)
  }, [])

  const backToList = useCallback(() => {
    refresh()
    setView("list")
    setActiveId(null)
  }, [refresh])

  const selectConversation = useCallback(
    (id: string) => {
      markConversationRead(id)
      setActiveId(id)
      setView("thread")
      refresh()
    },
    [refresh]
  )

  const sendMessage = useCallback(
    (body: string) => {
      if (!activeId || !body.trim()) return
      sendMessageToStore(activeId, body)
      refresh()
    },
    [activeId, refresh]
  )

  const value = useMemo(
    () => ({
      isOpen,
      view,
      conversations,
      activeConversation,
      unreadCount: hasMounted ? unreadCount : 0,
      openInbox,
      openChat,
      closeChat,
      backToList,
      selectConversation,
      sendMessage,
      refresh,
    }),
    [
      isOpen,
      view,
      conversations,
      activeConversation,
      hasMounted,
      unreadCount,
      openInbox,
      openChat,
      closeChat,
      backToList,
      selectConversation,
      sendMessage,
      refresh,
    ]
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error("useChat must be used within ChatProvider")
  return ctx
}
