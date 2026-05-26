import { AdminLink, AuthNav } from '@/app/AuthNav'
import { BrandLogo } from '@/app/BrandLogo'
import { categories } from '@/lib/categories'
import { getRankBadgeClass } from '@/lib/rankStyles'
import type { LeaderboardRegion } from '@/lib/regions'
import { supabase } from '@/lib/supabase'

export type LeaderboardConfig = {
  title: string
  table: string
  description: string
}

type LeaderboardPlayer = {
  elo: number
  region?: string | null
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

export async function getLeaderboardPlayers(
  table: string,
  region: LeaderboardRegion = 'Global'
) {
  const profileRelation = `${table}_profile_id_fkey`
  const selectColumns = region === 'Global'
    ? `
      elo,
      profiles!${profileRelation}(username)
    `
    : `
      elo,
      region,
      profiles!${profileRelation}(username)
    `

  const query = supabase
    .from(table)
    .select(selectColumns)
    .order('elo', { ascending: false })

  if (region !== 'Global') {
    query.eq('region', region)
  }

  const { data, error } = await query

  if (error) {
    console.error(`Failed to load ${table}:`, error.message)
    return []
  }

  return (data || []) as unknown as LeaderboardPlayer[]
}

export async function getLeaderboardCount(
  table: string,
  region: LeaderboardRegion = 'Global'
) {
  const query = supabase
    .from(table)
    .select('*', { count: 'exact', head: true })

  if (region !== 'Global') {
    query.eq('region', region)
  }

  const { count, error } = await query

  if (error) {
    console.error(`Failed to count ${table}:`, error.message)
    return 0
  }

  return count || 0
}

export async function getOverallLeaderboardPlayers(region: LeaderboardRegion = 'Global') {
  const players = new Map<string, OverallPlayer>()
  const missingCategoryPenalty = 50

  await Promise.all(
    categories.map(async (category) => {
      const rows = await getLeaderboardPlayers(category.table, region)

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

        if (!existing.scores[category.key] || row.elo > existing.scores[category.key]) {
          existing.scores[category.key] = row.elo
        }
        players.set(username, existing)
      })
    })
  )

  return Array.from(players.values())
    .map((player) => {
      const scores = Object.values(player.scores)
      const missingCategories = categories.length - scores.length
      const averageElo = Math.round(
        scores.reduce((total, elo) => total + elo, 0) / scores.length
      ) - missingCategories * missingCategoryPenalty

      return {
        ...player,
        averageElo,
        rankedCategories: scores.length,
      }
    })
    .sort((a, b) => b.averageElo - a.averageElo)
}

export async function LeaderboardPage({
  config,
  region = 'Global',
}: {
  config: LeaderboardConfig
  region?: LeaderboardRegion
}) {
  const players = await getLeaderboardPlayers(config.table, region)

  return (
    <main className="min-h-screen bg-black p-4 text-white sm:p-6 md:p-10">
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <BrandLogo compact />
            <AdminLink />
          </div>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl md:text-5xl">{config.title}</h1>
          <p className="mt-3 max-w-2xl text-zinc-400">
            {config.description} Showing {region} rankings.
          </p>
        </div>

        <AuthNav />
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-800">
        <table className="w-full min-w-[420px] border-collapse">
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
                  <td className="p-4">
                    <span className={`inline-flex h-8 min-w-12 items-center justify-center rounded border px-3 font-black ${getRankBadgeClass(index)}`}>
                      #{index + 1}
                    </span>
                  </td>
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
