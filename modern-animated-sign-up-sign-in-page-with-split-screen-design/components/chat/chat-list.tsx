"use client"

import { useState } from "react"
import { AlertTriangle, MessageCircle, Trash2 } from "lucide-react"
import { useChat } from "@/lib/chat/chat-context"
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
  const { deleteConversation } = useChat()
  const [convToDelete, setConvToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleConfirmDelete = async () => {
    if (!convToDelete) return
    setIsDeleting(true)
    try {
      await deleteConversation(convToDelete)
    } catch (err) {
      console.error("Failed to delete conversation:", err)
    } finally {
      setIsDeleting(false)
      setConvToDelete(null)
    }
  }

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
    <div className="relative flex-1 overflow-hidden flex flex-col">
      <ul className="flex-1 overflow-y-auto divide-y divide-white/5">
        {conversations.map((conv) => {
          const lastMsg = conv.messages[conv.messages.length - 1]
          const hasUnread = conv.unreadCount > 0
          const typeLabel = getItemTypeLabel(conv.itemType)
          const conversationLabel = `${conv.otherPartyName} – ${conv.itemTitle} (${typeLabel})`

          return (
            <li key={conv.id} className="relative group">
              <button
                type="button"
                onClick={() => onSelect(conv.id)}
                className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/5"
              >
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-sm font-semibold text-purple-300 border border-purple-500/30">
                  {conv.otherPartyName.charAt(0).toUpperCase()}
                  {hasUnread && (
                    <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-red-500 ring-2 ring-[#12121a]" />
                  )}
                </div>
                <div className="min-w-0 flex-1 pr-6">
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

                <div className="flex items-center gap-1.5 shrink-0">
                  {hasUnread && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white shadow-sm shadow-red-500/30">
                      {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                    </span>
                  )}
                </div>
              </button>

              {/* Clear conversation trash icon on hover/touch */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setConvToDelete(conv.id)
                }}
                className="absolute right-3 bottom-3 p-1.5 text-white/20 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/20 hover:text-red-400 rounded-lg"
                title="Clear conversation"
                aria-label="Clear conversation"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          )
        })}
      </ul>

      {/* Confirmation Modal for Clearing Conversation */}
      {convToDelete && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-xs rounded-2xl bg-[#161622] border border-white/10 p-5 shadow-2xl text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 text-red-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-white">Clear Conversation?</h3>
            <p className="mt-1.5 text-xs text-white/60 leading-relaxed">
              Clear this conversation? This will remove it from your inbox only — the other person will still see it. This cannot be undone.
            </p>
            <div className="mt-5 flex gap-2 justify-center">
              <button
                type="button"
                onClick={() => setConvToDelete(null)}
                disabled={isDeleting}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white/80 hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-500 shadow-lg shadow-red-600/30 transition-colors disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Clear"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
