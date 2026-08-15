"use client"

import { MessageCircle } from "lucide-react"
import type { ChatConversation } from "@/lib/chat/types"

interface ChatListProps {
  conversations: ChatConversation[]
  onSelect: (id: string) => void
}

function getItemTypeLabel(type?: string): string {
  if (!type) return "Marketplace"
  const t = type.toLowerCase()
  if (t === "lost") return "Lost"
  if (t === "found") return "Found"
  if (t === "market" || t === "marketplace") return "Marketplace"
  return type.charAt(0).toUpperCase() + type.slice(1)
}

export function ChatList({ conversations, onSelect }: ChatListProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
          <MessageCircle className="h-6 w-6" />
        </div>
        <p className="text-sm text-white/50">No messages yet</p>
        <p className="mt-1 text-xs text-white/30">
          Click Message on a listing to start a conversation
        </p>
      </div>
    )
  }

  return (
    <ul className="flex-1 overflow-y-auto divide-y divide-white/5">
      {conversations.map((conv) => {
        const lastMsg = conv.messages[conv.messages.length - 1]
        const hasUnread = conv.unreadCount > 0
        const typeLabel = getItemTypeLabel(conv.itemType)
        const conversationLabel = `${conv.otherPartyName} – ${conv.itemTitle} (${typeLabel})`

        return (
          <li key={conv.id}>
            <button
              type="button"
              onClick={() => onSelect(conv.id)}
              className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/5 group"
            >
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-sm font-semibold text-purple-300 border border-purple-500/30">
                {conv.otherPartyName.charAt(0).toUpperCase()}
                {hasUnread && (
                  <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-red-500 ring-2 ring-[#12121a]" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-white group-hover:text-purple-300 transition-colors">
                    {conversationLabel}
                  </p>
                  <span className="shrink-0 text-[10px] text-white/30">
                    {new Date(conv.updatedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
                <p className="truncate text-xs font-medium text-purple-400/80">
                  {conv.itemTitle} ({typeLabel})
                </p>
                <p className="mt-0.5 truncate text-xs text-white/40">
                  {lastMsg?.body ?? "No messages"}
                </p>
              </div>

              {/* Red unread badge */}
              {hasUnread && (
                <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white shadow-sm shadow-red-500/30">
                  {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                </span>
              )}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
