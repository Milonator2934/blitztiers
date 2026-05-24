import { LeaderboardPage } from '@/lib/leaderboards'
import { getLeaderboardRegion } from '@/lib/regions'

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams: Promise<{ region?: string | string[] }>
}

export default async function AccuracyPage({ searchParams }: PageProps) {
  const region = getLeaderboardRegion((await searchParams).region)

  return (
    <LeaderboardPage
      region={region}
      config={{
        title: 'Accuracy Rankings',
        table: 'accuracy_scores',
        description: 'Shot accuracy rankings from standardized finishing tests.',
      }}
    />
  )
}
