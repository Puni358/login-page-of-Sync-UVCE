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
  createConversationInSupabase,
  deleteConversationFromSupabase,
  deleteMessageFromSupabase,
  fetchTotalUnreadCountFromSupabase,
  fetchUserConversations,
  getOrPrepareConversationInSupabase,
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
  deleteMessage: (messageId: string) => Promise<boolean>
  deleteConversation: (conversationId: string) => Promise<boolean>
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
  const [draftConversation, setDraftConversation] = useState<ChatConversation | null>(null)
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

  // Supabase Realtime subscriptions on messages and conversations tables
  useEffect(() => {
    if (!currentUserId) return

    const channel = supabase
      .channel(`realtime_chat_${currentUserId}`)
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
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
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
    if (draftConversation && draftConversation.id === activeId) {
      return draftConversation
    }
    return conversations.find((c) => c.id === activeId) || null
  }, [activeId, conversations, draftConversation])

  const openInbox = useCallback(() => {
    refresh()
    setIsOpen(true)
    setView("list")
    setActiveId(null)
    setDraftConversation(null)
  }, [refresh])

  const openChat = useCallback(
    async (params: OpenChatParams) => {
      if (!currentUserId) {
        console.error("[ChatContext] openChat missing currentUserId")
        return
      }
      setIsLoading(true)
      try {
        const conv = await getOrPrepareConversationInSupabase(currentUserId, params)

        if (conv && conv.id) {
          if (conv.id.startsWith("draft_")) {
            setDraftConversation(conv)
          } else {
            setDraftConversation(null)
            await markSupabaseConversationRead(conv.id, currentUserId)
          }
          setActiveId(conv.id)
          await refresh()
          setIsOpen(true)
          setView("thread")
        } else {
          console.error("[ChatContext] Failed to get or prepare conversation in Supabase.")
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
    setDraftConversation(null)
  }, [])

  const backToList = useCallback(() => {
    refresh()
    setView("list")
    setActiveId(null)
    setDraftConversation(null)
  }, [refresh])

  const selectConversation = useCallback(
    async (id: string) => {
      if (!currentUserId) return
      setDraftConversation(null)
      await markSupabaseConversationRead(id, currentUserId)
      setActiveId(id)
      setView("thread")
      await refresh()
    },
    [currentUserId, refresh]
  )

  const sendMessage = useCallback(
    async (body: string) => {
      if (!activeId || !currentUserId || !body.trim()) return

      let targetConvId = activeId

      if (activeId.startsWith("draft_") && draftConversation) {
        const realConvId = await createConversationInSupabase(
          currentUserId,
          draftConversation.itemId,
          draftConversation.otherPartyUserId
        )
        if (!realConvId) {
          console.error("[ChatContext] Failed to create conversation in Supabase")
          return
        }
        targetConvId = realConvId
      }

      const newMsg = await sendMessageToSupabase(targetConvId, currentUserId, body)
      if (newMsg) {
        setDraftConversation(null)
        setActiveId(targetConvId)
        await refresh()
      }
    },
    [activeId, currentUserId, draftConversation, refresh]
  )

  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!currentUserId || !messageId) return false
      const success = await deleteMessageFromSupabase(messageId, currentUserId)
      if (success) {
        await refresh()
      }
      return success
    },
    [currentUserId, refresh]
  )

  const deleteConversation = useCallback(
    async (conversationId: string) => {
      if (!currentUserId || !conversationId) return false
      if (conversationId.startsWith("draft_")) {
        setDraftConversation(null)
        if (activeId === conversationId) {
          setActiveId(null)
          setView("list")
        }
        return true
      }
      const success = await deleteConversationFromSupabase(conversationId, currentUserId)
      if (success) {
        if (activeId === conversationId) {
          setActiveId(null)
          setView("list")
        }
        await refresh()
      }
      return success
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
      deleteMessage,
      deleteConversation,
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
      deleteMessage,
      deleteConversation,
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
