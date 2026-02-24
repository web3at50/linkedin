'use client';

import { useRouter } from 'next/navigation';
import { SearchBar } from '@/components/SearchBar';

const EXAMPLES = [
  'Headteachers in London academy trusts',
  'MAT directors in the UK',
  'School IT leads in Birmingham',
  'Secondary school leaders in Manchester',
];

export default function Home() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Internal LinkedIn Activity Research Tool
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
            Targeted searches only. Fetch profile and activity on demand, then explicitly save prospects for follow-up.
            No background monitoring in this MVP.
          </p>

          <div className="mt-6">
            <SearchBar onSearch={(query) => router.push(`/search?q=${encodeURIComponent(query)}`)} />
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-800">
              Example searches
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {EXAMPLES.map((example) => (
                <li key={example} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400" />
                  <button
                    type="button"
                    onClick={() => router.push(`/search?q=${encodeURIComponent(example)}`)}
                    className="text-left hover:text-slate-900 hover:underline"
                  >
                    {example}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-900">
              Operating rules (MVP)
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-amber-900/90">
              <li>On-demand activity fetch only (no automatic monitoring).</li>
              <li>Unsaved search results are not persisted to Postgres.</li>
              <li>Saved prospect snapshots are subject to retention expiry.</li>
              <li>Avoid sensitive-category inferences in notes.</li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}

