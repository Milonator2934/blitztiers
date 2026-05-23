'use client'

import { useEffect, useMemo, useState } from 'react'
import { ShieldCheck, Trash2, UserPlus } from 'lucide-react'
import { categories, type CategoryKey, getCategory } from '@/lib/categories'
import { supabase } from '@/lib/supabase'

type Player = {
  id: string
  username: string
  is_admin?: boolean | null
}

type ActionMode = 'add' | 'remove'

const scoreOwnerColumns = ['id', 'profile_id', 'player_id']

async function getSessionWithTimeout() {
  const timeout = new Promise<null>((resolve) => {
    window.setTimeout(() => resolve(null), 3000)
  })

  const session = supabase.auth
    .getSession()
    .then(({ data }) => data.session)
    .catch(() => null)

  return Promise.race([session, timeout])
}

async function upsertScore(table: string, playerId: string, elo: number) {
  for (const column of scoreOwnerColumns) {
    const { error } = await supabase
      .from(table)
      .upsert({ [column]: playerId, elo }, { onConflict: column })

    if (!error) {
      return null
    }
  }

  return 'Could not add the ranking. Check that the score table has an id, profile_id, or player_id column linked to profiles.'
}

async function deleteScore(table: string, playerId: string) {
  for (const column of scoreOwnerColumns) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq(column, playerId)

    if (!error) {
      return null
    }
  }

  return 'Could not remove the ranking. Check that the score table has an id, profile_id, or player_id column linked to profiles.'
}

export default function AdminPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [currentProfile, setCurrentProfile] = useState<Player | null>(null)
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [search, setSearch] = useState('')
  const [adminSearch, setAdminSearch] = useState('')
  const [selectedPlayerId, setSelectedPlayerId] = useState('')
  const [selectedAdminId, setSelectedAdminId] = useState('')
  const [mode, setMode] = useState<ActionMode>('add')
  const [categoryKey, setCategoryKey] = useState<CategoryKey>('accuracy')
  const [scoreValues, setScoreValues] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const selectedCategory = getCategory(categoryKey)
  const isSuperAdmin = currentProfile?.username === 'IGNORANCE'
  const isAdmin = isSuperAdmin || currentProfile?.is_admin === true

  const filteredPlayers = useMemo(
    () =>
      players.filter((player) =>
        player.username.toLowerCase().includes(search.toLowerCase())
      ),
    [players, search]
  )

  const filteredAdminCandidates = useMemo(
    () =>
      players.filter((player) =>
        player.username.toLowerCase().includes(adminSearch.toLowerCase())
      ),
    [players, adminSearch]
  )

  useEffect(() => {
    let ignore = false

    async function loadAdminData() {
      const session = await getSessionWithTimeout()
      const userId = session?.user.id

      if (!userId) {
        if (!ignore) {
          setCheckingAccess(false)
        }
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username, is_admin')
        .eq('id', userId)
        .maybeSingle()

      const { data: allPlayers } = await supabase
        .from('profiles')
        .select('id, username, is_admin')
        .order('username', { ascending: true })

      if (!ignore) {
        setCurrentProfile(profile || null)
        setPlayers(allPlayers || [])
        setSelectedPlayerId(allPlayers?.[0]?.id || '')
        setSelectedAdminId(allPlayers?.[0]?.id || '')
        setCheckingAccess(false)
      }
    }

    loadAdminData()

    return () => {
      ignore = true
    }
  }, [])

  function updateScoreValue(key: string, value: string) {
    setScoreValues((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function getNumericScoreValues() {
    const values: Record<string, number> = {}

    for (const field of selectedCategory.fields) {
      const value = Number(scoreValues[field.key])

      if (!Number.isFinite(value) || value < 0) {
        return null
      }

      values[field.key] = value
    }

    return values
  }

  async function handleRankingAction() {
    setError('')
    setMessage('')

    if (!isAdmin) {
      setError('You do not have access to this admin action.')
      return
    }

    if (!selectedPlayerId) {
      setError('Select a player first.')
      return
    }

    if (mode === 'remove' && !isSuperAdmin) {
      setError('Only IGNORANCE can remove players from a category.')
      return
    }

    setLoading(true)

    if (mode === 'remove') {
      const removeError = await deleteScore(selectedCategory.table, selectedPlayerId)
      setLoading(false)

      if (removeError) {
        setError(removeError)
        return
      }

      setMessage(`Removed ${selectedCategory.shortLabel} ranking.`)
      return
    }

    const numericValues = getNumericScoreValues()

    if (!numericValues) {
      setLoading(false)
      setError('Enter every score result as a positive number.')
      return
    }

    const elo = selectedCategory.calculateElo(numericValues)
    const addError = await upsertScore(selectedCategory.table, selectedPlayerId, elo)
    setLoading(false)

    if (addError) {
      setError(addError)
      return
    }

    setMessage(`Added ${selectedCategory.shortLabel} ranking with ${elo} ELO.`)
  }

  async function addAdmin() {
    setError('')
    setMessage('')

    if (!isSuperAdmin) {
      setError('Only IGNORANCE can add admins.')
      return
    }

    if (!selectedAdminId) {
      setError('Select a user to make admin.')
      return
    }

    setLoading(true)
    const { error: adminError } = await supabase
      .from('profiles')
      .update({ is_admin: true })
      .eq('id', selectedAdminId)
    setLoading(false)

    if (adminError) {
      setError(adminError.message)
      return
    }

    setPlayers((current) =>
      current.map((player) =>
        player.id === selectedAdminId ? { ...player, is_admin: true } : player
      )
    )
    setMessage('User added as an admin.')
  }

  if (checkingAccess) {
    return (
      <main className="min-h-screen bg-black p-10 text-white">
        <p className="text-zinc-400">Checking admin access...</p>
      </main>
    )
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-black p-10 text-white">
        <h1 className="text-5xl font-bold mb-4">Admin Dashboard</h1>
        <p className="max-w-xl rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-200">
          You do not have access to the admin panel. Only IGNORANCE and users added as admins can view this page.
        </p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white p-6 md:p-10">
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-black md:text-5xl">Admin Dashboard</h1>
          <p className="mt-3 text-zinc-400">
            Signed in as {currentProfile?.username}. {isSuperAdmin ? 'Super-admin access enabled.' : 'Admin access enabled.'}
          </p>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-6">
          <h2 className="mb-5 flex items-center gap-2 text-2xl font-bold">
            <ShieldCheck size={22} /> Category Rankings
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-zinc-300">Action</span>
              <select
                className="w-full rounded bg-zinc-900 p-3 outline-none ring-1 ring-zinc-800 focus:ring-blue-500"
                value={mode}
                onChange={(event) => setMode(event.target.value as ActionMode)}
              >
                <option value="add">Add player</option>
                {isSuperAdmin && <option value="remove">Remove player</option>}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-zinc-300">Category</span>
              <select
                className="w-full rounded bg-zinc-900 p-3 outline-none ring-1 ring-zinc-800 focus:ring-blue-500"
                value={categoryKey}
                onChange={(event) => {
                  setCategoryKey(event.target.value as CategoryKey)
                  setScoreValues({})
                }}
              >
                {categories.map((category) => (
                  <option key={category.key} value={category.key}>
                    {category.shortLabel}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr]">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-zinc-300">Search player</span>
              <input
                placeholder="Search username"
                className="w-full rounded bg-zinc-900 p-3 outline-none ring-1 ring-zinc-800 focus:ring-blue-500"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-zinc-300">Player</span>
              <select
                className="w-full rounded bg-zinc-900 p-3 outline-none ring-1 ring-zinc-800 focus:ring-blue-500"
                value={selectedPlayerId}
                onChange={(event) => setSelectedPlayerId(event.target.value)}
              >
                {filteredPlayers.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.username}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {mode === 'add' && (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {selectedCategory.fields.map((field) => (
                <label key={field.key} className="block">
                  <span className="mb-2 block text-sm font-bold text-zinc-300">{field.label}</span>
                  <input
                    type="number"
                    min={field.min ?? 0}
                    max={field.max}
                    className="w-full rounded bg-zinc-900 p-3 outline-none ring-1 ring-zinc-800 focus:ring-blue-500"
                    value={scoreValues[field.key] || ''}
                    onChange={(event) => updateScoreValue(field.key, event.target.value)}
                  />
                </label>
              ))}
            </div>
          )}

          <button
            onClick={handleRankingAction}
            disabled={loading}
            className={`mt-6 flex w-full items-center justify-center gap-2 rounded p-3 font-bold disabled:cursor-not-allowed disabled:opacity-60 ${
              mode === 'remove'
                ? 'bg-red-600 hover:bg-red-500'
                : 'bg-green-600 hover:bg-green-500'
            }`}
          >
            {mode === 'remove' ? <Trash2 size={18} /> : <UserPlus size={18} />}
            {mode === 'remove' ? 'Remove' : 'Add'}
          </button>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-6">
          <h2 className="mb-5 text-2xl font-bold">Admin Access</h2>

          {isSuperAdmin ? (
            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-zinc-300">Search user</span>
                <input
                  placeholder="Search username"
                  className="w-full rounded bg-zinc-900 p-3 outline-none ring-1 ring-zinc-800 focus:ring-blue-500"
                  value={adminSearch}
                  onChange={(event) => setAdminSearch(event.target.value)}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-zinc-300">User</span>
                <select
                  className="w-full rounded bg-zinc-900 p-3 outline-none ring-1 ring-zinc-800 focus:ring-blue-500"
                  value={selectedAdminId}
                  onChange={(event) => setSelectedAdminId(event.target.value)}
                >
                  {filteredAdminCandidates.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.username}{player.is_admin ? ' - admin' : ''}
                    </option>
                  ))}
                </select>
              </label>

              <button
                onClick={addAdmin}
                disabled={loading}
                className="w-full rounded bg-blue-600 p-3 font-bold hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Add Admin
              </button>
            </div>
          ) : (
            <p className="text-zinc-400">Only IGNORANCE can add new admins.</p>
          )}
        </div>
      </section>

      {(message || error) && (
        <div className="mt-6">
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
        </div>
      )}
    </main>
  )
}
