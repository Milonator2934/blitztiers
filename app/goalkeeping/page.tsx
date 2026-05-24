import { LeaderboardPage } from '@/lib/leaderboards'
import { getLeaderboardRegion } from '@/lib/regions'

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams: Promise<{ region?: string | string[] }>
}

export default async function GoalkeepingPage({ searchParams }: PageProps) {
  const region = getLeaderboardRegion((await searchParams).region)

  return (
    <LeaderboardPage
      region={region}
      config={{
        title: 'Goalkeeping Rankings',
        table: 'goalkeeping_scores',
        description: 'Goalkeeping rankings from save-rate and defensive pressure tests.',
      }}
    />
  )
}
