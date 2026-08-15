const REMEMBER_KEY = "sync_remember_token"
const REMEMBER_DAYS = 30

export interface RememberToken {
  token: string
  email: string
  userId: string
  firstName: string
  lastName: string
  expiresAt: number
}

function generateToken(): string {
  return `rm_${Date.now()}_${Math.random().toString(36).slice(2, 16)}`
}

export function readRememberToken(): RememberToken | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(REMEMBER_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as RememberToken
    if (data.expiresAt < Date.now()) {
      localStorage.removeItem(REMEMBER_KEY)
      return null
    }
    return data
  } catch {
    return null
  }
}

export function writeRememberToken(data: Omit<RememberToken, "token" | "expiresAt">): RememberToken {
  const token: RememberToken = {
    ...data,
    token: generateToken(),
    expiresAt: Date.now() + REMEMBER_DAYS * 24 * 60 * 60 * 1000,
  }
  localStorage.setItem(REMEMBER_KEY, JSON.stringify(token))
  return token
}

export function clearRememberToken(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(REMEMBER_KEY)
}

export function getRememberedEmail(): string | null {
  return readRememberToken()?.email ?? null
}
