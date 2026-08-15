"use client"

import { MessageCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/auth-context"
import { useChat } from "@/lib/chat/chat-context"
import type { ChatItemType } from "@/lib/chat/types"
import { cn } from "@/lib/utils"

interface ChatButtonProps {
  itemId: string
  itemType: ChatItemType
  itemTitle: string
  otherPartyName: string
  otherPartyUserId: string
  className?: string
  variant?: "default" | "compact"
}

export function ChatButton({
  itemId,
  itemType,
  itemTitle,
  otherPartyName,
  otherPartyUserId,
  className,
  variant = "default",
}: ChatButtonProps) {
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()
  const { openChat } = useChat()

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      const path =
        itemType === "marketplace"
          ? `/marketplace/${itemId}`
          : `/lost-and-found/${itemId}`
      router.push(`/?redirect=${encodeURIComponent(path)}&mode=login`)
      return
    }

    if (user?.id === otherPartyUserId) return

    openChat({ itemId, itemType, itemTitle, otherPartyName, otherPartyUserId })
  }

  if (user?.id === otherPartyUserId) return null

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "inline-flex items-center gap-1 rounded-lg bg-purple-500/15 px-2 py-1 text-xs font-medium text-purple-300 transition-colors hover:bg-purple-500/25",
          className
        )}
      >
        <MessageCircle className="h-3 w-3" />
        Message
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "inline-flex w-full items-center justify-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-2.5 text-sm font-medium text-purple-300 transition-all hover:bg-purple-500/20 hover:border-purple-500/50",
        className
      )}
    >
      <MessageCircle className="h-4 w-4" />
      Message {otherPartyName.split(" ")[0]}
    </button>
  )
}
