import { AdminLink, AuthNav } from '@/app/AuthNav'
import { BrandLogo } from '@/app/BrandLogo'

const measurements = [
  {
    title: 'Overall',
    summary:
      'Overall is the average of a player\'s ranked ELO scores, minus 50 ELO for each unfinished category.',
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
      'Moving shots count less because it is easier to generate extra power while moving.',
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
  {
    title: 'Dribbling',
    summary:
      'Dribbling measures how often a player can get past a defender.',
    details: [
      'Players get 20 attempts to dribble past a defender.',
      'More successful dribbles produce a higher ELO score.',
    ],
  },
  {
    title: 'Defending',
    summary:
      'Defending measures how often a player can stop an attacker.',
    details: [
      'Players get 20 attempts to defend against an attacker.',
      'More successful defensive stops produce a higher ELO score.',
    ],
  },
]

export default function InfoPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <nav className="border-b border-zinc-800 p-4 sm:p-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <BrandLogo />
            <AdminLink />
          </div>

          <AuthNav />
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-black sm:text-4xl md:text-5xl">How Rankings Are Measured</h1>
          <p className="mt-4 text-base text-zinc-400 sm:text-lg">
            Each category turns a simple skill test into an ELO score. Higher scores mean
            stronger performance in that specific part of DriftBlitz.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {measurements.map((measurement) => (
            <article
              key={measurement.title}
              className="rounded-lg border border-zinc-800 bg-zinc-950 p-5 sm:p-6"
            >
              <h2 className="text-xl font-black sm:text-2xl">{measurement.title}</h2>
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
