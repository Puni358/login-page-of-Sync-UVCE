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

async function cleanupOrphanAuthUser(userId: string): Promise<void> {
  try {
    console.log("[AuthCheck] Deleting orphaned auth user via API route:", userId)
    await fetch("/api/auth/cleanup-orphan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    })
  } catch (err) {
    console.error("[AuthCheck] Failed to request orphan user cleanup:", err)
  }
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
    console.log("[AuthCheck - getSession] Profile doesn't exist for session user:", session.user.id, "Cleaning up orphan user & signing out.")
    await cleanupOrphanAuthUser(session.user.id)
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
    console.log("[AuthCheck - Sign In] Profile doesn't exist for user:", data.user.id, "Cleaning up orphan user & signing out.")
    await cleanupOrphanAuthUser(data.user.id)
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

/**
 * Inserts a profile row for a newly created auth user and returns the AuthUser.
 * Extracted as a shared helper used by both the normal signup flow and the retry path.
 */
async function finishSignUpProfile(
  userId: string,
  info: { trimmedEmail: string; trimmedUsn: string; trimmedPhone: string; fullName: string }
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  const { trimmedEmail, trimmedUsn, trimmedPhone, fullName } = info

  console.log("[SignUp] Right before inserting profile row for user:", userId, "email:", trimmedEmail)

  const { error: profileError } = await supabase.from("profiles").insert({
    id: userId,
    email: trimmedEmail,
    usn: trimmedUsn,
    phone_number: trimmedPhone,
    full_name: fullName,
    status: "pending",
  })

  if (profileError) {
    console.error("[SignUp] Profile insert failed for user:", userId, "error:", profileError.message)
    return { success: false, error: profileError.message }
  }

  console.log("[SignUp] Profile row successfully inserted for user:", userId)

  // Build a minimal Supabase User-like object so mapToAuthUser works without a live session re-fetch
  const fakeSupabaseUser = { id: userId, email: trimmedEmail, user_metadata: { full_name: fullName } } as any

  const createdProfile = {
    id: userId,
    email: trimmedEmail,
    usn: trimmedUsn,
    phone_number: trimmedPhone,
    full_name: fullName,
    status: "pending" as const,
    is_admin: false,
  }

  const user = mapToAuthUser(fakeSupabaseUser, createdProfile)
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
    const profileInfo = { trimmedEmail, trimmedUsn, trimmedPhone, fullName }

    // Step 1: Attempt to clean up any orphaned auth user with this email first.
    // This works when SUPABASE_SERVICE_ROLE_KEY is configured in the server environment.
    try {
      await fetch("/api/auth/cleanup-orphan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      })
    } catch (e) {
      console.warn("[SignUp] Error during prior orphan cleanup by email:", e)
    }

    // Step 2: Attempt fresh signup
    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password: input.password,
    })

    // Step 3: Handle "User already registered" — this happens when a prior Google login
    // created an orphaned auth user that the cleanup above couldn't remove (e.g. service key missing).
    if (
      error?.message?.toLowerCase().includes("user already registered") ||
      error?.message?.toLowerCase().includes("already registered")
    ) {
      console.log("[SignUp] Got 'User already registered' for:", trimmedEmail, "— checking if orphaned auth user")

      // Try signing in with the user-supplied password to check if this is a password-based orphan
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: input.password,
      })

      if (!signInError && signInData?.user) {
        // Signed in successfully — check whether a profiles row already exists
        const existingProfile = await fetchProfile(signInData.user.id, signInData.user.email)

        if (existingProfile) {
          // A real, complete account exists — sign back out and tell the user
          await supabase.auth.signOut()
          return {
            success: false,
            error: "An account with this email already exists. Please log in instead.",
          }
        }

        // No profile row → it is a genuine orphan with a matching password. Clean it up now.
        console.log("[SignUp] Orphaned auth user confirmed (password match) for:", trimmedEmail, "userId:", signInData.user.id)
        try {
          await fetch("/api/auth/cleanup-orphan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: signInData.user.id }),
          })
        } catch (e) {
          console.warn("[SignUp] Orphan cleanup failed:", e)
        }
        await supabase.auth.signOut()

        // Retry signup
        const { data: retryData, error: retryError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password: input.password,
        })
        if (retryError) return { success: false, error: retryError.message }
        if (!retryData.user) return { success: false, error: "Sign up failed after cleanup. Please try again." }

        return await finishSignUpProfile(retryData.user.id, profileInfo)
      } else {
        // Sign-in with the provided password failed → the orphan was created via Google OAuth
        // (no password) and cannot be removed without the service role key.
        // Give the user a clear, actionable message.
        console.warn("[SignUp] Orphan from Google OAuth detected for:", trimmedEmail, "— service role key required to remove it.")
        return {
          success: false,
          error: "This email was previously used with Google. Please use 'Continue with Google' to sign in instead.",
        }
      }
    }

    if (error) return { success: false, error: error.message }
    if (!data.user) return { success: false, error: "Sign up failed" }

    return await finishSignUpProfile(data.user.id, profileInfo)
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
    console.log("[AuthCheck - OAuth Callback] Profile doesn't exist for user:", session.user.id, "Cleaning up orphan user & signing out.")
    await cleanupOrphanAuthUser(session.user.id)
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
