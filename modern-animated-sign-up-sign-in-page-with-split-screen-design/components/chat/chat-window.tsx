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

export function ChatWindow({ conversation, onBack, onSend }: ChatWindowProps) {
  const [draft, setDraft] = useState("")
  const [error, setError] = useState("")
  const [otherPartyFullName, setOtherPartyFullName] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [conversation.messages])

  // Requirement 1: Fetch the other participant's name from profiles table
  useEffect(() => {
    let isMounted = true
    if (!conversation.otherPartyUserId) {
      setOtherPartyFullName(null)
      return
    }

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

  const displayName = otherPartyFullName || conversation.otherPartyName

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

  // Requirement 4: Find the last message sent by current user to attach "Seen" label when read === true
  const lastOwnMessage = [...conversation.messages].reverse().find((m) => m.isOwn)

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3 bg-[#12121a]">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/5 hover:text-white"
          aria-label="Back to inbox"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-300 border border-purple-500/30">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{displayName}</p>
          <p className="truncate text-xs text-white/40">{conversation.itemTitle}</p>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {conversation.messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-white/40">No messages yet. Say hello!</p>
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
                    "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm shadow-sm",
                    msg.isOwn
                      ? "rounded-br-md bg-purple-600 text-white"
                      : "rounded-bl-md bg-[#1a1a26] text-white/90 border border-white/5"
                  )}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                  <div
                    className={cn(
                      "mt-1 flex items-center justify-end gap-1 text-[10px]",
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

                {/* Requirement 4: Show a small "Seen" label under the sender's own last message once read */}
                {isLastOwnMessage && msg.read && (
                  <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-purple-300 pr-1">
                    <CheckCheck className="h-3 w-3 text-purple-400" />
                    <span>Seen</span>
                  </div>
                )}
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="border-t border-white/5 p-3 bg-[#12121a]">
        {error && <p className="mb-2 text-xs text-red-400">{error}</p>}
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value)
              if (error) setError("")
            }}
            placeholder="Type a message..."
            className="flex-1 rounded-xl border border-white/5 bg-[#1a1a26] px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:border-purple-500/70 focus:outline-none focus:ring-2 focus:ring-purple-500/25"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500 text-white transition-colors hover:bg-purple-400 disabled:opacity-40 shadow-lg shadow-purple-500/20"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  )
}
