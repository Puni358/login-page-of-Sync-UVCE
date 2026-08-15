"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowLeft, CheckCheck, Send } from "lucide-react"
import type { ChatConversation } from "@/lib/chat/types"
import { fetchProfile } from "@/lib/auth/profile-service"
import { cn } from "@/lib/utils"

interface ChatWindowProps {
  conversation: ChatConversation
  onBack: () => void
  onSend: (body: string) => void
}

function getItemTypeLabel(type?: string): string {
  if (!type) return "Marketplace"
  const t = type.toLowerCase()
  if (t === "lost") return "Lost"
  if (t === "found") return "Found"
  if (t === "market" || t === "marketplace") return "Marketplace"
  return type.charAt(0).toUpperCase() + type.slice(1)
}

export function ChatWindow({ conversation, onBack, onSend }: ChatWindowProps) {
  const [draft, setDraft] = useState("")
  const [error, setError] = useState("")
  const [otherPartyFullName, setOtherPartyFullName] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [conversation.messages])

  // Fetch participant name from Supabase profiles if not already resolved
  useEffect(() => {
    let isMounted = true
    if (!conversation.otherPartyUserId) return

    fetchProfile(conversation.otherPartyUserId)
      .then((profile) => {
        if (isMounted && profile?.full_name?.trim()) {
          setOtherPartyFullName(profile.full_name.trim())
        }
      })
      .catch((err) => {
        console.error("Failed to fetch participant profile:", err)
      })

    return () => {
      isMounted = false
    }
  }, [conversation.otherPartyUserId])

  const displayName = otherPartyFullName || conversation.otherPartyName || "Campus User"
  const typeLabel = getItemTypeLabel(conversation.itemType)
  const headerTitle = `${displayName} – ${conversation.itemTitle} (${typeLabel})`
  const headerSubtitle = `${conversation.itemTitle} (${typeLabel})`

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft.trim()) {
      setError("Message cannot be empty")
      return
    }
    setError("")
    onSend(draft)
    setDraft("")
  }

  // Find the last message sent by current user
  const lastOwnMessage = [...conversation.messages].reverse().find((m) => m.isOwn)

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-[#12121a]">
      {/* Chat Window Header */}
      <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3 bg-[#161622]">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/5 hover:text-white"
          aria-label="Back to inbox"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-300 border border-purple-500/30 shadow-inner">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{headerTitle}</p>
          <p className="truncate text-xs font-medium text-purple-400/90">{headerSubtitle}</p>
        </div>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {conversation.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-white/40">No messages yet.</p>
            <p className="text-xs text-white/20 mt-1">Send a message to start chatting with {displayName}!</p>
          </div>
        ) : (
          conversation.messages.map((msg) => {
            const isLastOwnMessage = msg.isOwn && lastOwnMessage?.id === msg.id

            return (
              <div
                key={msg.id}
                className={cn("flex flex-col", msg.isOwn ? "items-end" : "items-start")}
              >
                <div
                  className={cn(
                    "max-w-[82%] rounded-2xl px-4 py-2.5 text-sm shadow-md transition-all",
                    // Sender's own messages align RIGHT with vibrant gradient bubble
                    msg.isOwn
                      ? "rounded-br-xs bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                      : // Other participant's messages align LEFT with sleek dark contrast bubble
                        "rounded-bl-xs bg-[#1f1f2e] text-white/90 border border-white/10"
                  )}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                  <div
                    className={cn(
                      "mt-1.5 flex items-center justify-end gap-1 text-[10px]",
                      msg.isOwn ? "text-purple-200/70" : "text-white/40"
                    )}
                  >
                    <span>
                      {new Date(msg.createdAt).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                {/* "Seen" label when read is confirmed true in DB for sender's last message */}
                {isLastOwnMessage && msg.read && (
                  <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-purple-300 pr-1">
                    <CheckCheck className="h-3.5 w-3.5 text-purple-400" />
                    <span>Seen</span>
                  </div>
                )}
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Footer */}
      <form onSubmit={handleSend} className="border-t border-white/5 p-3 bg-[#161622]">
        {error && <p className="mb-2 text-xs text-red-400">{error}</p>}
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value)
              if (error) setError("")
            }}
            placeholder="Type a message..."
            className="flex-1 rounded-xl border border-white/5 bg-[#1f1f2e] px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:border-purple-500/70 focus:outline-none focus:ring-2 focus:ring-purple-500/25"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white transition-all hover:opacity-90 disabled:opacity-40 shadow-lg shadow-purple-500/20"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  )
}
