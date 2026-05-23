import { LeaderboardPage } from '@/lib/leaderboards'

export const dynamic = 'force-dynamic'

export default function PassingPage() {
  return (
    <LeaderboardPage
      config={{
        title: 'Passing Rankings',
        table: 'passing_scores',
        description: 'Passing rankings from precision, timing, and scenario-based tests.',
      }}
    />
  )
}
