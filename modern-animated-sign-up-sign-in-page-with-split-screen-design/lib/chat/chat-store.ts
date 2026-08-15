import type { ChatConversation, ChatMessage, OpenChatParams } from "./types"

const STORAGE_KEY = "sync_chat_conversations"

const DUMMY_MESSAGES: Omit<ChatMessage, "id" | "createdAt">[] = [
  { body: "Hi! Is this still available?", senderId: "other", senderName: "Student", isOwn: false },
  { body: "Yes, it is. When would you like to pick it up?", senderId: "me", senderName: "You", isOwn: true },
]

function readConversations(): ChatConversation[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as ChatConversation[]
    return seedDummyConversations()
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

function seedDummyConversations(): ChatConversation[] {
  const now = Date.now()
  const seeded: ChatConversation[] = [
    {
      id: "conv_demo_1",
      itemId: "demo",
      itemType: "marketplace",
      itemTitle: "Engineering Physics Textbook",
      otherPartyName: "Rahul K.",
      unreadCount: 1,
      updatedAt: new Date(now - 3600000).toISOString(),
      messages: [
        {
          id: "msg_1",
          body: "Hey, is the book still available?",
          senderId: "other",
          senderName: "Rahul K.",
          isOwn: false,
          createdAt: new Date(now - 7200000).toISOString(),
        },
        {
          id: "msg_2",
          body: "Yes! DM me when you want to collect it.",
          senderId: "me",
          senderName: "You",
          isOwn: true,
          createdAt: new Date(now - 5400000).toISOString(),
        },
        {
          id: "msg_3",
          body: "Can we meet near the library tomorrow?",
          senderId: "other",
          senderName: "Rahul K.",
          isOwn: false,
          createdAt: new Date(now - 3600000).toISOString(),
        },
      ],
    },
    {
      id: "conv_demo_2",
      itemId: "demo2",
      itemType: "lost-found",
      itemTitle: "Black wallet found",
      otherPartyName: "Priya S.",
      unreadCount: 0,
      updatedAt: new Date(now - 86400000).toISOString(),
      messages: [
        {
          id: "msg_4",
          body: "I think this might be mine. Can you describe the contents?",
          senderId: "me",
          senderName: "You",
          isOwn: true,
          createdAt: new Date(now - 90000000).toISOString(),
        },
        {
          id: "msg_5",
          body: "It has a student ID and a few cards inside.",
          senderId: "other",
          senderName: "Priya S.",
          isOwn: false,
          createdAt: new Date(now - 86400000).toISOString(),
        },
      ],
    },
  ]
  writeConversations(seeded)
  return seeded
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
    (c) => c.itemId === params.itemId && c.itemType === params.itemType
  )
  if (existing) return existing

  const now = new Date().toISOString()
  const newConv: ChatConversation = {
    id: generateId("conv"),
    itemId: params.itemId,
    itemType: params.itemType,
    itemTitle: params.itemTitle,
    otherPartyName: params.otherPartyName,
    unreadCount: 0,
    updatedAt: now,
    messages: DUMMY_MESSAGES.map((m, i) => ({
      ...m,
      id: generateId("msg"),
      senderName: m.isOwn ? "You" : params.otherPartyName,
      createdAt: new Date(Date.now() - (DUMMY_MESSAGES.length - i) * 60000).toISOString(),
    })),
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
