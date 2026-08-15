export type ChatItemType = "marketplace" | "lost-found"

export interface ChatMessage {
  id: string
  body: string
  senderId: string
  senderName: string
  isOwn: boolean
  createdAt: string
}

export interface ChatConversation {
  id: string
  itemId: string
  itemType: ChatItemType
  itemTitle: string
  otherPartyName: string
  messages: ChatMessage[]
  unreadCount: number
  updatedAt: string
}

export interface OpenChatParams {
  itemId: string
  itemType: ChatItemType
  itemTitle: string
  otherPartyName: string
}
