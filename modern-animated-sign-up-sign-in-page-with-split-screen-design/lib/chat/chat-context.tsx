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
import { useAuth } from "@/lib/auth/auth-context"
import { supabase } from "@/lib/supabaseClient"
import type { ChatConversation, OpenChatParams } from "./types"
import {
  fetchTotalUnreadCountFromSupabase,
  fetchUserConversations,
  getOrCreateConversationInSupabase,
  markSupabaseConversationRead,
  sendMessageToSupabase,
} from "./chat-service"

type ChatView = "closed" | "list" | "thread"

interface ChatContextValue {
  isOpen: boolean
  view: ChatView
  conversations: ChatConversation[]
  activeConversation: ChatConversation | null
  unreadCount: number
  isLoading: boolean
  openInbox: () => void
  openChat: (params: OpenChatParams) => Promise<void>
  closeChat: () => void
  backToList: () => void
  selectConversation: (id: string) => Promise<void>
  sendMessage: (body: string) => Promise<void>
  refresh: () => Promise<void>
}

const ChatContext = createContext<ChatContextValue | null>(null)

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const currentUserId = user?.id

  const [isOpen, setIsOpen] = useState(false)
  const [view, setView] = useState<ChatView>("closed")
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)

  const refresh = useCallback(async () => {
    if (!currentUserId) {
      setConversations([])
      setUnreadCount(0)
      return
    }

    try {
      const [convs, unread] = await Promise.all([
        fetchUserConversations(currentUserId),
        fetchTotalUnreadCountFromSupabase(currentUserId),
      ])
      setConversations(convs)
      setUnreadCount(unread)
    } catch (err) {
      console.error("Failed to refresh chat data from Supabase:", err)
    }
  }, [currentUserId])

  useEffect(() => {
    setHasMounted(true)
    refresh()
  }, [refresh])

  // Supabase Realtime subscriptions on messages table
  useEffect(() => {
    if (!currentUserId) return

    const channel = supabase
      .channel(`realtime_messages_${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => {
          refresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId, refresh])

  const activeConversation = useMemo(() => {
    if (!activeId) return null
    return conversations.find((c) => c.id === activeId) || null
  }, [activeId, conversations])

  const openInbox = useCallback(() => {
    refresh()
    setIsOpen(true)
    setView("list")
    setActiveId(null)
  }, [refresh])

  const openChat = useCallback(
    async (params: OpenChatParams) => {
      if (!currentUserId) {
        console.error("[ChatContext] openChat missing currentUserId")
        return
      }
      setIsLoading(true)
      try {
        console.log("[ChatContext] Awaiting getOrCreateConversationInSupabase for item:", params.itemId)
        const conv = await getOrCreateConversationInSupabase(currentUserId, params)
        console.log("[ChatContext] getOrCreateConversationInSupabase returned conversation:", conv)

        if (conv && conv.id) {
          await markSupabaseConversationRead(conv.id, currentUserId)
          setActiveId(conv.id)
          await refresh()
          setIsOpen(true)
          setView("thread")
        } else {
          console.error("[ChatContext] Failed to get or create conversation in Supabase.")
        }
      } catch (err) {
        console.error("Error opening chat:", err)
      } finally {
        setIsLoading(false)
      }
    },
    [currentUserId, refresh]
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
    async (id: string) => {
      if (!currentUserId) return
      await markSupabaseConversationRead(id, currentUserId)
      setActiveId(id)
      setView("thread")
      await refresh()
    },
    [currentUserId, refresh]
  )

  const sendMessage = useCallback(
    async (body: string) => {
      if (!activeId || !currentUserId || !body.trim()) {
        console.error("[ChatContext] sendMessage missing activeId or currentUserId:", {
          activeId,
          currentUserId,
          hasBody: Boolean(body?.trim()),
        })
        return
      }

      console.log(
        "[ChatContext] Calling sendMessageToSupabase with confirmed conversation ID:",
        activeId
      )

      const newMsg = await sendMessageToSupabase(activeId, currentUserId, body)
      if (newMsg) {
        await refresh()
      } else {
        console.error("[ChatContext] sendMessageToSupabase returned null.")
      }
    },
    [activeId, currentUserId, refresh]
  )

  const value = useMemo(
    () => ({
      isOpen,
      view,
      conversations,
      activeConversation,
      unreadCount: hasMounted ? unreadCount : 0,
      isLoading,
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
      isLoading,
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
