import { LeaderboardPage } from '@/lib/leaderboards'

export const dynamic = 'force-dynamic'

export default function AccuracyPage() {
  return (
    <LeaderboardPage
      config={{
        title: 'Accuracy Rankings',
        table: 'accuracy_scores',
        description: 'Shot accuracy rankings from standardized finishing tests.',
      }}
    />
  )
}
