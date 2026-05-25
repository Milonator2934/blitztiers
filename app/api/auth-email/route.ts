import { createClient } from '@supabase/supabase-js'
import { cleanUsername, usernameToAuthEmail, validateUsername } from '@/lib/usernameAuth'

export async function POST(req: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return Response.json(
      { error: 'Login is not configured.' },
      { status: 500 }
    )
  }

  const { username } = await req.json()
  const cleanName = cleanUsername(typeof username === 'string' ? username : '')
  const usernameError = validateUsername(cleanName)

  if (usernameError) {
    return Response.json({ error: usernameError }, { status: 400 })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .ilike('username', cleanName)
    .maybeSingle()

  if (profileError) {
    return Response.json({ error: profileError.message }, { status: 500 })
  }

  if (!profile) {
    return Response.json({ email: usernameToAuthEmail(cleanName) })
  }

  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(profile.id)

  if (userError || !userData.user?.email) {
    return Response.json(
      { error: 'Could not find that username.' },
      { status: 404 }
    )
  }

  return Response.json({ email: userData.user.email })
}
