import { AdminLink, AuthNav } from '@/app/AuthNav'
import { BrandLogo } from '@/app/BrandLogo'

type ComingSoonPageProps = {
  title: string
  description: string
}

export function ComingSoonPage({ title, description }: ComingSoonPageProps) {
  return (
    <main className="min-h-screen bg-black p-4 text-white sm:p-6 md:p-10">
      <div className="mb-8 flex flex-col gap-4 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center">
        <div className="flex flex-wrap items-center gap-3">
          <BrandLogo compact />
          <AdminLink />
        </div>

        <AuthNav />
      </div>

      <section className="mx-auto flex max-w-3xl flex-col items-center py-20 text-center">
        <p className="text-sm font-black uppercase text-blue-300">Coming Soon</p>
        <h1 className="mt-3 text-4xl font-black sm:text-5xl">{title}</h1>
        <p className="mt-5 max-w-xl text-zinc-400">{description}</p>
      </section>
    </main>
  )
}
