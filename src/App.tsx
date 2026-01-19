import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 px-6 py-16 text-slate-50">
      <div className="w-full max-w-3xl space-y-8">
        <header className="space-y-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-200 ring-1 ring-inset ring-sky-500/30">
            <span className="h-2 w-2 rounded-full bg-sky-400" />
            Tailwind is live
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            React + Tailwind starter
          </h1>
          <p className="text-base text-slate-300 sm:text-lg">
            Edit{' '}
            <code className="rounded bg-slate-800 px-2 py-1 text-slate-100">
              src/App.tsx
            </code>{' '}
            and save to make it yours.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-300">Demo</p>
                <h2 className="text-lg font-semibold">Counter card</h2>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200 ring-1 ring-inset ring-emerald-500/30">
                Interactive
              </span>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => setCount((value) => value + 1)}
                className="rounded-xl bg-sky-500 px-5 py-3 text-base font-semibold text-white shadow-lg shadow-sky-500/25 transition hover:bg-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 active:translate-y-px"
              >
                Count is {count}
              </button>
              <p className="text-sm text-slate-300">
                Click to increment the counter.
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
            <h2 className="text-lg font-semibold">Helpful commands</h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li>
                <span className="font-semibold text-slate-100">npm run dev</span>{' '}
                — start the dev server
              </li>
              <li>
                <span className="font-semibold text-slate-100">
                  npm run build
                </span>{' '}
                — production build
              </li>
              <li>
                <span className="font-semibold text-slate-100">npm run lint</span>{' '}
                — lint the project
              </li>
            </ul>
            <p className="mt-4 text-sm text-slate-400">
              Tailwind utility classes are available globally.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

export default App
