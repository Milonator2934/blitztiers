export const leaderboardRegions = ['Global', 'NA', 'EU'] as const
export const rankingRegions = ['NA', 'EU'] as const

export type LeaderboardRegion = (typeof leaderboardRegions)[number]
export type RankingRegion = (typeof rankingRegions)[number]

export function getLeaderboardRegion(value?: string | string[]): LeaderboardRegion {
  const region = Array.isArray(value) ? value[0] : value

  if (region === 'NA' || region === 'EU') {
    return region
  }

  return 'Global'
}

export function getRankingRegion(value: string): RankingRegion {
  return value === 'EU' ? 'EU' : 'NA'
}

export function getRegionQuery(region: LeaderboardRegion) {
  return region === 'Global' ? '' : `?region=${region}`
}
