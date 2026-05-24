import { LeaderboardPage } from '@/lib/leaderboards'
import { getLeaderboardRegion } from '@/lib/regions'

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams: Promise<{ region?: string | string[] }>
}

export default async function PowerPage({ searchParams }: PageProps) {
  const region = getLeaderboardRegion((await searchParams).region)

  return (
    <LeaderboardPage
      region={region}
      config={{
        title: 'Shot Power Rankings',
        table: 'power_scores',
        description: 'Shot power rankings from maximum effective velocity tests.',
      }}
    />
  )
}
