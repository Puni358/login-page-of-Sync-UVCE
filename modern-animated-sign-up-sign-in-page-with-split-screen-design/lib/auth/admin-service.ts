import { supabase } from "@/lib/supabaseClient"
import type { ApprovalStatus, Profile } from "./types"

const PROFILE_COLUMNS =
  "id, email, usn, phone_number, full_name, status, is_admin" as const

export async function fetchPendingProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("status", "pending")
    .order("full_name")

  if (error) throw error
  return (data ?? []) as Profile[]
}

export async function updateProfileStatus(
  profileId: string,
  status: Extract<ApprovalStatus, "approved" | "rejected">
): Promise<void> {
  const { error } = await supabase.from("profiles").update({ status }).eq("id", profileId)

  if (error) throw error
}
