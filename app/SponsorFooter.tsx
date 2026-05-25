import Image from 'next/image'

const sponsors = [
  {
    label: 'Sponsored by EU CDBL',
    src: '/driftblitz-logo.png',
    alt: 'EU CDBL Driftblitz logo',
    href: 'https://discord.gg/q2h6KQrS',
  },
  {
    label: 'Sponsored by NA CDBL',
    src: '/na-driftblitz-logo.jpeg',
    alt: 'NA CDBL Driftblitz logo',
    href: 'https://discord.gg/NUQeFUb2E',
  },
]

export function SponsorFooter() {
  return (
    <footer className="bg-black px-4 py-8 text-white sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-6 border-t border-zinc-800 pt-6 sm:flex-row sm:flex-wrap">
        {sponsors.map((sponsor) => (
          <a
            key={sponsor.label}
            href={sponsor.href}
            target="_blank"
            rel="noreferrer"
            className="flex flex-wrap items-center justify-center gap-3 rounded text-center outline-none transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-purple-400"
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
          </a>
        ))}
      </div>
    </footer>
  )
}
