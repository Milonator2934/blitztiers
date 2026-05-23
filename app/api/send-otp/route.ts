import { NextResponse } from "next/server"
import { Resend } from "resend"
import { createClient } from "@supabase/supabase-js"

const resend = new Resend(process.env.RESEND_API_KEY!)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req: Request) {
  const { email, userId } = await req.json()

  const code = generateCode()

  const expires = new Date()
  expires.setMinutes(expires.getMinutes() + 10)

  await supabase.from("email_verifications").insert({
    user_id: userId,
    code,
    expires_at: expires.toISOString()
  })

  await resend.emails.send({
    from: "BlitzTiers <noreply@yourdomain.com>",
    to: email,
    subject: "Your BlitzTiers Verification Code",
    html: `<h1>Your code is: ${code}</h1>`
  })

  return NextResponse.json({ success: true })
}