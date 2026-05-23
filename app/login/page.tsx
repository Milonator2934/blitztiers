'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Eye, EyeOff, KeyRound, LogIn, Mail, ShieldCheck, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type SignupStep = 'credentials' | 'verify' | 'username' | 'complete'

const otpCodeLength = 8
const trustedDeviceKey = (userId: string) => `blitztiers-trusted-device-${userId}`
const otpCooldownKey = (email: string) => `blitztiers-otp-cooldown-${email.toLowerCase()}`
const otpCooldownSeconds = 60

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
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [username, setUsername] = useState('')
  const [signupStep, setSignupStep] = useState<SignupStep>('credentials')
  const [confirmedUsernameWarning, setConfirmedUsernameWarning] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loggedInEmail, setLoggedInEmail] = useState<string | null>(null)
  const [verifiedUserId, setVerifiedUserId] = useState<string | null>(null)
  const [otpCooldownRemaining, setOtpCooldownRemaining] = useState(0)

  const cleanCode = useMemo(
    () => verificationCode.replace(/\D/g, '').slice(0, otpCodeLength),
    [verificationCode]
  )

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

      setLoggedInEmail(session.user.email || null)
      setMessage('You are already logged in on this trusted device.')
    })

    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    if (!email) {
      return
    }

    const updateCooldown = () => {
      const cooldownUntil = Number(localStorage.getItem(otpCooldownKey(email)) || 0)
      const remaining = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000))
      setOtpCooldownRemaining(remaining)
    }

    updateCooldown()
    const interval = window.setInterval(updateCooldown, 1000)

    return () => window.clearInterval(interval)
  }, [email])

  function startOtpCooldown() {
    const cooldownUntil = Date.now() + otpCooldownSeconds * 1000
    localStorage.setItem(otpCooldownKey(email), String(cooldownUntil))
    setOtpCooldownRemaining(otpCooldownSeconds)
  }

  function showAuthError(message: string) {
    if (message.toLowerCase().includes('rate limit')) {
      setError('Email code limit reached. Please wait a minute before requesting another code.')
      startOtpCooldown()
      return
    }

    setError(message)
  }

  async function signUp() {
    setError('')
    setMessage('')

    if (!email || !password) {
      setError('Enter an email and password first.')
      return
    }

    if (otpCooldownRemaining > 0) {
      setError(`Please wait ${otpCooldownRemaining}s before requesting another verification code.`)
      return
    }

    setLoading(true)
    const { error: signUpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    })
    setLoading(false)

    if (signUpError) {
      showAuthError(signUpError.message)
      return
    }

    setSignupStep('verify')
    setMessage(`Check your email for the ${otpCodeLength} digit verification code.`)
    startOtpCooldown()
  }

  async function verifyEmailCode() {
    setError('')
    setMessage('')

    if (cleanCode.length !== otpCodeLength) {
      setError(`Enter the ${otpCodeLength} digit code from your email.`)
      return
    }

    setLoading(true)
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: cleanCode,
      type: 'email',
    })
    setLoading(false)

    if (verifyError) {
      setError(verifyError.message)
      return
    }

    const { error: passwordError } = await supabase.auth.updateUser({
      password,
    })

    if (passwordError) {
      setError(passwordError.message)
      return
    }

    const userId = data.user?.id

    if (!userId) {
      setError('Email verified, but the user session was not returned. Try logging in.')
      return
    }

    setVerifiedUserId(userId)
    await rememberTrustedDevice(userId)
    setSignupStep('username')
    setMessage('Email verified. Choose your leaderboard username.')
  }

  async function saveUsername() {
    setError('')
    setMessage('')

    const cleanUsername = username.trim()

    if (!verifiedUserId) {
      setError('Verify your email before choosing a username.')
      return
    }

    if (cleanUsername.length < 3 || cleanUsername.length > 24) {
      setError('Usernames must be 3 to 24 characters long.')
      return
    }

    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      setError('Use only letters, numbers, and underscores.')
      return
    }

    if (!confirmedUsernameWarning) {
      setError('Confirm that you understand how your username appears on the leaderboard.')
      return
    }

    const sure = window.confirm(
      `"${cleanUsername}" will represent you on public leaderboards. Are you sure you want this username?`
    )

    if (!sure) {
      return
    }

    setLoading(true)
    const { data: existingUsers, error: existingError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', cleanUsername)
      .limit(1)

    if (existingError) {
      setLoading(false)
      setError(existingError.message)
      return
    }

    if (existingUsers && existingUsers.length > 0) {
      setLoading(false)
      setError('That username is already taken.')
      return
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({ id: verifiedUserId, username: cleanUsername })

    if (profileError) {
      setLoading(false)
      setError(profileError.message)
      return
    }

    await supabase.auth.updateUser({
      data: { username: cleanUsername },
    })

    setLoading(false)
    setSignupStep('complete')
    setLoggedInEmail(email)
    setMessage('Account created and verified. You are logged in on this trusted device.')
  }

  async function signIn() {
    setError('')
    setMessage('')

    if (!email || !password) {
      setError('Enter your email and password.')
      return
    }

    setLoading(true)
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    setLoading(false)

    if (signInError) {
      setError(signInError.message)
      return
    }

    if (data.user) {
      await rememberTrustedDevice(data.user.id)
      setLoggedInEmail(data.user.email || email)
      setMessage('Logged in. This device/IP is now remembered.')
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setLoggedInEmail(null)
    setMessage('Logged out.')
  }

  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white flex items-center justify-center">
      <div className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-950 p-6 shadow-2xl shadow-blue-950/20">
        <Link href="/" className="text-sm font-bold text-blue-400 hover:text-blue-300">
          BlitzTiers
        </Link>
        <h1 className="mt-3 text-3xl font-black">Login or Create Account</h1>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-bold text-zinc-300">
              <Mail size={16} /> Email
            </span>
            <input
              className="w-full rounded bg-zinc-900 p-3 outline-none ring-1 ring-zinc-800 focus:ring-blue-500"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          {signupStep === 'credentials' && (
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
          )}

          {signupStep === 'verify' && (
            <div className="space-y-3">
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-bold text-zinc-300">
                  <ShieldCheck size={16} /> Verification code
                </span>
                <input
                  inputMode="numeric"
                  className="w-full rounded bg-zinc-900 p-3 text-center text-2xl font-black tracking-[0.3em] outline-none ring-1 ring-zinc-800 focus:ring-blue-500"
                  placeholder="00000000"
                  value={cleanCode}
                  onChange={(event) => setVerificationCode(event.target.value)}
                />
              </label>

              <button
                type="button"
                onClick={signUp}
                disabled={loading || otpCooldownRemaining > 0}
                className="w-full rounded bg-zinc-800 p-3 text-sm font-bold text-zinc-200 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {otpCooldownRemaining > 0
                  ? `Resend code in ${otpCooldownRemaining}s`
                  : 'Resend verification code'}
              </button>
            </div>
          )}

          {signupStep === 'username' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100">
                Your username will appear directly on public leaderboards and should reflect how you want other players to see you.
              </div>

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

              <label className="flex items-start gap-3 rounded-lg bg-zinc-900 p-3 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={confirmedUsernameWarning}
                  onChange={(event) => setConfirmedUsernameWarning(event.target.checked)}
                />
                <span>I understand this username will represent me on the leaderboard.</span>
              </label>
            </div>
          )}

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

          {loggedInEmail && (
            <div className="rounded-lg bg-zinc-900 p-3 text-sm text-zinc-300">
              Signed in as <span className="font-bold text-white">{loggedInEmail}</span>
            </div>
          )}

          <div className="space-y-3 pt-2">
            {signupStep === 'credentials' && (
              <>
                <button
                  onClick={signIn}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded bg-blue-600 p-3 font-bold hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <LogIn size={18} /> Login
                </button>

                <button
                  onClick={signUp}
                  disabled={loading || otpCooldownRemaining > 0}
                  className="flex w-full items-center justify-center gap-2 rounded bg-green-600 p-3 font-bold hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Mail size={18} /> {otpCooldownRemaining > 0 ? `Create Account (${otpCooldownRemaining}s)` : 'Create Account'}
                </button>
              </>
            )}

            {signupStep === 'verify' && (
              <button
                onClick={verifyEmailCode}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded bg-blue-600 p-3 font-bold hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ShieldCheck size={18} /> Verify Email
              </button>
            )}

            {signupStep === 'username' && (
              <button
                onClick={saveUsername}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded bg-green-600 p-3 font-bold hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CheckCircle2 size={18} /> Save Username
              </button>
            )}

            {loggedInEmail && (
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
