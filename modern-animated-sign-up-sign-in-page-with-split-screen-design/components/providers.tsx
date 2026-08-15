"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { AuthProvider, useAuth } from "@/lib/auth/auth-context"
import { ChatProvider } from "@/lib/chat/chat-context"
import { ChatWidget } from "@/components/chat/chat-widget"

const PROTECTED_PREFIXES = ["/marketplace", "/lost-and-found", "/suggestions"]

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { isLoading, isPending, isApproved } = useAuth()

  const showChat =
    pathname !== "/" &&
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/pending-approval") &&
    !pathname.startsWith("/auth/callback")

  const isProtectedRoute = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )

  useEffect(() => {
    if (isLoading) return

    if (isPending && isProtectedRoute) {
      router.replace("/pending-approval")
      return
    }

    if (isApproved && pathname === "/pending-approval") {
      router.replace("/marketplace")
    }
  }, [isLoading, isPending, isApproved, isProtectedRoute, pathname, router])

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
