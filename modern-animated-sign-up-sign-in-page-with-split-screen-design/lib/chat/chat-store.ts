import type { ChatConversation, ChatMessage, OpenChatParams } from "./types"

const STORAGE_KEY = "sync_chat_conversations"

function readConversations(): ChatConversation[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as ChatConversation[]) : []
  } catch {
    return []
  }
}

function writeConversations(conversations: ChatConversation[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations))
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function getConversations(): ChatConversation[] {
  return readConversations().sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
}

export function getTotalUnreadCount(): number {
  return readConversations().reduce((sum, c) => sum + c.unreadCount, 0)
}

export function getOrCreateConversation(params: OpenChatParams): ChatConversation {
  const conversations = readConversations()
  const existing = conversations.find(
    (c) =>
      c.itemId === params.itemId &&
      c.itemType === params.itemType &&
      c.otherPartyUserId === params.otherPartyUserId
  )
  if (existing) return existing

  const now = new Date().toISOString()
  const newConv: ChatConversation = {
    id: generateId("conv"),
    itemId: params.itemId,
    itemType: params.itemType,
    itemTitle: params.itemTitle,
    otherPartyName: params.otherPartyName,
    otherPartyUserId: params.otherPartyUserId,
    unreadCount: 0,
    updatedAt: now,
    messages: [],
  }
  conversations.unshift(newConv)
  writeConversations(conversations)
  return newConv
}

export function getConversationById(id: string): ChatConversation | null {
  return readConversations().find((c) => c.id === id) ?? null
}

export function sendMessage(conversationId: string, body: string): ChatMessage | null {
  const conversations = readConversations()
  const index = conversations.findIndex((c) => c.id === conversationId)
  if (index === -1) return null

  const message: ChatMessage = {
    id: generateId("msg"),
    body: body.trim(),
    senderId: "me",
    senderName: "You",
    isOwn: true,
    createdAt: new Date().toISOString(),
  }

  conversations[index].messages.push(message)
  conversations[index].updatedAt = message.createdAt
  writeConversations(conversations)
  return message
}

export function markConversationRead(conversationId: string): void {
  const conversations = readConversations()
  const index = conversations.findIndex((c) => c.id === conversationId)
  if (index === -1) return
  conversations[index].unreadCount = 0
  writeConversations(conversations)
}
