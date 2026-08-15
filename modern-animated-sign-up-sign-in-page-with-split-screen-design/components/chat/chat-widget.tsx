"use client"

import { MessageCircle, X } from "lucide-react"
import { useChat } from "@/lib/chat/chat-context"
import { ChatList } from "./chat-list"
import { ChatWindow } from "./chat-window"
import { cn } from "@/lib/utils"

export function ChatWidget() {
  const {
    isOpen,
    view,
    conversations,
    activeConversation,
    unreadCount,
    openInbox,
    closeChat,
    backToList,
    selectConversation,
    sendMessage,
  } = useChat()

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          onClick={openInbox}
          className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-purple-500 text-white shadow-lg shadow-purple-500/40 transition-all hover:scale-105 hover:bg-purple-400 hover:shadow-purple-500/50"
          aria-label="Open messages"
        >
          <MessageCircle className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      )}

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm sm:bg-black/20"
            onClick={closeChat}
            aria-hidden="true"
          />
          <div
            className={cn(
              "fixed z-50 flex flex-col overflow-hidden border border-white/10 bg-[#12121a] shadow-2xl",
              "inset-x-0 bottom-0 h-[85vh] rounded-t-2xl",
              "sm:inset-x-auto sm:bottom-6 sm:right-6 sm:h-[520px] sm:w-[380px] sm:rounded-2xl"
            )}
          >
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
              <h2 className="text-sm font-semibold text-white">
                {view === "thread" && activeConversation ? "Conversation" : "Messages"}
              </h2>
              <button
                type="button"
                onClick={closeChat}
                className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/5 hover:text-white"
                aria-label="Close messages"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {view === "list" && (
              <ChatList conversations={conversations} onSelect={selectConversation} />
            )}

            {view === "thread" && activeConversation && (
              <ChatWindow
                conversation={activeConversation}
                onBack={backToList}
                onSend={sendMessage}
              />
            )}
          </div>
        </>
      )}
    </>
  )
}
