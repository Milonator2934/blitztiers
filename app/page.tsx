import Link from 'next/link'
import { AuthNav } from '@/app/AuthNav'
import { categories } from '@/lib/categories'
import { getLeaderboardCount } from '@/lib/leaderboards'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const counts = await Promise.all(
    categories.map(async (category) => ({
      key: category.key,
      count: await getLeaderboardCount(category.table),
    }))
  )

  const countByCategory = Object.fromEntries(
    counts.map((category) => [category.key, category.count])
  )

  return (
    <main className="min-h-screen bg-black text-white">
      <nav className="border-b border-zinc-800 p-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-blue-500">
          BlitzTiers
        </h1>

        <AuthNav />
      </nav>

      <section className="flex flex-col items-center justify-center text-center py-32 px-6">
        <h2 className="text-7xl font-black mb-6">
          Competitive DriftBlitz Rankings
        </h2>

        <p className="text-zinc-400 text-xl max-w-2xl mb-10">
          BlitzTiers is a fully objective Orion Drift DriftBlitz
          ranking platform using standardized skill testing and ELO.
        </p>

        <div className="flex gap-6">
          <Link
            href="/overall"
            className="bg-blue-600 hover:bg-blue-500 px-8 py-4 rounded-xl font-bold"
          >
            View Rankings
          </Link>

          <Link
            href="/login"
            className="bg-zinc-800 hover:bg-zinc-700 px-8 py-4 rounded-xl font-bold"
          >
            Login
          </Link>

          <Link
            href="/info"
            className="bg-zinc-800 hover:bg-zinc-700 px-8 py-4 rounded-xl font-bold"
          >
            How It Works
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 px-6 pb-24">
        {categories.map((category) => {
          const count = countByCategory[category.key] || 0

          return (
            <Link
              href={category.key === 'power' ? '/power' : `/${category.key}`}
              key={category.key}
              className="bg-zinc-900 p-8 rounded-lg hover:bg-zinc-800"
            >
              <h3 className="text-3xl font-bold mb-4">{category.label}</h3>
              <p className="text-zinc-400">
                {category.description} {count} {count === 1 ? 'player has' : 'players have'} been ranked.
              </p>
            </Link>
          )
        })}
      </section>
    </main>
  )
}
