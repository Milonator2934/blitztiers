import { LeaderboardPage } from '@/lib/leaderboards'

export const dynamic = 'force-dynamic'

export default function GoalkeepingPage() {
  return (
    <LeaderboardPage
      config={{
        title: 'Goalkeeping Rankings',
        table: 'goalkeeping_scores',
        description: 'Goalkeeping rankings from save-rate and defensive pressure tests.',
      }}
    />
  )
}
