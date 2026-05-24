export function getRankBadgeClass(index: number) {
  if (index === 0) {
    return 'border-yellow-300/50 bg-yellow-400/15 text-yellow-300'
  }

  if (index === 1) {
    return 'border-zinc-200/50 bg-zinc-200/15 text-zinc-100'
  }

  if (index === 2) {
    return 'border-amber-700/60 bg-amber-700/20 text-amber-500'
  }

  return 'border-zinc-700 bg-zinc-900 text-zinc-300'
}
