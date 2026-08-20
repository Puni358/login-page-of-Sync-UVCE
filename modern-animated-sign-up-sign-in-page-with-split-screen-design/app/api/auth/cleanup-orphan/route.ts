import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
console.log("Service key present:", !!process.env.SUPABASE_SERVICE_ROLE_KEY)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, email } = body

    if (!userId && !email) {
      return NextResponse.json({ error: "Missing userId or email" }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Supabase configuration missing" }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    let targetUserId = userId

    if (email && typeof email === "string") {
      const trimmedEmail = email.trim().toLowerCase()
      // Safety check: ensure user has no matching profiles row before deleting
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("email", trimmedEmail)
        .maybeSingle()

      if (profile) {
        return NextResponse.json(
          { error: "Refusing to delete: user profile exists" },
          { status: 400 }
        )
      }

      // List users to find the auth user id by email
      const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
        perPage: 1000,
      })

      if (listError) {
        console.error("[Cleanup Orphan API] Error listing users:", listError)
        return NextResponse.json({ error: listError.message }, { status: 500 })
      }

      const foundUser = usersData?.users?.find(
        (u) => u.email?.toLowerCase() === trimmedEmail
      )

      if (!foundUser) {
        return NextResponse.json({ success: true, message: "No orphaned auth user found for this email" })
      }

      targetUserId = foundUser.id
    } else {
      // Safety check: ensure user has no matching profiles row before deleting
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("id", targetUserId)
        .maybeSingle()

      if (profile) {
        return NextResponse.json(
          { error: "Refusing to delete: user profile exists" },
          { status: 400 }
        )
      }
    }

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId)

    if (deleteError) {
      console.error("[Cleanup Orphan API] Error deleting user:", deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    console.log("[Cleanup Orphan API] Successfully deleted orphaned auth user:", targetUserId)
    return NextResponse.json({ success: true, deletedUserId: targetUserId })
  } catch (err: any) {
    console.error("[Cleanup Orphan API] Unexpected error:", err)
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    )
  }
}
