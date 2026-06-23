export function calculateAccuracyElo(
  closeFront: number,
  farFront: number,
  closeDiagonal: number,
  farDiagonal: number,
  keeper: number
) {
  const weightedScore =
    closeFront * 1.0 +
    farFront * 1.2 +
    closeDiagonal * 1.3 +
    farDiagonal * 1.5 +
    keeper * 2.0

  const normalized = weightedScore / 35

  return Math.round(500 + normalized * 500)
}

export function calculatePowerElo(
  ground: number,
  air: number,
  movingGround: number,
  movingAir: number
) {
  const powerScore =
    ground * 0.3 +
    air * 0.3 +
    movingGround * 0.2 +
    movingAir * 0.2

  const normalized = powerScore / 55

  return Math.round(500 + normalized * 500)
}

export function averageScores(scores: number[]) {
  return scores.reduce((total, score) => total + score, 0) / scores.length
}

export function calculatePassingElo(
  width: number,
  throughBall: number,
  air: number,
  defender: number
) {
  const weightedPassing =
    width * 1.0 +
    throughBall * 1.5 +
    air * 1.7 +
    defender * 2.0

  const normalized = weightedPassing / 31

  return Math.round(500 + normalized * 500)
}

export function calculateGoalkeepingElo(
  saves: number,
  goalsAllowed: number
) {
  if (saves + goalsAllowed === 0) {
    return 500
  }

  const saveRate = saves / (saves + goalsAllowed)

  return Math.round(500 + saveRate * 500)
}

export function calculateOutOf20Elo(successes: number) {
  const normalized = successes / 20

  return Math.round(500 + normalized * 500)
}
