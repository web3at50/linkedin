'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type SuppressionItem = {
  id: string;
  linkedinUrl: string;
  fullName?: string | null;
  reason?: string | null;
  source: string;
  createdAt: string;
};

export default function SuppressionPage() {
  const [items, setItems] = useState<SuppressionItem[]>([]);
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [fullName, setFullName] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadItems() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/suppressions');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load suppressions');
      setItems(data.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load suppressions');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadItems();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/suppressions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          linkedinUrl: linkedinUrl.trim(),
          fullName: fullName.trim() || undefined,
          reason: reason.trim() || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to add suppression');
      setLinkedinUrl('');
      setFullName('');
      setReason('');
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add suppression');
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteItem(id: string) {
    setError(null);
    try {
      const response = await fetch(`/api/suppressions/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete suppression');
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete suppression');
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Suppression List</h1>
          <p className="text-sm text-slate-600">
            Do-not-contact / objections. Export and prospect views exclude these by default.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
              LinkedIn URL
            </label>
            <Input
              required
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://www.linkedin.com/in/..."
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
              Name (optional)
            </label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
              Reason (optional)
            </label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" disabled={submitting || !linkedinUrl.trim()}>
              {submitting ? 'Saving...' : 'Add / Update Suppression'}
            </Button>
          </div>
        </form>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">
            {loading ? 'Loading suppressions...' : `${items.length} suppression entries`}
          </div>

          <div className="divide-y divide-slate-200">
            {!loading && items.length === 0 && (
              <div className="px-4 py-6 text-sm text-slate-600">No suppression entries yet.</div>
            )}

            {items.map((item) => (
              <div key={item.id} className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-slate-900">
                    {item.fullName || 'Unnamed prospect'}
                  </div>
                  <div className="break-all text-sm text-slate-700">{item.linkedinUrl}</div>
                  <div className="text-xs text-slate-500">
                    {item.reason || 'No reason provided'} • {new Date(item.createdAt).toLocaleString()}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => void deleteItem(item.id)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

