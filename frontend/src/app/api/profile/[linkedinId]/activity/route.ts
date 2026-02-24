import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { requireAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { cacheFullProfile, getCachedFullProfile } from '@/lib/redis/profile-cache';
import { fetchLinkedInRawProfile } from '@/lib/brightdata/linkedin';
import { normalizeLinkedInActivity, normalizeLinkedInPosts, mergeActivityFeeds, computeDataExpiry } from '@/lib/activity';
import { transformBrightDataProfile } from '@/types/linkedin';
import type { ActivityItem } from '@/types/linkedin';

type RouteContext = {
  params: Promise<{ linkedinId: string }>;
};

function normalizeLinkedinId(id: string): string {
  return id.trim().replace(/\/+$/, '');
}

function buildLinkedinUrl(linkedinId: string): string {
  return `https://www.linkedin.com/in/${linkedinId}`;
}

function normalizeStoredActivity(value: unknown): ActivityItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is ActivityItem => {
      if (!item || typeof item !== 'object') return false;
      const candidate = item as { url?: unknown; kind?: unknown };
      return typeof candidate.url === 'string' && typeof candidate.kind === 'string';
    })
    .slice(0, 50);
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAuthenticatedUser();
    if (!auth.ok) {
      return auth.response;
    }

    const params = await context.params;
    const linkedinId = normalizeLinkedinId(decodeURIComponent(params.linkedinId ?? ''));

    if (!linkedinId) {
      return NextResponse.json(
        { success: false, error: 'linkedinId is required' },
        { status: 400 },
      );
    }

    const refresh = request.nextUrl.searchParams.get('refresh') === '1';
    const persist = request.nextUrl.searchParams.get('persist') === '1';

    if (!refresh) {
      const redisProfile = await getCachedFullProfile(linkedinId);
      if (redisProfile?.linkedinActivity || redisProfile?.linkedinPosts) {
        const posts = normalizeLinkedInPosts(redisProfile.linkedinPosts);
        const activity = normalizeLinkedInActivity(redisProfile.linkedinActivity);
        const items = mergeActivityFeeds(posts, activity);
        return NextResponse.json({
          success: true,
          source: 'redis',
          persisted: false,
          profile: {
            linkedinId: redisProfile.linkedinId,
            linkedinUrl: redisProfile.linkedinUrl,
            fullName: redisProfile.fullName,
          },
          counts: { posts: posts.length, activity: activity.length, total: items.length },
          items,
        });
      }

      const savedPerson = await prisma.person.findUnique({
        where: { linkedinId },
        select: {
          id: true,
          fullName: true,
          linkedinId: true,
          linkedinUrl: true,
          linkedinPosts: true,
          linkedinActivity: true,
          dataExpiresAt: true,
        },
      });

      if (
        savedPerson &&
        (!savedPerson.dataExpiresAt || savedPerson.dataExpiresAt > new Date()) &&
        (savedPerson.linkedinActivity || savedPerson.linkedinPosts)
      ) {
        const storedItems = normalizeStoredActivity(savedPerson.linkedinActivity);
        const storedPosts = normalizeStoredActivity(savedPerson.linkedinPosts);
        const items = mergeActivityFeeds(storedPosts, storedItems);
        return NextResponse.json({
          success: true,
          source: 'postgres',
          persisted: true,
          profile: {
            linkedinId: savedPerson.linkedinId,
            linkedinUrl: savedPerson.linkedinUrl,
            fullName: savedPerson.fullName,
          },
          counts: { posts: storedPosts.length, activity: storedItems.length, total: items.length },
          items,
        });
      }
    }

    const linkedinUrl = buildLinkedinUrl(linkedinId);
    const rawProfile = await fetchLinkedInRawProfile(linkedinUrl);

    const posts = normalizeLinkedInPosts(rawProfile.posts);
    const activity = normalizeLinkedInActivity(rawProfile.activity);
    const items = mergeActivityFeeds(posts, activity);

    const transformed = transformBrightDataProfile(rawProfile);
    try {
      await cacheFullProfile(transformed);
    } catch (error) {
      console.warn('[Profile Activity API] Failed to cache fresh profile in Redis:', error);
    }

    let didPersist = false;
    if (persist) {
      const existing = await prisma.person.findUnique({
        where: { linkedinId },
        select: { id: true },
      });

      if (existing) {
        await prisma.person.update({
          where: { linkedinId },
          data: {
            linkedinPosts: posts as unknown as Prisma.InputJsonValue,
            linkedinActivity: items as unknown as Prisma.InputJsonValue,
            activityFetchedAt: new Date(),
            dataExpiresAt: computeDataExpiry(30),
            lastViewed: new Date(),
          },
        });
        didPersist = true;
      }
    }

    return NextResponse.json({
      success: true,
      source: 'api',
      persisted: didPersist,
      profile: {
        linkedinId: rawProfile.linkedin_id,
        linkedinUrl: rawProfile.url,
        fullName: rawProfile.name,
      },
      counts: { posts: posts.length, activity: activity.length, total: items.length },
      items,
    });
  } catch (error) {
    console.error('[Profile Activity API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch activity',
      },
      { status: 500 },
    );
  }
}
