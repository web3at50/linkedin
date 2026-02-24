import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthenticatedUser } from '@/lib/auth';
import { fetchLinkedInRawProfile } from '@/lib/brightdata/linkedin';
import { transformBrightDataProfile, type ProfileData } from '@/types/linkedin';
import { saveProfile } from '@/lib/cache';
import { cacheFullProfile, getCachedFullProfile } from '@/lib/redis/profile-cache';
import { computeDataExpiry, mergeActivityFeeds, normalizeLinkedInActivity, normalizeLinkedInPosts } from '@/lib/activity';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const ALLOWED_STATUSES = new Set(['new', 'reviewing', 'ready_to_contact', 'contacted', 'not_relevant']);
const ALLOWED_PRIORITIES = new Set(['low', 'medium', 'high']);

function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number(searchParams.get('pageSize') ?? DEFAULT_PAGE_SIZE) || DEFAULT_PAGE_SIZE),
  );
  return { page, pageSize };
}

function buildLinkedinUrl(linkedinId: string) {
  return `https://www.linkedin.com/in/${linkedinId.trim().replace(/\/+$/, '')}`;
}

function parseEnumValue(value: unknown, allowed: Set<string>, fallback: string) {
  if (typeof value !== 'string') return fallback;
  return allowed.has(value) ? value : fallback;
}

type ProspectListRow = {
  id: string;
  personId: string;
  status: string;
  priority: string;
  lastReviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  person: {
    id: string;
    linkedinId: string;
    linkedinUrl: string;
    fullName: string;
    headline: string | null;
    location: string | null;
    currentCompany: string | null;
    profilePicUrl: string | null;
    activityFetchedAt: Date | null;
    dataExpiresAt: Date | null;
  };
  _count?: {
    notes: number;
  };
};

function normalizeProspectResponse(record: ProspectListRow) {
  return {
    id: record.id,
    personId: record.personId,
    status: record.status,
    priority: record.priority,
    lastReviewedAt: record.lastReviewedAt?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    noteCount: record._count?.notes,
    person: {
      id: record.person.id,
      linkedinId: record.person.linkedinId,
      linkedinUrl: record.person.linkedinUrl,
      fullName: record.person.fullName,
      headline: record.person.headline,
      location: record.person.location,
      currentCompany: record.person.currentCompany,
      profilePicUrl: record.person.profilePicUrl,
      activityFetchedAt: record.person.activityFetchedAt?.toISOString() ?? null,
      dataExpiresAt: record.person.dataExpiresAt?.toISOString() ?? null,
    },
  };
}

async function loadOrFetchProfile(linkedinId: string): Promise<ProfileData> {
  const cached = await getCachedFullProfile(linkedinId);
  if (cached) {
    return cached;
  }

  const rawProfile = await fetchLinkedInRawProfile(buildLinkedinUrl(linkedinId));
  const transformed = transformBrightDataProfile(rawProfile);
  try {
    await cacheFullProfile(transformed);
  } catch (error) {
    console.warn('[Prospects API] Failed to cache profile in Redis:', error);
  }
  return transformed;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthenticatedUser();
    if (!auth.ok) return auth.response;

    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get('q')?.trim();
    const status = searchParams.get('status')?.trim();
    const priority = searchParams.get('priority')?.trim();
    const includeSuppressed = searchParams.get('includeSuppressed') === '1';
    const { page, pageSize } = parsePagination(searchParams);

    const suppressions = includeSuppressed
      ? []
      : await prisma.suppression.findMany({
          select: { linkedinUrl: true },
        });

    const suppressedUrls = suppressions.map((item) => item.linkedinUrl);

    const where = {
      ...(status && ALLOWED_STATUSES.has(status) ? { status } : {}),
      ...(priority && ALLOWED_PRIORITIES.has(priority) ? { priority } : {}),
      ...(q
        ? {
            OR: [
              { person: { fullName: { contains: q, mode: 'insensitive' as const } } },
              { person: { headline: { contains: q, mode: 'insensitive' as const } } },
              { person: { currentCompany: { contains: q, mode: 'insensitive' as const } } },
              { person: { linkedinId: { contains: q, mode: 'insensitive' as const } } },
            ],
          }
        : {}),
      ...(suppressedUrls.length > 0
        ? { person: { linkedinUrl: { notIn: suppressedUrls } } }
        : {}),
    };

    const [total, rows] = await Promise.all([
      prisma.prospect.count({ where }),
      prisma.prospect.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          person: true,
          _count: { select: { notes: true } },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      page,
      pageSize,
      total,
      items: rows.map((row) => normalizeProspectResponse(row)),
    });
  } catch (error) {
    console.error('[Prospects API] GET error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to load prospects' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthenticatedUser();
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const linkedinId = typeof body?.linkedinId === 'string' ? body.linkedinId.trim() : '';
    const includeActivity = Boolean(body?.includeActivity);
    const status = parseEnumValue(body?.status, ALLOWED_STATUSES, 'new');
    const priority = parseEnumValue(body?.priority, ALLOWED_PRIORITIES, 'medium');

    if (!linkedinId) {
      return NextResponse.json(
        { success: false, error: 'linkedinId is required' },
        { status: 400 },
      );
    }

    const profile = await loadOrFetchProfile(linkedinId);

    const normalizedPosts = includeActivity ? normalizeLinkedInPosts(profile.linkedinPosts) : [];
    const normalizedActivity = includeActivity
      ? mergeActivityFeeds(
          normalizedPosts,
          normalizeLinkedInActivity(profile.linkedinActivity),
        )
      : [];

    const profileToPersist: ProfileData = {
      ...profile,
      linkedinPosts: includeActivity ? normalizedPosts : undefined,
      linkedinActivity: includeActivity ? normalizedActivity : undefined,
      activityFetchedAt: includeActivity ? new Date().toISOString() : profile.activityFetchedAt,
      dataExpiresAt: computeDataExpiry(30).toISOString(),
    };

    await saveProfile(profileToPersist);

    const savedPerson = await prisma.person.findUnique({
      where: { linkedinId },
      select: { id: true },
    });

    if (!savedPerson) {
      throw new Error('Profile was not persisted');
    }

    const prospect = await prisma.prospect.upsert({
      where: { personId: savedPerson.id },
      update: {
        status,
        priority,
        lastReviewedAt: new Date(),
      },
      create: {
        personId: savedPerson.id,
        status,
        priority,
        lastReviewedAt: new Date(),
      },
      include: {
        person: true,
        _count: { select: { notes: true } },
      },
    });

    return NextResponse.json({
      success: true,
      prospect: normalizeProspectResponse(prospect),
    });
  } catch (error) {
    console.error('[Prospects API] POST error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to save prospect' },
      { status: 500 },
    );
  }
}
