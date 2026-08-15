"use client"

import { usePathname } from "next/navigation"
import { AuthProvider } from "@/lib/auth/auth-context"
import { ChatProvider } from "@/lib/chat/chat-context"
import { ChatWidget } from "@/components/chat/chat-widget"

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const showChat = pathname !== "/" && !pathname.startsWith("/admin")

  return (
    <>
      {children}
      {showChat && <ChatWidget />}
    </>
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ChatProvider>
        <AppShell>{children}</AppShell>
      </ChatProvider>
    </AuthProvider>
  )
}
