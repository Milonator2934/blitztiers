import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Email verification is not configured." },
      { status: 500 }
    )
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)
  const { email, code, password } = await req.json()
  const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : ""
  const cleanCode = typeof code === "string" ? code.replace(/\D/g, "").slice(0, 6) : ""

  if (!cleanEmail || cleanCode.length !== 6 || typeof password !== "string" || !password) {
    return NextResponse.json(
      { error: "Email, password, and a 6 digit code are required." },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from("email_verifications")
    .select("id, expires_at")
    .eq("email", cleanEmail)
    .eq("code", cleanCode)
    .order("expires_at", { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 })
  }

  if (new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ error: "Code expired" }, { status: 400 })
  }

  const { data: userData, error: createError } = await supabase.auth.admin.createUser({
    email: cleanEmail,
    password,
    email_confirm: true,
  })

  if (createError || !userData.user) {
    return NextResponse.json(
      { error: createError?.message || "Could not create account." },
      { status: 400 }
    )
  }

  await supabase.from("email_verifications").delete().eq("id", data.id)

  return NextResponse.json({
    success: true,
    userId: userData.user.id,
  })
}
