"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowLeft, Send } from "lucide-react"
import type { ChatConversation } from "@/lib/chat/types"
import { cn } from "@/lib/utils"

interface ChatWindowProps {
  conversation: ChatConversation
  onBack: () => void
  onSend: (body: string) => void
}

export function ChatWindow({ conversation, onBack, onSend }: ChatWindowProps) {
  const [draft, setDraft] = useState("")
  const [error, setError] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [conversation.messages])

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

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/5 hover:text-white"
          aria-label="Back to inbox"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{conversation.otherPartyName}</p>
          <p className="truncate text-xs text-white/40">{conversation.itemTitle}</p>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {conversation.messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-white/40">No messages yet. Say hello!</p>
        ) : (
          conversation.messages.map((msg) => (
            <div
              key={msg.id}
              className={cn("flex", msg.isOwn ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm",
                  msg.isOwn
                    ? "rounded-br-md bg-purple-500 text-white"
                    : "rounded-bl-md bg-[#1a1a26] text-white/85"
                )}
              >
                <p className="leading-relaxed">{msg.body}</p>
                <p
                  className={cn(
                    "mt-1 text-[10px]",
                    msg.isOwn ? "text-purple-200/60" : "text-white/30"
                  )}
                >
                  {new Date(msg.createdAt).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="border-t border-white/5 p-3">
        {error && <p className="mb-2 text-xs text-red-400">{error}</p>}
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value)
              if (error) setError("")
            }}
            placeholder="Type a message..."
            className="flex-1 rounded-xl border border-white/5 bg-[#1a1a26] px-3 py-2.5 text-sm text-white placeholder-white/30 focus:border-purple-500/70 focus:outline-none focus:ring-2 focus:ring-purple-500/25"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500 text-white transition-colors hover:bg-purple-400 disabled:opacity-40"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  )
}
