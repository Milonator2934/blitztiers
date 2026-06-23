'use client'

import { useEffect, useState } from 'react'
import { leaderboardRegions, type LeaderboardRegion } from '@/lib/regions'

const regionStorageKey = 'blitztiers-region'

function readRegionFromUrl() {
  if (typeof window === 'undefined') {
    return 'Global'
  }

  const region = new URLSearchParams(window.location.search).get('region')
  return region === 'NA' || region === 'EU' ? region : 'Global'
}

export function RegionSelector() {
  const [selectedRegion, setSelectedRegion] = useState<LeaderboardRegion>(() => readRegionFromUrl())

  useEffect(() => {
    const urlRegion = readRegionFromUrl()
    const storedRegion = window.localStorage.getItem(regionStorageKey)

    if (urlRegion !== 'Global') {
      setSelectedRegion(urlRegion)
      window.localStorage.setItem(regionStorageKey, urlRegion)
      return
    }

    setSelectedRegion('Global')

    if (storedRegion === 'NA' || storedRegion === 'EU') {
      const url = new URL(window.location.href)
      url.searchParams.set('region', storedRegion)
      window.location.replace(`${url.pathname}${url.search}${url.hash}`)
    }
  }, [])

  function chooseRegion(region: LeaderboardRegion) {
    setSelectedRegion(region)
    window.localStorage.setItem(regionStorageKey, region)

    const url = new URL(window.location.href)
    if (region === 'Global') {
      url.searchParams.delete('region')
    } else {
      url.searchParams.set('region', region)
    }

    window.location.assign(`${url.pathname}${url.search}${url.hash}`)
  }

  return (
    <div className="flex items-center justify-center rounded bg-zinc-950 p-1 ring-1 ring-zinc-800">
      {leaderboardRegions.map((region) => (
        <button
          key={region}
          type="button"
          onClick={() => chooseRegion(region)}
          className={`h-9 min-w-16 rounded px-3 text-sm font-black ${
            selectedRegion === region
              ? 'bg-blue-600 text-white'
              : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
          }`}
        >
          {region}
        </button>
      ))}
    </div>
  )
}
