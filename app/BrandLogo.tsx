import Image from 'next/image'
import Link from 'next/link'

type BrandLogoProps = {
  compact?: boolean
}

export function BrandLogo({ compact = false }: BrandLogoProps) {
  return (
    <Link
      href="/"
      className="inline-flex items-center rounded outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-blue-400"
      aria-label="BlitzTiers home"
    >
      <Image
        src="/blitztiers-logo.png"
        alt="BlitzTiers"
        width={1774}
        height={887}
        priority
        className={`${compact ? 'h-9 w-[4.5rem]' : 'h-12 w-24 sm:h-14 sm:w-28'} object-cover`}
      />
    </Link>
  )
}
