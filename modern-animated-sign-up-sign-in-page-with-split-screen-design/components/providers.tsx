"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { AuthProvider, useAuth } from "@/lib/auth/auth-context"
import { ChatProvider } from "@/lib/chat/chat-context"
import { ChatWidget } from "@/components/chat/chat-widget"
import { LightboxProvider } from "@/components/ui/lightbox-context"

// Routes that pending-approval users should be bounced away from.
// These are NOT auth-gated for browsing — unauthenticated users can view all content.
// Login is only required when a user tries to perform an action (sell, message, report, ask).
const PENDING_RESTRICTED_PREFIXES = ["/marketplace", "/lost-and-found", "/suggestions"]

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { isLoading, isPending, isApproved } = useAuth()

  const showChat =
    pathname !== "/" &&
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/pending-approval") &&
    !pathname.startsWith("/auth/callback")

  const isPendingRestrictedRoute = PENDING_RESTRICTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )

  useEffect(() => {
    if (isLoading) return

    // Redirect pending-approval users away from content routes
    if (isPending && isPendingRestrictedRoute) {
      router.replace("/pending-approval")
      return
    }

    // Redirect approved users away from the pending page
    if (isApproved && pathname === "/pending-approval") {
      router.replace("/marketplace")
    }

    // Unauthenticated users are intentionally NOT redirected —
    // marketplace, lost-and-found, and suggestions are public browsing routes.
  }, [isLoading, isPending, isApproved, isPendingRestrictedRoute, pathname, router])

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
        <LightboxProvider>
          <AppShell>{children}</AppShell>
        </LightboxProvider>
      </ChatProvider>
    </AuthProvider>
  )
}
