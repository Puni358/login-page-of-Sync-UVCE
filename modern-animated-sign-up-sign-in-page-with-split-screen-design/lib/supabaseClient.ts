import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const customStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === "undefined") return null
    return sessionStorage.getItem(key) ?? localStorage.getItem(key)
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === "undefined") return
    const isRemember = localStorage.getItem("sync_remember_me_active") === "true"
    if (isRemember) {
      localStorage.setItem(key, value)
      sessionStorage.removeItem(key)
    } else {
      sessionStorage.setItem(key, value)
      localStorage.removeItem(key)
    }
  },
  removeItem: (key: string): void => {
    if (typeof window === "undefined") return
    localStorage.removeItem(key)
    sessionStorage.removeItem(key)
  },
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

