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
import type { AuthUser, LoginInput, SignUpInput } from "./types"
import {
  getInitialAuthUser,
  performLogin,
  performLogout,
  performSignUp,
} from "./auth-service"

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  isApproved: boolean
  isPending: boolean
  login: (input: LoginInput) => Promise<{ success: boolean; error?: string; isPending?: boolean }>
  signUp: (input: SignUpInput) => Promise<{ success: boolean; error?: string; isPending?: boolean }>
  logout: () => void
  updatePhone: (phone: string) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const AUTH_STORAGE_KEY = "nova_auth_session"

function writeSession(user: AuthUser | null): void {
  if (typeof window === "undefined") return
  if (user) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY)
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setUser(getInitialAuthUser())
    setIsLoading(false)
  }, [])

  const login = useCallback(async (input: LoginInput) => {
    const result = await performLogin(input)
    if (result.success && result.user) {
      setUser(result.user)
      return { success: true, isPending: result.user.approvalStatus === "pending" }
    }
    return { success: false, error: result.error ?? "Login failed" }
  }, [])

  const signUp = useCallback(async (input: SignUpInput) => {
    const result = await performSignUp(input)
    if (result.success && result.user) {
      setUser(result.user)
      return { success: true, isPending: result.user.approvalStatus === "pending" }
    }
    return { success: false, error: result.error ?? "Sign up failed" }
  }, [])

  const logout = useCallback(() => {
    performLogout()
    setUser(null)
  }, [])

  const updatePhone = useCallback(
    (phone: string) => {
      if (!user) return
      const updated = { ...user, phone: phone.trim() }
      writeSession(updated)
      setUser(updated)
    },
    [user]
  )

  const isPending = user?.approvalStatus === "pending"
  const isApproved = !!user && user.approvalStatus !== "pending" && user.approvalStatus !== "rejected"

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      isApproved,
      isPending,
      login,
      signUp,
      logout,
      updatePhone,
    }),
    [user, isLoading, isApproved, isPending, login, signUp, logout, updatePhone]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
