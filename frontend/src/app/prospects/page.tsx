'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

type ProspectListItem = {
  id: string;
  status: string;
  priority: string;
  noteCount?: number;
  updatedAt: string;
  person: {
    linkedinId: string;
    linkedinUrl: string;
    fullName: string;
    headline?: string | null;
    location?: string | null;
    currentCompany?: string | null;
    activityFetchedAt?: string | null;
    dataExpiresAt?: string | null;
  };
};

const STATUS_OPTIONS = ['new', 'reviewing', 'ready_to_contact', 'contacted', 'not_relevant'];
const PRIORITY_OPTIONS = ['low', 'medium', 'high'];

export default function ProspectsPage() {
  const [items, setItems] = useState<ProspectListItem[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (statusFilter) params.set('status', statusFilter);
    if (priorityFilter) params.set('priority', priorityFilter);
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    return params.toString();
  }, [page, pageSize, priorityFilter, query, statusFilter]);

  async function loadProspects() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/prospects?${queryString}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load prospects');
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load prospects');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProspects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

  async function updateProspect(id: string, patch: { status?: string; priority?: string }) {
    try {
      const response = await fetch(`/api/prospects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update prospect');
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status: data.prospect.status,
                priority: data.prospect.priority,
                updatedAt: data.prospect.updatedAt,
              }
            : item,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update prospect');
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Saved Prospects</h1>
            <p className="text-sm text-slate-600">
              Explicitly saved prospects only. Activity snapshots expire by retention policy.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={loadProspects} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button asChild>
              <a href={`/api/export?${queryString}`}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </a>
            </Button>
          </div>
        </div>

        <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
              Search
            </label>
            <Input
              value={query}
              onChange={(e) => {
                setPage(1);
                setQuery(e.target.value);
              }}
              placeholder="Name, headline, company"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setPage(1);
                setStatusFilter(e.target.value);
              }}
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="">All</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
              Priority
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPage(1);
                setPriorityFilter(e.target.value);
              }}
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="">All</option>
              {PRIORITY_OPTIONS.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {items.length === 0 && !loading && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
              No saved prospects yet. Save people from the search results page.
            </div>
          )}

          {items.map((item) => (
            <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/prospects/${item.id}`} className="text-lg font-semibold text-slate-900 hover:underline">
                      {item.person.fullName}
                    </Link>
                    <Badge variant="outline">{item.status}</Badge>
                    <Badge variant="secondary">{item.priority}</Badge>
                  </div>
                  {item.person.headline && <p className="text-sm text-slate-700">{item.person.headline}</p>}
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                    {item.person.currentCompany && <span>{item.person.currentCompany}</span>}
                    {item.person.location && <span>{item.person.location}</span>}
                    <span>{item.noteCount ?? 0} notes</span>
                    {item.person.activityFetchedAt && (
                      <span>Activity fetched {new Date(item.person.activityFetchedAt).toLocaleString()}</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={item.status}
                    onChange={(e) => void updateProspect(item.id, { status: e.target.value })}
                    className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <select
                    value={item.priority}
                    onChange={(e) => void updateProspect(item.id, { priority: e.target.value })}
                    className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm"
                  >
                    {PRIORITY_OPTIONS.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                  <Button variant="outline" size="sm" asChild>
                    <a href={item.person.linkedinUrl} target="_blank" rel="noopener noreferrer">
                      LinkedIn
                    </a>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href={`/prospects/${item.id}`}>Open</Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 text-sm">
          <span className="text-slate-600">
            Page {page} of {totalPages} • {total} total prospects
          </span>
          <div className="flex gap-2">
            <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}

