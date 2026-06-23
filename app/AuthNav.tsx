'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { RegionSelector } from '@/app/RegionSelector'
import { supabase } from '@/lib/supabase'

type Profile = {
  username: string
  is_admin?: boolean | null
}

function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let ignore = false

    async function loadProfile() {
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData.session?.user
      const userId = user?.id

      if (!userId) {
        if (!ignore) {
          setProfile(null)
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
        setProfile(data || user.user_metadata?.username ? {
          username: data?.username || user.user_metadata.username,
          is_admin: data?.is_admin,
        } : null)
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

  return { loaded, profile }
}

export function AdminLink({ className = '' }: { className?: string }) {
  const { profile } = useProfile()
  const isAdmin = profile?.username === 'IGNORANCE' || profile?.is_admin === true

  if (!isAdmin) {
    return null
  }

  return (
    <Link
      href="/admin"
      className={`rounded bg-blue-600 px-3 py-1.5 text-sm font-bold text-white hover:bg-blue-500 ${className}`}
    >
      Admin
    </Link>
  )
}

export function AuthNav() {
  const { loaded, profile } = useProfile()
  const [regionQuery, setRegionQuery] = useState('')

  useEffect(() => {
    function syncRegionQuery() {
      const region = new URLSearchParams(window.location.search).get('region')
      setRegionQuery(region === 'NA' || region === 'EU' ? `?region=${region}` : '')
    }

    syncRegionQuery()
    window.addEventListener('popstate', syncRegionQuery)

    return () => window.removeEventListener('popstate', syncRegionQuery)
  }, [])

  return (
    <div className="flex flex-col items-center gap-3 lg:flex-row lg:justify-end">
      <RegionSelector />

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-zinc-300 sm:gap-x-6 sm:text-base lg:justify-end">
        <Link href={`/overall${regionQuery}`} className="hover:text-white">Overall</Link>
        <Link href={`/accuracy${regionQuery}`} className="hover:text-white">Accuracy</Link>
        <Link href={`/power${regionQuery}`} className="hover:text-white">Power</Link>
        <Link href={`/passing${regionQuery}`} className="hover:text-white">Passing</Link>
        <Link href={`/goalkeeping${regionQuery}`} className="hover:text-white">Goalkeeping</Link>
        <Link href={`/dribbling${regionQuery}`} className="hover:text-white">Dribbling</Link>
        <Link href={`/defending${regionQuery}`} className="hover:text-white">Defending</Link>
        <Link href="/get-ranked" className="font-bold text-blue-300 hover:text-blue-200">Get Ranked</Link>
        <Link href="/info" className="hover:text-white">Info</Link>
        <Link href="/login" className="font-bold text-white hover:text-blue-300">
          {loaded && profile?.username ? profile.username : 'Login'}
        </Link>
      </div>
    </div>
  )
}
