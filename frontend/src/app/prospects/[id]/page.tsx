'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { RefreshCw, ShieldBan } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ActivityFeed } from '@/components/ActivityFeed';
import type { ActivityItem } from '@/types/linkedin';

type ProspectDetail = {
  id: string;
  status: string;
  priority: string;
  updatedAt: string;
  person: {
    id: string;
    linkedinId: string;
    linkedinUrl: string;
    fullName: string;
    headline?: string | null;
    about?: string | null;
    location?: string | null;
    currentCompany?: string | null;
    linkedinActivity?: ActivityItem[] | null;
    activityFetchedAt?: string | null;
    dataExpiresAt?: string | null;
  } | null;
  notes?: Array<{ id: string; content: string; createdAt: string; updatedAt: string }>;
};

const STATUS_OPTIONS = ['new', 'reviewing', 'ready_to_contact', 'contacted', 'not_relevant'];
const PRIORITY_OPTIONS = ['low', 'medium', 'high'];

export default function ProspectDetailPage() {
  const params = useParams<{ id: string }>();
  const id = String(params.id ?? '');
  const [prospect, setProspect] = useState<ProspectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [refreshingActivity, setRefreshingActivity] = useState(false);
  const [suppressing, setSuppressing] = useState(false);

  async function loadProspect() {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/prospects/${id}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load prospect');
      setProspect(data.prospect);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load prospect');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProspect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function patchProspect(patch: { status?: string; priority?: string }) {
    const response = await fetch(`/api/prospects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to update prospect');
    setProspect((prev) => (prev ? { ...prev, ...data.prospect, person: data.prospect.person, notes: prev.notes } : prev));
  }

  async function addNote() {
    if (!newNote.trim()) return;
    setSubmittingNote(true);
    setError(null);
    try {
      const response = await fetch(`/api/prospects/${id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to add note');
      setProspect((prev) =>
        prev
          ? {
              ...prev,
              notes: [data.note, ...(prev.notes ?? [])],
            }
          : prev,
      );
      setNewNote('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add note');
    } finally {
      setSubmittingNote(false);
    }
  }

  async function refreshActivitySnapshot() {
    if (!prospect?.person?.linkedinId) return;
    setRefreshingActivity(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/profile/${encodeURIComponent(prospect.person.linkedinId)}/activity?refresh=1&persist=1`,
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to refresh activity');
      await loadProspect();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh activity');
    } finally {
      setRefreshingActivity(false);
    }
  }

  async function suppressProspect() {
    if (!prospect?.person) return;
    setSuppressing(true);
    setError(null);
    try {
      const response = await fetch('/api/suppressions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          linkedinUrl: prospect.person.linkedinUrl,
          fullName: prospect.person.fullName,
          reason: 'Manual do-not-contact',
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to suppress prospect');
      if (prospect.status !== 'not_relevant') {
        await patchProspect({ status: 'not_relevant' });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to suppress prospect');
    } finally {
      setSuppressing(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-4xl rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading prospect...
        </div>
      </main>
    );
  }

  if (error && !prospect) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-4xl space-y-4">
          <Link href="/prospects" className="text-sm text-blue-600 hover:underline">
            Back to prospects
          </Link>
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        </div>
      </main>
    );
  }

  if (!prospect || !prospect.person) return null;

  const activityItems = Array.isArray(prospect.person.linkedinActivity)
    ? prospect.person.linkedinActivity
    : [];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/prospects" className="text-sm text-blue-600 hover:underline">
            Back to prospects
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" onClick={refreshActivitySnapshot} disabled={refreshingActivity}>
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshingActivity ? 'animate-spin' : ''}`} />
              Refresh activity snapshot
            </Button>
            <Button variant="outline" onClick={suppressProspect} disabled={suppressing}>
              <ShieldBan className="mr-2 h-4 w-4" />
              {suppressing ? 'Saving...' : 'Suppress / DNC'}
            </Button>
          </div>
        </div>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold text-slate-900">{prospect.person.fullName}</h1>
                <Badge variant="outline">{prospect.status}</Badge>
                <Badge variant="secondary">{prospect.priority}</Badge>
              </div>
              {prospect.person.headline && <p className="text-sm text-slate-700">{prospect.person.headline}</p>}
              <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                {prospect.person.currentCompany && <span>{prospect.person.currentCompany}</span>}
                {prospect.person.location && <span>{prospect.person.location}</span>}
                {prospect.person.activityFetchedAt && (
                  <span>Activity fetched {new Date(prospect.person.activityFetchedAt).toLocaleString()}</span>
                )}
                {prospect.person.dataExpiresAt && (
                  <span>Expires {new Date(prospect.person.dataExpiresAt).toLocaleDateString()}</span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                value={prospect.status}
                onChange={(e) => void patchProspect({ status: e.target.value })}
                className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <select
                value={prospect.priority}
                onChange={(e) => void patchProspect({ priority: e.target.value })}
                className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm"
              >
                {PRIORITY_OPTIONS.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
              <Button size="sm" asChild>
                <a href={prospect.person.linkedinUrl} target="_blank" rel="noopener noreferrer">
                  Open LinkedIn
                </a>
              </Button>
            </div>
          </div>

          {prospect.person.about && (
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {prospect.person.about}
            </p>
          )}
        </section>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Activity Snapshot</h2>
            <span className="text-xs text-slate-500">
              Saved snapshot (manual refresh only)
            </span>
          </div>
          <ActivityFeed items={activityItems} emptyLabel="No saved activity snapshot yet. Use refresh to fetch and persist one." />
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900">Notes</h2>
          <p className="mt-1 text-xs text-slate-500">
            Avoid sensitive-category inferences (health, politics, religion, etc.).
          </p>

          <div className="mt-4 space-y-3">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Add manual outreach/research notes..."
            />
            <div className="flex justify-end">
              <Button onClick={addNote} disabled={submittingNote || !newNote.trim()}>
                {submittingNote ? 'Saving note...' : 'Add note'}
              </Button>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {(prospect.notes ?? []).length === 0 && (
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                No notes yet.
              </div>
            )}

            {(prospect.notes ?? []).map((note) => (
              <div key={note.id} className="rounded-md border border-slate-200 p-3">
                <div className="mb-2 text-xs text-slate-500">
                  {new Date(note.createdAt).toLocaleString()}
                </div>
                <p className="whitespace-pre-wrap text-sm text-slate-800">{note.content}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

