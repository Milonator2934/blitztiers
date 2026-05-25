'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Eye, EyeOff, KeyRound, LogIn, User } from 'lucide-react'
import { AdminLink } from '@/app/AuthNav'
import { BrandLogo } from '@/app/BrandLogo'
import { supabase } from '@/lib/supabase'
import { cleanUsername, validateUsername } from '@/lib/usernameAuth'

const trustedDeviceKey = (userId: string) => `blitztiers-trusted-device-${userId}`

async function getDeviceFingerprint() {
  const response = await fetch('/api/client-fingerprint', { cache: 'no-store' })
  const { ip, userAgent } = await response.json()
  const rawFingerprint = `${ip}|${userAgent}|${navigator.platform}|${screen.width}x${screen.height}`

  if (!crypto.subtle) {
    return btoa(rawFingerprint)
  }

  const bytes = new TextEncoder().encode(rawFingerprint)
  const hash = await crypto.subtle.digest('SHA-256', bytes)

  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

async function rememberTrustedDevice(userId: string) {
  const fingerprint = await getDeviceFingerprint()
  localStorage.setItem(trustedDeviceKey(userId), fingerprint)
}

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmedUsernameWarning, setConfirmedUsernameWarning] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loggedInUsername, setLoggedInUsername] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false

    supabase.auth.getSession().then(async ({ data }) => {
      const session = data.session

      if (!session?.user || ignore) {
        return
      }

      const currentFingerprint = await getDeviceFingerprint()
      const storedFingerprint = localStorage.getItem(trustedDeviceKey(session.user.id))

      if (ignore) {
        return
      }

      if (storedFingerprint && storedFingerprint !== currentFingerprint) {
        await supabase.auth.signOut()
        if (!ignore) {
          setError('This saved login was not from the trusted device/IP for this account. Please log in again.')
        }
        return
      }

      if (!storedFingerprint) {
        localStorage.setItem(trustedDeviceKey(session.user.id), currentFingerprint)
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', session.user.id)
        .maybeSingle()

      setLoggedInUsername(profile?.username || session.user.user_metadata?.username || 'your account')
      setMessage('You are already logged in on this trusted device.')
    })

    return () => {
      ignore = true
    }
  }, [])

  function validateCredentials() {
    const cleanName = cleanUsername(username)
    const usernameError = validateUsername(cleanName)

    if (usernameError) {
      setError(usernameError)
      return null
    }

    if (!password) {
      setError('Enter your password.')
      return null
    }

    return cleanName
  }

  async function getAuthEmail(cleanName: string) {
    const response = await fetch('/api/auth-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: cleanName }),
    })
    const result = await response.json()

    if (!response.ok || typeof result.email !== 'string') {
      throw new Error(result.error || 'Could not find that username.')
    }

    return result.email
  }

  async function createAccount() {
    setError('')
    setMessage('')

    const cleanName = validateCredentials()

    if (!cleanName) {
      return
    }

    if (!confirmedUsernameWarning) {
      setError('Confirm that you understand how your username appears on the leaderboard.')
      return
    }

    const sure = window.confirm(
      `"${cleanName}" will represent you on public leaderboards. Are you sure you want this username?`
    )

    if (!sure) {
      return
    }

    setLoading(true)
    const response = await fetch('/api/create-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: cleanName, password }),
    })
    const result = await response.json()

    if (!response.ok) {
      setLoading(false)
      setError(result.error || 'Could not create account.')
      return
    }

    let authEmail = ''

    try {
      authEmail = await getAuthEmail(cleanName)
    } catch (authEmailError) {
      setLoading(false)
      setError(authEmailError instanceof Error ? authEmailError.message : 'Could not log in to the new account.')
      return
    }

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password,
    })
    setLoading(false)

    if (signInError) {
      setError(`Account created, but login failed: ${signInError.message}`)
      return
    }

    if (data.user) {
      await rememberTrustedDevice(data.user.id)
      setLoggedInUsername(cleanName)
      setMessage('Account created. You are logged in on this trusted device.')
      router.replace('/')
      router.refresh()
    }
  }

  async function signIn() {
    setError('')
    setMessage('')

    const cleanName = validateCredentials()

    if (!cleanName) {
      return
    }

    setLoading(true)
    let authEmail = ''

    try {
      authEmail = await getAuthEmail(cleanName)
    } catch (authEmailError) {
      setLoading(false)
      setError(authEmailError instanceof Error ? authEmailError.message : 'Could not find that username.')
      return
    }

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password,
    })
    setLoading(false)

    if (signInError) {
      setError('Username or password is incorrect.')
      return
    }

    if (data.user) {
      await rememberTrustedDevice(data.user.id)
      setLoggedInUsername(cleanName)
      setMessage('Logged in. This device/IP is now remembered.')
      router.replace('/')
      router.refresh()
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setLoggedInUsername(null)
    setMessage('Logged out.')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4 py-6 text-white sm:py-10">
      <div className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-950 p-5 shadow-2xl shadow-blue-950/20 sm:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <BrandLogo compact />
          <AdminLink />
        </div>
        <h1 className="mt-3 text-2xl font-black sm:text-3xl">Login or Create Account</h1>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-bold text-zinc-300">
              <User size={16} /> Username
            </span>
            <input
              className="w-full rounded bg-zinc-900 p-3 outline-none ring-1 ring-zinc-800 focus:ring-blue-500"
              placeholder="Leaderboard username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </label>

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-bold text-zinc-300">
              <KeyRound size={16} /> Password
            </span>
            <div className="flex rounded bg-zinc-900 ring-1 ring-zinc-800 focus-within:ring-blue-500">
              <input
                type={showPassword ? 'text' : 'password'}
                className="min-w-0 flex-1 rounded bg-transparent p-3 outline-none"
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="flex w-12 items-center justify-center text-zinc-300 hover:text-white"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <label className="flex items-start gap-3 rounded-lg bg-zinc-900 p-3 text-sm text-zinc-300">
            <input
              type="checkbox"
              className="mt-1"
              checked={confirmedUsernameWarning}
              onChange={(event) => setConfirmedUsernameWarning(event.target.checked)}
            />
            <span>I understand this username will represent me on the leaderboard.</span>
          </label>

          {message && (
            <p className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-200">
              {message}
            </p>
          )}

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </p>
          )}

          {loggedInUsername && (
            <div className="rounded-lg bg-zinc-900 p-3 text-sm text-zinc-300">
              Signed in as <span className="font-bold text-white">{loggedInUsername}</span>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <button
              onClick={signIn}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded bg-blue-600 p-3 font-bold hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogIn size={18} /> Login
            </button>

            <button
              onClick={createAccount}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded bg-green-600 p-3 font-bold hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCircle2 size={18} /> Create Account
            </button>

            {loggedInUsername && (
              <button
                onClick={signOut}
                className="w-full rounded bg-zinc-800 p-3 font-bold hover:bg-zinc-700"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
