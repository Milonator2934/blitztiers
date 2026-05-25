import {
  calculateAccuracyElo,
  averageScores,
  calculateGoalkeepingElo,
  calculatePassingElo,
  calculatePowerElo,
} from '@/lib/calculations'

export type CategoryKey = 'accuracy' | 'goalkeeping' | 'passing' | 'power'

export type ScoreField = {
  key: string
  label: string
  min?: number
  max?: number
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
      { key: 'air1', label: 'Air shot speed 1', min: 0, max: 55 },
      { key: 'air2', label: 'Air shot speed 2', min: 0, max: 55 },
      { key: 'air3', label: 'Air shot speed 3', min: 0, max: 55 },
      { key: 'movingGround1', label: 'Moving ground speed 1', min: 0, max: 55 },
      { key: 'movingGround2', label: 'Moving ground speed 2', min: 0, max: 55 },
      { key: 'movingGround3', label: 'Moving ground speed 3', min: 0, max: 55 },
      { key: 'movingAir1', label: 'Moving air speed 1', min: 0, max: 55 },
      { key: 'movingAir2', label: 'Moving air speed 2', min: 0, max: 55 },
      { key: 'movingAir3', label: 'Moving air speed 3', min: 0, max: 55 },
    ],
    calculateElo: (values) =>
      calculatePowerElo(
        averageScores([values.ground1, values.ground2, values.ground3]),
        averageScores([values.air1, values.air2, values.air3]),
        averageScores([values.movingGround1, values.movingGround2, values.movingGround3]),
        averageScores([values.movingAir1, values.movingAir2, values.movingAir3])
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
]

export function getCategory(key: CategoryKey) {
  return categories.find((category) => category.key === key) || categories[0]
}
