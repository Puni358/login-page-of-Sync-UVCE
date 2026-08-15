import type { AuthUser, LoginInput, SignUpInput } from "./types"
import {
  clearRememberToken,
  readRememberToken,
  writeRememberToken,
} from "./remember-me"

const AUTH_STORAGE_KEY = "nova_auth_session"

function readSession(): AuthUser | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

function writeSession(user: AuthUser | null): void {
  if (typeof window === "undefined") return
  if (user) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY)
  }
}

function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function restoreFromRemember(): AuthUser | null {
  const remember = readRememberToken()
  if (!remember) return null
  return {
    id: remember.userId,
    firstName: remember.firstName,
    lastName: remember.lastName,
    email: remember.email,
  }
}

export function getInitialAuthUser(): AuthUser | null {
  return readSession() ?? restoreFromRemember()
}

export async function performLogin(
  input: LoginInput
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  await new Promise((r) => setTimeout(r, 400))

  const existing = readSession()
  let user: AuthUser

  if (existing && existing.email.toLowerCase() === input.email.toLowerCase()) {
    user = existing
  } else {
    const remembered = readRememberToken()
    if (remembered && remembered.email.toLowerCase() === input.email.toLowerCase()) {
      user = {
        id: remembered.userId,
        firstName: remembered.firstName,
        lastName: remembered.lastName,
        email: remembered.email,
      }
    } else {
      user = {
        id: generateUserId(),
        firstName: "Student",
        lastName: "User",
        email: input.email.trim(),
      }
    }
  }

  writeSession(user)

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
  await new Promise((r) => setTimeout(r, 600))

  const newUser: AuthUser = {
    id: generateUserId(),
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email: input.email.trim(),
  }
  writeSession(newUser)
  return { success: true, user: newUser }
}

export function performLogout(): void {
  writeSession(null)
  clearRememberToken()
}
