import { Buffer } from 'node:buffer';
import type { Activity, ActivityItem, ActivityKind } from '@/types/linkedin';

const MAX_SNIPPET_LENGTH = 320;

function trimText(value: unknown, maxLength = MAX_SNIPPET_LENGTH): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.replace(/\s+/g, ' ').trim();
  if (!trimmed) return undefined;
  return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength - 1)}…` : trimmed;
}

function toUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  try {
    return new URL(value).toString();
  } catch {
    return undefined;
  }
}

function inferKind(input?: string): ActivityKind {
  if (!input) return 'unknown';
  const text = input.toLowerCase();
  if (text.includes('comment')) return 'comment';
  if (text.includes('react') || text.includes('like')) return 'reaction';
  if (text.includes('repost') || text.includes('share')) return 'repost';
  if (text.includes('post') || text.includes('publish') || text.includes('article')) return 'post';
  return 'unknown';
}

function safeObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function normalizeLinkedInActivity(rawActivity: unknown): ActivityItem[] {
  if (!Array.isArray(rawActivity)) return [];

  const items: ActivityItem[] = [];

  for (const [index, raw] of rawActivity.entries()) {
    const activity = raw as Partial<Activity> & Record<string, unknown>;
    const url = toUrl(activity.link ?? activity.url);
    if (!url) continue;

    const rawInteraction = trimText(activity.interaction, 120);
    const title = trimText(activity.title, 160);
    const snippet = trimText(
      activity.snippet ?? activity.text ?? activity.description ?? activity.caption,
    );
    const occurredAt = trimText(
      activity.occurredAt ?? activity.date ?? activity.created_at ?? activity.timestamp,
      80,
    );
    const sourceLabel = trimText(activity.sourceLabel ?? activity.source ?? 'LinkedIn', 80);

    items.push({
      id:
        trimText(activity.id, 120) ??
        `activity-${index}-${Buffer.from(url).toString('base64').slice(0, 12)}`,
      kind: inferKind(rawInteraction ?? title),
      title,
      snippet,
      url,
      occurredAt,
      sourceLabel,
      rawInteraction,
    });
  }

  return items;
}

export function normalizeLinkedInPosts(rawPosts: unknown): ActivityItem[] {
  if (!Array.isArray(rawPosts)) return [];

  const items: ActivityItem[] = [];

  for (const [index, raw] of rawPosts.entries()) {
    const post = safeObject(raw);
    if (!post) continue;

    const url =
      toUrl(post.url) ??
      toUrl(post.link) ??
      toUrl(post.post_url) ??
      toUrl(post.postUrl) ??
      toUrl(post.activity_url);
    if (!url) continue;

    const title =
      trimText(post.title, 160) ??
      trimText(post.headline, 160) ??
      trimText(post.author_activity_type, 160);

    const snippet =
      trimText(post.text) ??
      trimText(post.content) ??
      trimText(post.description) ??
      trimText(post.caption) ??
      trimText(post.summary);

    const occurredAt =
      trimText(post.date, 80) ??
      trimText(post.created_at, 80) ??
      trimText(post.published_at, 80) ??
      trimText(post.time, 80);

    const sourceLabel = trimText(post.source ?? 'LinkedIn post', 80);

    items.push({
      id:
        trimText(post.id, 120) ??
        `post-${index}-${Buffer.from(url).toString('base64').slice(0, 12)}`,
      kind: 'post',
      title,
      snippet,
      url,
      occurredAt,
      sourceLabel,
      rawInteraction: 'post',
    });
  }

  return items;
}

export function mergeActivityFeeds(posts: ActivityItem[], activity: ActivityItem[]): ActivityItem[] {
  const seen = new Set<string>();
  const merged: ActivityItem[] = [];

  for (const item of [...posts, ...activity]) {
    const key = `${item.kind}:${item.url.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }

  return merged.slice(0, 50);
}

export function computeDataExpiry(days = 30): Date {
  const ms = days * 24 * 60 * 60 * 1000;
  return new Date(Date.now() + ms);
}
