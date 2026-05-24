import Link from 'next/link'
import { categories } from '@/lib/categories'
import { supabase } from '@/lib/supabase'

export type LeaderboardConfig = {
  title: string
  table: string
  description: string
}

type LeaderboardPlayer = {
  elo: number
  profiles: { username: string } | { username: string }[] | null
}

type OverallPlayer = {
  username: string
  averageElo: number
  rankedCategories: number
  scores: Record<string, number>
}

function getUsername(profile: LeaderboardPlayer['profiles']) {
  if (Array.isArray(profile)) {
    return profile[0]?.username || 'Unknown player'
  }

  return profile?.username || 'Unknown player'
}

export async function getLeaderboardPlayers(table: string) {
  const { data, error } = await supabase
    .from(table)
    .select(`
      elo,
      profiles(username)
    `)
    .order('elo', { ascending: false })

  if (error) {
    console.error(`Failed to load ${table}:`, error.message)
    return []
  }

  return (data || []) as LeaderboardPlayer[]
}

export async function getLeaderboardCount(table: string) {
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.error(`Failed to count ${table}:`, error.message)
    return 0
  }

  return count || 0
}

export async function getOverallLeaderboardPlayers() {
  const players = new Map<string, OverallPlayer>()

  await Promise.all(
    categories.map(async (category) => {
      const rows = await getLeaderboardPlayers(category.table)

      rows.forEach((row) => {
        const username = getUsername(row.profiles)

        if (username === 'Unknown player') {
          return
        }

        const existing = players.get(username) || {
          username,
          averageElo: 0,
          rankedCategories: 0,
          scores: {},
        }

        existing.scores[category.key] = row.elo
        players.set(username, existing)
      })
    })
  )

  return Array.from(players.values())
    .map((player) => {
      const scores = Object.values(player.scores)
      const averageElo = Math.round(
        scores.reduce((total, elo) => total + elo, 0) / scores.length
      )

      return {
        ...player,
        averageElo,
        rankedCategories: scores.length,
      }
    })
    .sort((a, b) => b.averageElo - a.averageElo)
}

export async function LeaderboardPage({ config }: { config: LeaderboardConfig }) {
  const players = await getLeaderboardPlayers(config.table)

  return (
    <main className="min-h-screen bg-black text-white p-6 md:p-10">
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <Link href="/" className="text-sm font-bold text-blue-400 hover:text-blue-300">
            BlitzTiers
          </Link>
          <h1 className="mt-3 text-4xl font-black md:text-5xl">{config.title}</h1>
          <p className="mt-3 max-w-2xl text-zinc-400">{config.description}</p>
        </div>

        <nav className="flex flex-wrap gap-3 text-sm font-bold text-zinc-300">
          <Link href="/overall" className="hover:text-white">Overall</Link>
          <Link href="/accuracy" className="hover:text-white">Accuracy</Link>
          <Link href="/passing" className="hover:text-white">Passing</Link>
          <Link href="/goalkeeping" className="hover:text-white">Goalkeeping</Link>
          <Link href="/power" className="hover:text-white">Shot Power</Link>
          <Link href="/info" className="hover:text-white">Info</Link>
        </nav>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-800">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-zinc-900">
              <th className="p-4 text-left">Rank</th>
              <th className="p-4 text-left">Player</th>
              <th className="p-4 text-left">ELO</th>
            </tr>
          </thead>

          <tbody>
            {players.length === 0 ? (
              <tr>
                <td className="p-6 text-zinc-400" colSpan={3}>
                  No ranked players yet.
                </td>
              </tr>
            ) : (
              players.map((player, index) => (
                <tr key={`${config.table}-${index}`} className="border-b border-zinc-800 last:border-b-0">
                  <td className="p-4 font-bold text-zinc-300">#{index + 1}</td>
                  <td className="p-4">{getUsername(player.profiles)}</td>
                  <td className="p-4">{player.elo}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}
