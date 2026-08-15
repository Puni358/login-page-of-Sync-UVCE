import { supabase } from "@/lib/supabaseClient"
import type { AuthUser, LoginInput, SignUpInput } from "./types"
import { mapToAuthUser, resolveAuthUser } from "./profile-service"
import {
  clearRememberToken,
  writeRememberToken,
} from "./remember-me"

export async function getSessionAuthUser(): Promise<AuthUser | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) return null
  return resolveAuthUser(session.user)
}

export async function performLogin(
  input: LoginInput
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email.trim(),
    password: input.password,
  })

  if (error) return { success: false, error: error.message }
  if (!data.user) return { success: false, error: "Login failed" }

  const user = await resolveAuthUser(data.user)

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

  const { error: profileError } = await supabase.from("profiles").insert({
    id: data.user.id,
    email: trimmedEmail,
    usn: trimmedUsn,
    phone_number: trimmedPhone,
    full_name: fullName,
    status: "pending",
  })

  if (profileError) {
    return { success: false, error: profileError.message }
  }

  if (!data.session) {
    return {
      success: true,
      user: mapToAuthUser(data.user, {
        id: data.user.id,
        email: trimmedEmail,
        usn: trimmedUsn,
        phone_number: trimmedPhone,
        full_name: fullName,
        status: "pending",
        is_admin: false,
      }),
    }
  }

  const user = await resolveAuthUser(data.user)
  return { success: true, user }
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

  const user = await resolveAuthUser(session.user)
  return { user }
}
