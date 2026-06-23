import { LeaderboardPage } from '@/lib/leaderboards'
import { getLeaderboardRegion } from '@/lib/regions'

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams: Promise<{ region?: string | string[] }>
}

export default async function DefendingPage({ searchParams }: PageProps) {
  const region = getLeaderboardRegion((await searchParams).region)

  return (
    <LeaderboardPage
      region={region}
      config={{
        title: 'Defending Rankings',
        table: 'defending_scores',
        description: 'Defending rankings from 20 attempts to stop an attacker.',
      }}
    />
  )
}
