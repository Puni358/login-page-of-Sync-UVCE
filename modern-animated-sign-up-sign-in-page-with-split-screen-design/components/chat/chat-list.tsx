"use client"

import { MessageCircle } from "lucide-react"
import type { ChatConversation } from "@/lib/chat/types"
import { cn } from "@/lib/utils"

interface ChatListProps {
  conversations: ChatConversation[]
  onSelect: (id: string) => void
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
    <ul className="flex-1 overflow-y-auto">
      {conversations.map((conv) => (
        <li key={conv.id}>
          <button
            type="button"
            onClick={() => onSelect(conv.id)}
            className="flex w-full items-start gap-3 border-b border-white/5 px-4 py-3 text-left transition-colors hover:bg-white/5"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-sm font-semibold text-purple-300">
              {conv.otherPartyName.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium text-white">{conv.otherPartyName}</p>
                <span className="shrink-0 text-[10px] text-white/30">
                  {new Date(conv.updatedAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>
              <p className="truncate text-xs text-purple-400/70">{conv.itemTitle}</p>
              <p className="mt-0.5 truncate text-xs text-white/40">
                {conv.messages[conv.messages.length - 1]?.body ?? "No messages"}
              </p>
            </div>
            {conv.unreadCount > 0 && (
              <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-purple-500 px-1.5 text-[10px] font-bold text-white">
                {conv.unreadCount}
              </span>
            )}
          </button>
        </li>
      ))}
    </ul>
  )
}
