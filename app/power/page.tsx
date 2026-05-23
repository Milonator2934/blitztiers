import { LeaderboardPage } from '@/lib/leaderboards'

export const dynamic = 'force-dynamic'

export default function PowerPage() {
  return (
    <LeaderboardPage
      config={{
        title: 'Shot Power Rankings',
        table: 'power_scores',
        description: 'Shot power rankings from maximum effective velocity tests.',
      }}
    />
  )
}
