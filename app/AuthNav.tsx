'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Profile = {
  username: string
  is_admin?: boolean | null
}

export function AuthNav() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let ignore = false

    async function loadProfile() {
      const { data: sessionData } = await supabase.auth.getSession()
      const userId = sessionData.session?.user.id

      if (!userId) {
        if (!ignore) {
          setLoaded(true)
        }
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('username, is_admin')
        .eq('id', userId)
        .maybeSingle()

      if (!ignore) {
        setProfile(data || null)
        setLoaded(true)
      }
    }

    loadProfile()

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      loadProfile()
    })

    return () => {
      ignore = true
      authListener.subscription.unsubscribe()
    }
  }, [])

  const isAdmin = profile?.username === 'IGNORANCE' || profile?.is_admin === true

  return (
    <div className="flex items-center gap-6 text-zinc-300">
      <Link href="/overall" className="hover:text-white">Overall</Link>
      <Link href="/accuracy" className="hover:text-white">Accuracy</Link>
      <Link href="/power" className="hover:text-white">Power</Link>
      <Link href="/passing" className="hover:text-white">Passing</Link>
      <Link href="/goalkeeping" className="hover:text-white">Goalkeeping</Link>
      {isAdmin && <Link href="/admin" className="font-bold text-blue-400 hover:text-blue-300">Admin</Link>}
      <Link href="/login" className="font-bold text-white hover:text-blue-300">
        {loaded && profile?.username ? profile.username : 'Login'}
      </Link>
    </div>
  )
}
