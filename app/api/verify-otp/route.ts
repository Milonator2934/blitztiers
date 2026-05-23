import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const { email, code } = await req.json()

  const { data, error } = await supabase
    .from("email_verifications")
    .select("*")
    .eq("email", email)
    .eq("code", code)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 })
  }

  if (new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ error: "Code expired" }, { status: 400 })
  }

  return NextResponse.json({
    success: true,
    userId: data.user_id,
  })
}