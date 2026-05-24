'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Send, UserCheck } from 'lucide-react'
import { AdminLink, AuthNav } from '@/app/AuthNav'
import { categories, type CategoryKey } from '@/lib/categories'
import { supabase } from '@/lib/supabase'

type Profile = {
  id: string
  username: string
  is_admin?: boolean | null
}

type CodeType = 'calibration' | 'clubhouse' | 'golf club' | 'freerunners' | 'girls who drift'

const codeTypes: CodeType[] = [
  'calibration',
  'clubhouse',
  'golf club',
  'freerunners',
  'girls who drift',
]

export default function GetRankedPage() {
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null)
  const [admins, setAdmins] = useState<Profile[]>([])
  const [categoryKey, setCategoryKey] = useState<CategoryKey>('accuracy')
  const [codeType, setCodeType] = useState<CodeType>('calibration')
  const [codeNumber, setCodeNumber] = useState('1')
  const [requestedAdminId, setRequestedAdminId] = useState('')
  const [checkingSession, setCheckingSession] = useState(true)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const selectedCategory = useMemo(
    () => categories.find((category) => category.key === categoryKey) || categories[0],
    [categoryKey]
  )

  useEffect(() => {
    let ignore = false

    async function loadPageData() {
      const { data: sessionData } = await supabase.auth.getSession()
      const userId = sessionData.session?.user.id

      if (!userId) {
        if (!ignore) {
          setCheckingSession(false)
        }
        return
      }

      const [{ data: profile }, { data: profiles }] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, username, is_admin')
          .eq('id', userId)
          .maybeSingle(),
        supabase
          .from('profiles')
          .select('id, username, is_admin')
          .order('username', { ascending: true }),
      ])

      if (!ignore) {
        setCurrentProfile(profile || null)
        setAdmins(
          (profiles || []).filter(
            (player) => player.username === 'IGNORANCE' || player.is_admin === true
          )
        )
        setCheckingSession(false)
      }
    }

    loadPageData()

    return () => {
      ignore = true
    }
  }, [])

  async function requestModeration() {
    setError('')
    setMessage('')

    const numericCodeNumber = Number(codeNumber)

    if (!currentProfile) {
      setError('Log in before requesting a moderation.')
      return
    }

    if (!Number.isInteger(numericCodeNumber) || numericCodeNumber < 1 || numericCodeNumber > 24) {
      setError('Choose a code number from 1 to 24.')
      return
    }

    setLoading(true)
    const { error: requestError } = await supabase.from('moderation_requests').insert({
      requester_id: currentProfile.id,
      category: categoryKey,
      code_type: codeType,
      code_number: numericCodeNumber,
      requested_admin_id: requestedAdminId || null,
      status: 'pending',
    })
    setLoading(false)

    if (requestError) {
      setError(requestError.message)
      return
    }

    setMessage(
      `Request sent for ${selectedCategory.shortLabel}, ${codeType} code ${numericCodeNumber}.`
    )
    setRequestedAdminId('')
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <nav className="border-b border-zinc-800 p-4 sm:p-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/" className="text-2xl font-bold text-blue-500 sm:text-3xl">
              BlitzTiers
            </Link>
            <AdminLink />
          </div>

          <AuthNav />
        </div>
      </nav>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-sm font-bold uppercase text-blue-300">Get Ranked</p>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl md:text-5xl">
            Request a moderation
          </h1>
          <p className="mt-4 max-w-xl text-zinc-400">
            Pick the category and code details you want moderated. You can leave the admin
            choice open or request a specific admin from the BlitzTiers team.
          </p>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
          {checkingSession ? (
            <p className="text-zinc-400">Checking your login...</p>
          ) : !currentProfile ? (
            <div className="space-y-4">
              <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-amber-100">
                You need to log in before requesting a moderation.
              </p>
              <Link
                href="/login"
                className="inline-flex rounded bg-blue-600 px-5 py-3 font-bold hover:bg-blue-500"
              >
                Login
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-lg bg-zinc-900 p-3 text-sm text-zinc-300">
                Requesting as <span className="font-bold text-white">{currentProfile.username}</span>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-zinc-300">Category</span>
                <select
                  className="w-full rounded bg-zinc-900 p-3 outline-none ring-1 ring-zinc-800 focus:ring-blue-500"
                  value={categoryKey}
                  onChange={(event) => setCategoryKey(event.target.value as CategoryKey)}
                >
                  {categories.map((category) => (
                    <option key={category.key} value={category.key}>
                      {category.shortLabel}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-zinc-300">Code type</span>
                <select
                  className="w-full rounded bg-zinc-900 p-3 capitalize outline-none ring-1 ring-zinc-800 focus:ring-blue-500"
                  value={codeType}
                  onChange={(event) => setCodeType(event.target.value as CodeType)}
                >
                  {codeTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-zinc-300">Code number</span>
                <input
                  type="number"
                  min={1}
                  max={24}
                  className="w-full rounded bg-zinc-900 p-3 outline-none ring-1 ring-zinc-800 focus:ring-blue-500"
                  value={codeNumber}
                  onChange={(event) => setCodeNumber(event.target.value)}
                />
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-bold text-zinc-300">
                  <UserCheck size={16} /> Moderating admin optional
                </span>
                <select
                  className="w-full rounded bg-zinc-900 p-3 outline-none ring-1 ring-zinc-800 focus:ring-blue-500"
                  value={requestedAdminId}
                  onChange={(event) => setRequestedAdminId(event.target.value)}
                >
                  <option value="">Any admin</option>
                  {admins.map((admin) => (
                    <option key={admin.id} value={admin.id}>
                      {admin.username}
                    </option>
                  ))}
                </select>
              </label>

              {message && (
                <p className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-green-200">
                  {message}
                </p>
              )}

              {error && (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-200">
                  {error}
                </p>
              )}

              <button
                onClick={requestModeration}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded bg-blue-600 p-3 font-bold hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send size={18} /> {loading ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
