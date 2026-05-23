import { NextResponse } from "next/server"
import { Resend } from "resend"
import { createClient } from "@supabase/supabase-js"

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req: Request) {
  const resendApiKey = process.env.RESEND_API_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!resendApiKey || !supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Email verification is not configured." },
      { status: 500 }
    )
  }

  const resend = new Resend(resendApiKey)
  const supabase = createClient(supabaseUrl, serviceRoleKey)
  const { email } = await req.json()
  const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : ""

  if (!cleanEmail) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 })
  }

  const code = generateCode()

  const expires = new Date()
  expires.setMinutes(expires.getMinutes() + 10)

  const { error: insertError } = await supabase.from("email_verifications").insert({
    email: cleanEmail,
    code,
    expires_at: expires.toISOString(),
  })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  const { error: sendError } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "BlitzTiers <noreply@yourdomain.com>",
    to: cleanEmail,
    subject: "Your BlitzTiers Code",
    html: `
      <h2>Your verification code</h2>
      <h1 style="font-size:32px;letter-spacing:8px">${code}</h1>
      <p>Expires in 10 minutes</p>
    `,
  })

  if (sendError) {
    return NextResponse.json({ error: sendError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
