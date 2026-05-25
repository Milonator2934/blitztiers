import { createClient } from '@supabase/supabase-js'
import { cleanUsername, usernameToAuthEmail, validateUsername } from '@/lib/usernameAuth'

export async function POST(req: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return Response.json(
      { error: 'Account creation is not configured.' },
      { status: 500 }
    )
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)
  const { username, password } = await req.json()
  const cleanName = cleanUsername(typeof username === 'string' ? username : '')
  const usernameError = validateUsername(cleanName)

  if (usernameError) {
    return Response.json({ error: usernameError }, { status: 400 })
  }

  if (typeof password !== 'string' || password.length < 6) {
    return Response.json(
      { error: 'Passwords must be at least 6 characters long.' },
      { status: 400 }
    )
  }

  const { data: existingProfile, error: existingProfileError } = await supabase
    .from('profiles')
    .select('id')
    .ilike('username', cleanName)
    .maybeSingle()

  if (existingProfileError) {
    return Response.json({ error: existingProfileError.message }, { status: 500 })
  }

  if (existingProfile) {
    return Response.json({ error: 'That username is already taken.' }, { status: 409 })
  }

  const authEmail = usernameToAuthEmail(cleanName)
  const { data: userData, error: createError } = await supabase.auth.admin.createUser({
    email: authEmail,
    password,
    email_confirm: true,
    user_metadata: { username: cleanName },
  })

  if (createError || !userData.user) {
    const duplicate = createError?.message.toLowerCase().includes('already')
    return Response.json(
      { error: duplicate ? 'That username is already taken.' : createError?.message || 'Could not create account.' },
      { status: duplicate ? 409 : 400 }
    )
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .insert({ id: userData.user.id, username: cleanName })

  if (profileError) {
    await supabase.auth.admin.deleteUser(userData.user.id)

    return Response.json(
      { error: profileError.code === '23505' ? 'That username is already taken.' : profileError.message },
      { status: profileError.code === '23505' ? 409 : 500 }
    )
  }

  return Response.json({ success: true })
}
