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
  const { email, userId } = await req.json()

  const code = generateCode()

  const expires = new Date()
  expires.setMinutes(expires.getMinutes() + 10)

  await supabase.from("email_verifications").insert({
    email,
    user_id: userId,
    code,
    expires_at: expires.toISOString(),
  })

  await resend.emails.send({
    from: "BlitzTiers <noreply@yourdomain.com>",
    to: email,
    subject: "Your BlitzTiers Code",
    html: `
      <h2>Your verification code</h2>
      <h1 style="font-size:32px;letter-spacing:8px">${code}</h1>
      <p>Expires in 10 minutes</p>
    `,
  })

  return NextResponse.json({ success: true })
}
