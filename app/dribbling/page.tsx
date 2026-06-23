import { LeaderboardPage } from '@/lib/leaderboards'
import { getLeaderboardRegion } from '@/lib/regions'

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams: Promise<{ region?: string | string[] }>
}

export default async function DribblingPage({ searchParams }: PageProps) {
  const region = getLeaderboardRegion((await searchParams).region)

  return (
    <LeaderboardPage
      region={region}
      config={{
        title: 'Dribbling Rankings',
        table: 'dribbling_scores',
        description: 'Dribbling rankings from 20 attempts to get past a defender.',
      }}
    />
  )
}
