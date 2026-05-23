import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const { userId, code } = await req.json()

  const { data } = await supabase
    .from("email_verifications")
    .select("*")
    .eq("user_id", userId)
    .eq("code", code)
    .single()

  if (!data) {
    return NextResponse.json({ success: false })
  }

  const now = new Date()
  if (new Date(data.expires_at) < now) {
    return NextResponse.json({ success: false, reason: "expired" })
  }

  await supabase.auth.admin.updateUserById(userId, {
    email_confirm: true
  })

  await supabase
    .from("email_verifications")
    .delete()
    .eq("user_id", userId)

  return NextResponse.json({ success: true })
}