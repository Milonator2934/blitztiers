'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ShieldCheck, Trash2, UserPlus } from 'lucide-react'
import { categories, type CategoryKey, getCategory } from '@/lib/categories'
import { supabase } from '@/lib/supabase'

type Player = {
  id: string
  username: string
  is_admin?: boolean | null
}

type ActionMode = 'add' | 'remove'
type AdminTab = 'rankings' | 'requests' | 'admins'

type ModerationRequest = {
  id: string
  requester_id: string
  category: CategoryKey
  code_type: string
  code_number: number
  requested_admin_id?: string | null
  responding_admin_id?: string | null
  admin_response?: string | null
  status: string
  created_at?: string | null
  responded_at?: string | null
}

const scoreOwnerColumns = ['id', 'profile_id', 'player_id']

function mergeUniquePlayers(players: Player[], fallbackPlayer: Player | null) {
  if (!fallbackPlayer) {
    return players
  }

  if (players.some((player) => player.id === fallbackPlayer.id)) {
    return players
  }

  return [...players, fallbackPlayer].sort((a, b) => a.username.localeCompare(b.username))
}

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
  const [activeTab, setActiveTab] = useState<AdminTab>('rankings')
  const [mode, setMode] = useState<ActionMode>('add')
  const [categoryKey, setCategoryKey] = useState<CategoryKey>('accuracy')
  const [scoreValues, setScoreValues] = useState<Record<string, string>>({})
  const [requestResponses, setRequestResponses] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [requestError, setRequestError] = useState('')
  const [moderationRequests, setModerationRequests] = useState<ModerationRequest[]>([])
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

  const selectedPlayerValue = filteredPlayers.some((player) => player.id === selectedPlayerId)
    ? selectedPlayerId
    : filteredPlayers[0]?.id || ''

  const selectedAdminValue = filteredAdminCandidates.some((player) => player.id === selectedAdminId)
    ? selectedAdminId
    : filteredAdminCandidates[0]?.id || ''


  useEffect(() => {
    let ignore = false

    async function loadAdminData() {
      const session = await getSessionWithTimeout()
      const { data: userData } = session
        ? { data: { user: session.user } }
        : await supabase.auth.getUser()
      const user = userData.user
      const userId = user?.id

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

      const fallbackProfile = profile || user.user_metadata?.username ? {
        id: userId,
        username: profile?.username || user.user_metadata.username,
        is_admin: profile?.is_admin,
      } : null

      if (!profile && fallbackProfile?.username) {
        await supabase
          .from('profiles')
          .upsert({ id: fallbackProfile.id, username: fallbackProfile.username })
      }

      const { data: allPlayers } = await supabase
        .from('profiles')
        .select('id, username, is_admin')
        .order('username', { ascending: true })

      const { data: requests, error: requestsError } = await supabase
        .from('moderation_requests')
        .select('id, requester_id, category, code_type, code_number, requested_admin_id, responding_admin_id, admin_response, status, created_at, responded_at')
        .order('created_at', { ascending: false })

      if (!ignore) {
        const playerList = mergeUniquePlayers(allPlayers || [], fallbackProfile)
        setCurrentProfile(fallbackProfile)
        setPlayers(playerList)
        setModerationRequests((requests || []) as ModerationRequest[])
        setRequestError(
          requestsError?.message.includes("Could not find the table")
            ? 'The moderation_requests table is missing in Supabase. Run supabase/migrations/0001_create_moderation_requests.sql in the Supabase SQL editor, then reload this page.'
            : requestsError?.message || ''
        )
        setSelectedPlayerId(playerList[0]?.id || '')
        setSelectedAdminId(playerList[0]?.id || '')
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

    if (!selectedPlayerValue) {
      setError('Select a player first.')
      return
    }

    if (mode === 'remove' && !isSuperAdmin) {
      setError('Only IGNORANCE can remove players from a category.')
      return
    }

    setLoading(true)

    if (mode === 'remove') {
      const removeError = await deleteScore(selectedCategory.table, selectedPlayerValue)
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
    const addError = await upsertScore(selectedCategory.table, selectedPlayerValue, elo)
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

    if (!selectedAdminValue) {
      setError('Select a user to make admin.')
      return
    }

    setLoading(true)
    const { error: adminError } = await supabase
      .from('profiles')
      .update({ is_admin: true })
      .eq('id', selectedAdminValue)
    setLoading(false)

    if (adminError) {
      setError(adminError.message)
      return
    }

    setPlayers((current) =>
      current.map((player) =>
        player.id === selectedAdminValue ? { ...player, is_admin: true } : player
      )
    )
    setMessage('User added as an admin.')
  }

  function updateRequestResponse(requestId: string, value: string) {
    setRequestResponses((current) => ({
      ...current,
      [requestId]: value,
    }))
  }

  async function respondToModerationRequest(requestId: string) {
    setError('')
    setMessage('')

    if (!isAdmin) {
      setError('You do not have access to this admin action.')
      return
    }

    const response = requestResponses[requestId]?.trim()

    if (!response) {
      setError('Write a response before sending it.')
      return
    }

    setLoading(true)
    const { error: updateError } = await supabase
      .from('moderation_requests')
      .update({
        admin_response: response,
        responding_admin_id: currentProfile?.id || null,
        responded_at: new Date().toISOString(),
        status: 'responded',
      })
      .eq('id', requestId)
    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setModerationRequests((current) =>
      current.map((request) =>
        request.id === requestId
          ? {
              ...request,
              admin_response: response,
              responding_admin_id: currentProfile?.id || null,
              responded_at: new Date().toISOString(),
              status: 'responded',
            }
          : request
      )
    )
    setMessage('Response sent to the moderation request.')
  }

  function getPlayerName(playerId?: string | null) {
    return players.find((player) => player.id === playerId)?.username || 'Unknown player'
  }

  if (checkingAccess) {
    return (
      <main className="min-h-screen bg-black p-4 text-white sm:p-10">
        <p className="text-zinc-400">Checking admin access...</p>
      </main>
    )
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-black p-4 text-white sm:p-10">
        <h1 className="mb-4 text-3xl font-bold sm:text-5xl">Admin Dashboard</h1>
        <p className="max-w-xl rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-200">
          You do not have access to the admin panel. Only IGNORANCE and users added as admins can view this page.
        </p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black p-4 text-white sm:p-6 md:p-10">
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-black sm:text-4xl md:text-5xl">Admin Dashboard</h1>
          <p className="mt-3 text-zinc-400">
            Signed in as {currentProfile?.username}. {isSuperAdmin ? 'Super-admin access enabled.' : 'Admin access enabled.'}
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 border-b border-zinc-800 pb-3">
        {[
          { key: 'rankings', label: 'Rankings' },
          { key: 'requests', label: 'Requests' },
          { key: 'admins', label: 'Admins' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as AdminTab)}
            className={`rounded px-4 py-2 text-sm font-bold ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'rankings' && (
        <section className="rounded-lg border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
          <h2 className="mb-5 flex items-center gap-2 text-xl font-bold sm:text-2xl">
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
                value={selectedPlayerValue}
                onChange={(event) => setSelectedPlayerId(event.target.value)}
                disabled={filteredPlayers.length === 0}
              >
                {filteredPlayers.length === 0 && <option value="">No matching players</option>}
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
        </section>
      )}

      {activeTab === 'requests' && (
        <section className="rounded-lg border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
          <h2 className="mb-5 text-xl font-bold sm:text-2xl">Requests</h2>

          {requestError ? (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100">
              Could not load requests: {requestError}
            </p>
          ) : moderationRequests.length === 0 ? (
            <p className="text-zinc-400">No moderation requests yet.</p>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {moderationRequests.map((request) => {
                const requestedAdmin = request.requested_admin_id
                  ? getPlayerName(request.requested_admin_id)
                  : 'Any admin'
                const respondingAdmin = request.responding_admin_id
                  ? getPlayerName(request.responding_admin_id)
                  : null

                return (
                  <article key={request.id} className="rounded-lg bg-zinc-900 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-bold">{getPlayerName(request.requester_id)}</p>
                        <p className="mt-1 text-sm text-zinc-300">
                          {getCategory(request.category).shortLabel} - {request.code_type} #{request.code_number}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          Requested admin: {requestedAdmin}
                        </p>
                        {request.created_at && (
                          <p className="mt-1 text-xs text-zinc-500">
                            Sent: {new Date(request.created_at).toLocaleString()}
                          </p>
                        )}
                      </div>

                      <span className="rounded bg-zinc-800 px-2.5 py-1 text-xs font-bold uppercase text-zinc-300">
                        {request.status}
                      </span>
                    </div>

                    {request.admin_response ? (
                      <div className="mt-4 rounded bg-black/30 p-3 text-sm text-zinc-300">
                        <p className="font-bold text-white">Response</p>
                        <p className="mt-2">{request.admin_response}</p>
                        {respondingAdmin && (
                          <p className="mt-2 text-xs text-zinc-500">By {respondingAdmin}</p>
                        )}
                      </div>
                    ) : (
                      <div className="mt-4 space-y-3">
                        <textarea
                          className="min-h-28 w-full rounded bg-black/30 p-3 text-sm outline-none ring-1 ring-zinc-800 focus:ring-blue-500"
                          placeholder="Write a response for this request"
                          value={requestResponses[request.id] || ''}
                          onChange={(event) => updateRequestResponse(request.id, event.target.value)}
                        />
                        <button
                          onClick={() => respondToModerationRequest(request.id)}
                          disabled={loading}
                          className="flex w-full items-center justify-center gap-2 rounded bg-blue-600 p-2.5 text-sm font-bold hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <CheckCircle2 size={16} /> Send Response
                        </button>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </section>
      )}

      {activeTab === 'admins' && (
        <section className="max-w-xl rounded-lg border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
          <h2 className="mb-5 text-xl font-bold sm:text-2xl">Admin Access</h2>

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
                  value={selectedAdminValue}
                  onChange={(event) => setSelectedAdminId(event.target.value)}
                  disabled={filteredAdminCandidates.length === 0}
                >
                  {filteredAdminCandidates.length === 0 && <option value="">No matching users</option>}
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
        </section>
      )}

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
