"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { supabase } from "@/lib/supabaseClient"
import type { AuthUser, LoginInput, SignUpInput } from "./types"
import { resolveAuthUser } from "./profile-service"
import {
  getSessionAuthUser,
  isSigningUp,
  performGoogleSignIn,
  performLogin,
  performLogout,
  performSignUp,
  updateUserPhone,
} from "./auth-service"

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  isApproved: boolean
  isPending: boolean
  isAdmin: boolean
  login: (input: LoginInput) => Promise<{ success: boolean; error?: string; isPending?: boolean; noAccountFound?: boolean }>
  signUp: (input: SignUpInput) => Promise<{ success: boolean; error?: string; isPending?: boolean }>
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  updatePhone: (phone: string) => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    const authUser = await getSessionAuthUser()
    setUser(authUser)
  }, [])

  useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        const authUser = await getSessionAuthUser()
        if (mounted) setUser(authUser)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return

      if (isSigningUp()) {
        console.log("[AuthCheck - onAuthStateChange] Skipping profile check because sign up is currently in progress.")
        return
      }

      if (session?.user) {
        try {
          const authUser = await resolveAuthUser(session.user)
          if (!authUser) {
            console.log("[AuthCheck - onAuthStateChange] Profile check ran for user:", session.user.id, "Found profile: false -> Cleaning up orphan & signing out.")
            try {
              await fetch("/api/auth/cleanup-orphan", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: session.user.id }),
              })
            } catch (err) {
              console.error("[AuthCheck - onAuthStateChange] Orphan cleanup failed:", err)
            }
            await supabase.auth.signOut()
            setUser(null)
          } else {
            console.log("[AuthCheck - onAuthStateChange] Profile check ran for user:", session.user.id, "Found profile: true.")
            setUser(authUser)
          }
        } catch {
          setUser(null)
        }
      } else {
        setUser(null)
      }

      setIsLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const login = useCallback(async (input: LoginInput) => {
    const result = await performLogin(input)
    if (result.success && result.user) {
      setUser(result.user)
      return { success: true, isPending: result.user.approvalStatus === "pending" }
    }
    return { success: false, error: result.error ?? "Login failed", noAccountFound: result.noAccountFound }
  }, [])

  const signUp = useCallback(async (input: SignUpInput) => {
    const result = await performSignUp(input)
    if (result.success && result.user) {
      setUser(result.user)
      return { success: true, isPending: result.user.approvalStatus === "pending" }
    }
    return { success: false, error: result.error ?? "Sign up failed" }
  }, [])

  const signInWithGoogle = useCallback(async () => {
    return performGoogleSignIn()
  }, [])

  const logout = useCallback(async () => {
    await performLogout()
    setUser(null)
  }, [])

  const updatePhone = useCallback(
    async (phone: string) => {
      if (!user) return
      await updateUserPhone(user.id, phone)
      setUser({ ...user, phone: phone.trim() })
    },
    [user]
  )

  const isPending = user?.approvalStatus === "pending"
  const isApproved =
    !!user && user.approvalStatus !== "pending" && user.approvalStatus !== "rejected"
  const isAdmin = user?.isAdmin === true

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      isApproved,
      isPending,
      isAdmin,
      login,
      signUp,
      signInWithGoogle,
      logout,
      updatePhone,
      refreshUser,
    }),
    [
      user,
      isLoading,
      isApproved,
      isPending,
      isAdmin,
      login,
      signUp,
      signInWithGoogle,
      logout,
      updatePhone,
      refreshUser,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
