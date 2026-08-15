import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabaseClient"
import type { ApprovalStatus, AuthUser, Profile } from "./types"

function parseFullName(fullName: string | null | undefined): {
  firstName: string
  lastName: string
} {
  if (!fullName?.trim()) return { firstName: "", lastName: "" }
  const parts = fullName.trim().split(/\s+/)
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  }
}

export async function fetchProfile(userId: string, email?: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, usn, phone_number, full_name, status, is_admin")
    .eq("id", userId)
    .maybeSingle()

  if (error) throw error
  if (data) return data as Profile

  if (email?.trim()) {
    const { data: emailData, error: emailError } = await supabase
      .from("profiles")
      .select("id, email, usn, phone_number, full_name, status, is_admin")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle()

    if (!emailError && emailData) {
      return emailData as Profile
    }
  }

  return null
}

export function mapToAuthUser(supabaseUser: User, profile: Profile): AuthUser {
  const metadataName =
    typeof supabaseUser.user_metadata?.full_name === "string"
      ? supabaseUser.user_metadata.full_name
      : typeof supabaseUser.user_metadata?.name === "string"
        ? supabaseUser.user_metadata.name
        : null

  const { firstName, lastName } = parseFullName(profile.full_name ?? metadataName)

  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? "",
    firstName,
    lastName,
    usn: profile.usn ?? undefined,
    phone: profile.phone_number ?? undefined,
    approvalStatus: (profile.status as ApprovalStatus | undefined) ?? "pending",
    isAdmin: profile.is_admin === true,
  }
}

export async function resolveAuthUser(supabaseUser: User): Promise<AuthUser | null> {
  const profile = await fetchProfile(supabaseUser.id, supabaseUser.email)
  if (!profile) return null
  return mapToAuthUser(supabaseUser, profile)
}

export async function refreshAuthUser(userId: string): Promise<AuthUser | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user || user.id !== userId) return null
  return resolveAuthUser(user)
}
