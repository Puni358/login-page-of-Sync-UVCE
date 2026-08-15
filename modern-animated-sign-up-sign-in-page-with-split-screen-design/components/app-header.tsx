"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogIn, LogOut, MessageCircle } from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import { useChat } from "@/lib/chat/chat-context"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/marketplace", label: "Campus Marketplace" },
  { href: "/lost-and-found", label: "Lost and Found" },
  { href: "/suggestions", label: "Suggestions" },
] as const

export function AppHeader() {
  const { user, isAuthenticated, logout } = useAuth()
  const { unreadCount, openInbox } = useChat()
  const pathname = usePathname()

  const loginHref =
    pathname && pathname !== "/"
      ? `/?redirect=${encodeURIComponent(pathname)}&mode=login`
      : "/?mode=login"

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`)

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#12121a]/90 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <Link href="/marketplace" className="group shrink-0">
            <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-lg font-bold tracking-wide text-transparent sm:text-xl">
              Sync - UVCE
            </span>
          </Link>

          <nav className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-xl px-3 py-2 text-xs font-medium transition-all sm:text-sm",
                  isActive(item.href)
                    ? "bg-purple-500 text-white shadow-lg shadow-purple-500/20"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3 lg:shrink-0">
            <button
              type="button"
              onClick={openInbox}
              className="relative inline-flex items-center gap-1.5 rounded-xl border border-white/5 px-3 py-2 text-sm text-white/60 transition-colors hover:border-purple-500/25 hover:text-white"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Messages</span>
              {unreadCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {isAuthenticated ? (
              <>
                <div className="hidden items-center gap-2 rounded-xl border border-white/5 bg-[#1a1a26] px-3 py-2 md:flex">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-500/20 text-xs font-semibold text-purple-300">
                    {user?.firstName?.[0]}
                    {user?.lastName?.[0]}
                  </div>
                  <span className="max-w-[120px] truncate text-sm text-white/70">
                    {user?.firstName} {user?.lastName}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/5 px-3 py-2 text-sm text-white/60 transition-colors hover:border-white/15 hover:text-white"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <Link
                href={loginHref}
                className="inline-flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-sm font-medium text-purple-300 transition-all hover:bg-purple-500/20 sm:px-4"
              >
                <LogIn className="h-4 w-4" />
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
