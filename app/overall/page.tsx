import Link from 'next/link'
import { AdminLink, AuthNav } from '@/app/AuthNav'
import { categories } from '@/lib/categories'
import { getOverallLeaderboardPlayers } from '@/lib/leaderboards'

export const dynamic = 'force-dynamic'

export default async function OverallPage() {
  const players = await getOverallLeaderboardPlayers()

  return (
    <main className="min-h-screen bg-black p-4 text-white sm:p-6 md:p-10">
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/" className="text-sm font-bold text-blue-400 hover:text-blue-300">
              BlitzTiers
            </Link>
            <AdminLink />
          </div>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl md:text-5xl">Overall Rankings</h1>
          <p className="mt-3 max-w-2xl text-zinc-400">
            Total rank based on each player&apos;s average ELO across ranked categories.
          </p>
        </div>

        <AuthNav />
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-800">
        <table className="w-full min-w-[760px] border-collapse">
          <thead>
            <tr className="bg-zinc-900">
              <th className="p-4 text-left">Rank</th>
              <th className="p-4 text-left">Player</th>
              <th className="p-4 text-left">Average ELO</th>
              <th className="p-4 text-left">Categories</th>
              {categories.map((category) => (
                <th key={category.key} className="p-4 text-left">{category.shortLabel}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {players.length === 0 ? (
              <tr>
                <td className="p-6 text-zinc-400" colSpan={8}>
                  No ranked players yet.
                </td>
              </tr>
            ) : (
              players.map((player, index) => (
                <tr key={player.username} className="border-b border-zinc-800 last:border-b-0">
                  <td className="p-4 font-bold text-zinc-300">#{index + 1}</td>
                  <td className="p-4">{player.username}</td>
                  <td className="p-4 font-bold">{player.averageElo}</td>
                  <td className="p-4 text-zinc-300">{player.rankedCategories}/4</td>
                  {categories.map((category) => (
                    <td key={category.key} className="p-4 text-zinc-300">
                      {player.scores[category.key] ?? '-'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}
