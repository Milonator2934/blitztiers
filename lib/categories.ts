import {
  calculateAccuracyElo,
  averageScores,
  calculateGoalkeepingElo,
  calculateOutOf20Elo,
  calculatePassingElo,
  calculatePowerElo,
} from '@/lib/calculations'

export type CategoryKey = 'accuracy' | 'goalkeeping' | 'passing' | 'power' | 'dribbling' | 'defending'

export type ScoreField = {
  key: string
  label: string
  min?: number
  max?: number
  integer?: boolean
}

export type CategoryConfig = {
  key: CategoryKey
  label: string
  shortLabel: string
  table: string
  description: string
  fields: ScoreField[]
  calculateElo: (values: Record<string, number>) => number
}

export const categories: CategoryConfig[] = [
  {
    key: 'accuracy',
    label: 'Shot Accuracy',
    shortLabel: 'Accuracy',
    table: 'accuracy_scores',
    description: 'Ranked using weighted shot testing from multiple positions.',
    fields: [
      { key: 'closeFront', label: 'Close front shots' },
      { key: 'farFront', label: 'Far front shots' },
      { key: 'closeDiagonal', label: 'Close diagonal shots' },
      { key: 'farDiagonal', label: 'Far diagonal shots' },
      { key: 'keeper', label: 'Keeper shots' },
    ],
    calculateElo: (values) =>
      calculateAccuracyElo(
        values.closeFront,
        values.farFront,
        values.closeDiagonal,
        values.farDiagonal,
        values.keeper
      ),
  },
  {
    key: 'power',
    label: 'Shot Power',
    shortLabel: 'Shot Power',
    table: 'power_scores',
    description: 'Measures maximum effective shot velocity up to 55m/s, with moving shots weighted lower.',
    fields: [
      { key: 'ground1', label: 'Ground shot speed 1', min: 0, max: 55 },
      { key: 'ground2', label: 'Ground shot speed 2', min: 0, max: 55 },
      { key: 'ground3', label: 'Ground shot speed 3', min: 0, max: 55 },
      { key: 'ground4', label: 'Ground shot speed 4', min: 0, max: 55 },
      { key: 'ground5', label: 'Ground shot speed 5', min: 0, max: 55 },
      { key: 'air1', label: 'Air shot speed 1', min: 0, max: 55 },
      { key: 'air2', label: 'Air shot speed 2', min: 0, max: 55 },
      { key: 'air3', label: 'Air shot speed 3', min: 0, max: 55 },
      { key: 'air4', label: 'Air shot speed 4', min: 0, max: 55 },
      { key: 'air5', label: 'Air shot speed 5', min: 0, max: 55 },
      { key: 'movingGround1', label: 'Moving ground speed 1', min: 0, max: 55 },
      { key: 'movingGround2', label: 'Moving ground speed 2', min: 0, max: 55 },
      { key: 'movingGround3', label: 'Moving ground speed 3', min: 0, max: 55 },
      { key: 'movingGround4', label: 'Moving ground speed 4', min: 0, max: 55 },
      { key: 'movingGround5', label: 'Moving ground speed 5', min: 0, max: 55 },
      { key: 'movingAir1', label: 'Moving air speed 1', min: 0, max: 55 },
      { key: 'movingAir2', label: 'Moving air speed 2', min: 0, max: 55 },
      { key: 'movingAir3', label: 'Moving air speed 3', min: 0, max: 55 },
      { key: 'movingAir4', label: 'Moving air speed 4', min: 0, max: 55 },
      { key: 'movingAir5', label: 'Moving air speed 5', min: 0, max: 55 },
    ],
    calculateElo: (values) =>
      calculatePowerElo(
        averageScores([values.ground1, values.ground2, values.ground3, values.ground4, values.ground5]),
        averageScores([values.air1, values.air2, values.air3, values.air4, values.air5]),
        averageScores([
          values.movingGround1,
          values.movingGround2,
          values.movingGround3,
          values.movingGround4,
          values.movingGround5,
        ]),
        averageScores([
          values.movingAir1,
          values.movingAir2,
          values.movingAir3,
          values.movingAir4,
          values.movingAir5,
        ])
      ),
  },
  {
    key: 'passing',
    label: 'Passing',
    shortLabel: 'Passing',
    table: 'passing_scores',
    description: 'Precision passing evaluation across multiple scenarios.',
    fields: [
      { key: 'width', label: 'Width passes' },
      { key: 'throughBall', label: 'Through balls' },
      { key: 'air', label: 'Air passes' },
      { key: 'defender', label: 'Defender passes' },
    ],
    calculateElo: (values) =>
      calculatePassingElo(values.width, values.throughBall, values.air, values.defender),
  },
  {
    key: 'goalkeeping',
    label: 'Goalkeeping',
    shortLabel: 'Goalkeeping',
    table: 'goalkeeping_scores',
    description: 'Save-rate based goalkeeper ELO calculations.',
    fields: [
      { key: 'saves', label: 'Saves' },
      { key: 'goalsAllowed', label: 'Goals allowed' },
    ],
    calculateElo: (values) => calculateGoalkeepingElo(values.saves, values.goalsAllowed),
  },
  {
    key: 'dribbling',
    label: 'Dribbling',
    shortLabel: 'Dribbling',
    table: 'dribbling_scores',
    description: 'Ranks how often a player dribbles past a defender in 20 attempts.',
    fields: [
      { key: 'successfulDribbles', label: 'Times dribbled past defender', min: 0, max: 20, integer: true },
    ],
    calculateElo: (values) => calculateOutOf20Elo(values.successfulDribbles),
  },
  {
    key: 'defending',
    label: 'Defending',
    shortLabel: 'Defending',
    table: 'defending_scores',
    description: 'Ranks how often a player stops an attacker in 20 defensive attempts.',
    fields: [
      { key: 'successfulDefenses', label: 'Times defended attacker', min: 0, max: 20, integer: true },
    ],
    calculateElo: (values) => calculateOutOf20Elo(values.successfulDefenses),
  },
]

export function getCategory(key: CategoryKey) {
  return categories.find((category) => category.key === key) || categories[0]
}
