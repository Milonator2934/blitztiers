import Link from 'next/link'
import { AdminLink, AuthNav } from '@/app/AuthNav'
import { BrandLogo } from '@/app/BrandLogo'
import { categories } from '@/lib/categories'
import { getLeaderboardCount } from '@/lib/leaderboards'
import { getLeaderboardRegion, getRegionQuery } from '@/lib/regions'

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams: Promise<{ region?: string | string[] }>
}

const comingSoonCategories = [
  {
    key: 'dribbling',
    label: 'Dribbling',
    description: 'Dribbling rankings are coming soon.',
  },
  {
    key: 'defending',
    label: 'Defending',
    description: 'Defending rankings are coming soon.',
  },
]

export default async function HomePage({ searchParams }: PageProps) {
  const region = getLeaderboardRegion((await searchParams).region)
  const counts = await Promise.all(
    categories.map(async (category) => ({
      key: category.key,
      count: await getLeaderboardCount(category.table, region),
    }))
  )

  const countByCategory = Object.fromEntries(
    counts.map((category) => [category.key, category.count])
  )
  const regionQuery = getRegionQuery(region)

  return (
    <main className="min-h-screen bg-black text-white">
      <nav className="flex flex-col gap-4 border-b border-zinc-800 p-4 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <BrandLogo />
          <AdminLink />
        </div>

        <AuthNav />
      </nav>

      <section className="flex flex-col items-center justify-center px-4 py-16 text-center sm:px-6 sm:py-24 lg:py-32">
        <h2 className="mb-6 max-w-5xl text-4xl font-black leading-tight sm:text-5xl lg:text-7xl">
          Competitive DriftBlitz Rankings
        </h2>

        <p className="mb-10 max-w-2xl text-base text-zinc-400 sm:text-xl">
          BlitzTiers is a fully objective Orion Drift DriftBlitz
          ranking platform using standardized skill testing and ELO.
        </p>

        <div className="flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center sm:gap-6">
          <Link
            href={`/overall${regionQuery}`}
            className="rounded-xl bg-blue-600 px-6 py-4 font-bold hover:bg-blue-500 sm:px-8"
          >
            View Rankings
          </Link>

          <Link
            href="/login"
            className="rounded-xl bg-zinc-800 px-6 py-4 font-bold hover:bg-zinc-700 sm:px-8"
          >
            Login
          </Link>

          <Link
            href="/info"
            className="rounded-xl bg-zinc-800 px-6 py-4 font-bold hover:bg-zinc-700 sm:px-8"
          >
            How It Works
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-5 px-4 pb-16 sm:px-6 md:grid-cols-2 md:gap-8 md:pb-24">
        {categories.map((category) => {
          const count = countByCategory[category.key] || 0

          return (
            <Link
              href={`${category.key === 'power' ? '/power' : `/${category.key}`}${regionQuery}`}
              key={category.key}
              className="rounded-lg bg-zinc-900 p-5 hover:bg-zinc-800 sm:p-8"
            >
              <h3 className="mb-4 text-2xl font-bold sm:text-3xl">{category.label}</h3>
              <p className="text-zinc-400">
                {category.description} {count} {count === 1 ? 'player has' : 'players have'} been ranked in {region}.
              </p>
            </Link>
          )
        })}

        {comingSoonCategories.map((category) => (
          <Link
            href={`/${category.key}`}
            key={category.key}
            className="rounded-lg bg-zinc-900 p-5 hover:bg-zinc-800 sm:p-8"
          >
            <h3 className="mb-4 text-2xl font-bold sm:text-3xl">{category.label}</h3>
            <p className="text-zinc-400">{category.description}</p>
          </Link>
        ))}
      </section>
    </main>
  )
}
