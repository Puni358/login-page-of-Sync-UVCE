import { supabase } from "@/lib/supabaseClient"
import type { AuthUser, LoginInput, SignUpInput } from "./types"
import { fetchProfile, mapToAuthUser, resolveAuthUser } from "./profile-service"
import {
  clearRememberToken,
  writeRememberToken,
} from "./remember-me"

let isSigningUpInProcess = false

export function isSigningUp(): boolean {
  return isSigningUpInProcess
}

export async function getSessionAuthUser(): Promise<AuthUser | null> {
  if (isSigningUpInProcess) {
    console.log("[AuthCheck - getSession] Skipping profile check because sign up is in progress.")
    return null
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) return null
  const authUser = await resolveAuthUser(session.user)
  if (!authUser) {
    console.log("[AuthCheck - getSession] Profile doesn't exist for session user:", session.user.id, "Signing out.")
    await supabase.auth.signOut()
    return null
  }
  return authUser
}

export async function performLogin(
  input: LoginInput
): Promise<{ success: boolean; user?: AuthUser; error?: string; noAccountFound?: boolean }> {
  if (typeof window !== "undefined") {
    if (input.rememberMe) {
      localStorage.setItem("sync_remember_me_active", "true")
    } else {
      localStorage.removeItem("sync_remember_me_active")
    }
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email.trim(),
    password: input.password,
  })

  if (error) return { success: false, error: error.message }
  if (!data.user) return { success: false, error: "Login failed" }

  const profile = await fetchProfile(data.user.id, data.user.email)
  console.log("[AuthCheck - Sign In] Profile check ran for user:", data.user.id, "Profile exists:", !!profile)

  if (!profile) {
    console.log("[AuthCheck - Sign In] Profile doesn't exist for user:", data.user.id, "Signing out and blocking access.")
    await supabase.auth.signOut()
    return {
      success: false,
      error: "No account found for this email — please sign up first",
      noAccountFound: true,
    }
  }

  const user = mapToAuthUser(data.user, profile)

  if (input.rememberMe) {
    writeRememberToken({
      email: user.email,
      userId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
    })
  } else {
    clearRememberToken()
  }

  return { success: true, user }
}

export async function performSignUp(
  input: SignUpInput
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  isSigningUpInProcess = true

  try {
    const trimmedUsn = input.usn.trim().toUpperCase()
    const trimmedPhone = input.phone.trim()
    const trimmedEmail = input.email.trim()
    const fullName = `${input.firstName.trim()} ${input.lastName.trim()}`.trim()

    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password: input.password,
    })

    if (error) return { success: false, error: error.message }
    if (!data.user) return { success: false, error: "Sign up failed" }

    console.log("[SignUp] Right before inserting profile row for user:", data.user.id, "email:", trimmedEmail)

    const { error: profileError } = await supabase.from("profiles").insert({
      id: data.user.id,
      email: trimmedEmail,
      usn: trimmedUsn,
      phone_number: trimmedPhone,
      full_name: fullName,
      status: "pending",
    })

    if (profileError) {
      console.error("[SignUp] Profile insert failed for user:", data.user.id, "error:", profileError.message)
      return { success: false, error: profileError.message }
    }

    console.log("[SignUp] Profile row successfully inserted for user:", data.user.id)

    const createdProfile = {
      id: data.user.id,
      email: trimmedEmail,
      usn: trimmedUsn,
      phone_number: trimmedPhone,
      full_name: fullName,
      status: "pending" as const,
      is_admin: false,
    }

    const user = mapToAuthUser(data.user, createdProfile)
    return { success: true, user }
  } finally {
    isSigningUpInProcess = false
  }
}

export async function performGoogleSignIn(): Promise<{ success: boolean; error?: string }> {
  const redirectTo = `${window.location.origin}/auth/callback`

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  })

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function performLogout(): Promise<void> {
  if (typeof window !== "undefined") {
    localStorage.removeItem("sync_remember_me_active")
  }
  await supabase.auth.signOut()
  clearRememberToken()
}

export async function updateUserPhone(userId: string, phone: string): Promise<void> {
  const trimmedPhone = phone.trim()
  const { error } = await supabase
    .from("profiles")
    .update({ phone_number: trimmedPhone })
    .eq("id", userId)

  if (error) throw error
}

export async function handleAuthCallback(): Promise<{
  user: AuthUser | null
  error?: string
  noAccountFound?: boolean
}> {
  const params = new URLSearchParams(window.location.search)
  const code = params.get("code")

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) return { user: null, error: error.message }
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError) return { user: null, error: sessionError.message }
  if (!session?.user) return { user: null, error: "No active session" }

  const profile = await fetchProfile(session.user.id, session.user.email)
  console.log("[AuthCheck - OAuth Callback] Profile check ran for user:", session.user.id, "Profile exists:", !!profile)

  if (!profile) {
    console.log("[AuthCheck - OAuth Callback] Profile doesn't exist for user:", session.user.id, "Signing out and blocking access.")
    await supabase.auth.signOut()
    return {
      user: null,
      error: "No account found for this email — please sign up first",
      noAccountFound: true,
    }
  }

  const user = mapToAuthUser(session.user, profile)
  return { user }
}
