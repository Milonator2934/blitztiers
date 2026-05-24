import Link from 'next/link'

const measurements = [
  {
    title: 'Overall',
    summary:
      'Overall is the average of a player\'s ELO scores across every category they have been ranked in.',
    details: [
      'A player with scores in more categories has a fuller overall profile.',
      'Higher category ELO scores raise the overall average.',
    ],
  },
  {
    title: 'Shot Accuracy',
    summary:
      'Accuracy measures how consistently a player finishes shots from different positions.',
    details: [
      'Close front, far front, close diagonal, far diagonal, and keeper shots are tested.',
      'Harder shot types are worth more in the final ELO calculation.',
    ],
  },
  {
    title: 'Shot Power',
    summary:
      'Power measures the fastest useful shot speeds a player can create in several situations.',
    details: [
      'Ground shots, air shots, moving ground shots, and moving air shots are measured.',
      'Moving shots count more because they are harder to create cleanly.',
    ],
  },
  {
    title: 'Passing',
    summary:
      'Passing measures how accurately a player can place the ball for teammates.',
    details: [
      'Width passes, through balls, air passes, and defender-pressure passes are tested.',
      'More difficult pass types have a stronger effect on the ELO score.',
    ],
  },
  {
    title: 'Goalkeeping',
    summary:
      'Goalkeeping measures how often a player saves shots compared with how often they let goals in.',
    details: [
      'The main number is save rate: saves divided by total shots faced.',
      'More saves and fewer goals allowed produce a higher ELO score.',
    ],
  },
]

export default function InfoPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <nav className="border-b border-zinc-800 p-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link href="/" className="text-3xl font-bold text-blue-500">
            BlitzTiers
          </Link>

          <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-zinc-300">
            <Link href="/overall" className="hover:text-white">Rankings</Link>
            <Link href="/login" className="hover:text-white">Login</Link>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-black md:text-5xl">How Rankings Are Measured</h1>
          <p className="mt-4 text-lg text-zinc-400">
            Each category turns a simple skill test into an ELO score. Higher scores mean
            stronger performance in that specific part of DriftBlitz.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {measurements.map((measurement) => (
            <article
              key={measurement.title}
              className="rounded-lg border border-zinc-800 bg-zinc-950 p-6"
            >
              <h2 className="text-2xl font-black">{measurement.title}</h2>
              <p className="mt-3 text-zinc-300">{measurement.summary}</p>

              <ul className="mt-4 space-y-2 text-sm text-zinc-400">
                {measurement.details.map((detail) => (
                  <li key={detail}>- {detail}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
