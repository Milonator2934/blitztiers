import Image from 'next/image'

const sponsors = [
  {
    label: 'Sponsored by EU CDBL',
    src: '/driftblitz-logo.png',
    alt: 'EU CDBL Driftblitz logo',
  },
  {
    label: 'Sponsored by NA CDBL',
    src: '/na-driftblitz-logo.jpeg',
    alt: 'NA CDBL Driftblitz logo',
  },
]

export function SponsorFooter() {
  return (
    <footer className="bg-black px-4 py-8 text-white sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-6 border-t border-zinc-800 pt-6 sm:flex-row sm:flex-wrap">
        {sponsors.map((sponsor) => (
          <div
            key={sponsor.label}
            className="flex flex-wrap items-center justify-center gap-3 text-center"
          >
            <span className="text-sm font-black uppercase text-purple-400 sm:text-base">
              {sponsor.label}
            </span>
            <Image
              src={sponsor.src}
              alt={sponsor.alt}
              width={120}
              height={80}
              className="h-12 w-auto object-contain sm:h-14"
            />
          </div>
        ))}
      </div>
    </footer>
  )
}
