import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthenticatedUser } from '@/lib/auth';

const ALLOWED_STATUSES = new Set(['new', 'reviewing', 'ready_to_contact', 'contacted', 'not_relevant']);
const ALLOWED_PRIORITIES = new Set(['low', 'medium', 'high']);

type RouteContext = {
  params: Promise<{ id: string }>;
};

type ProspectNoteRecord = {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
};

type ProspectDetailRecord = {
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
    firstName: string;
    lastName: string;
    headline: string | null;
    about: string | null;
    location: string | null;
    city: string | null;
    countryCode: string | null;
    profilePicUrl: string | null;
    currentCompany: string | null;
    connections: number | null;
    followers: number | null;
    linkedinPosts: unknown;
    linkedinActivity: unknown;
    activityFetchedAt: Date | null;
    dataExpiresAt: Date | null;
  } | null;
  notes?: ProspectNoteRecord[];
};

function normalizeProspect(row: ProspectDetailRecord) {
  return {
    id: row.id,
    personId: row.personId,
    status: row.status,
    priority: row.priority,
    lastReviewedAt: row.lastReviewedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    person: row.person
      ? {
          id: row.person.id,
          linkedinId: row.person.linkedinId,
          linkedinUrl: row.person.linkedinUrl,
          fullName: row.person.fullName,
          firstName: row.person.firstName,
          lastName: row.person.lastName,
          headline: row.person.headline,
          about: row.person.about,
          location: row.person.location,
          city: row.person.city,
          countryCode: row.person.countryCode,
          profilePicUrl: row.person.profilePicUrl,
          currentCompany: row.person.currentCompany,
          connections: row.person.connections,
          followers: row.person.followers,
          linkedinPosts: row.person.linkedinPosts,
          linkedinActivity: row.person.linkedinActivity,
          activityFetchedAt: row.person.activityFetchedAt?.toISOString() ?? null,
          dataExpiresAt: row.person.dataExpiresAt?.toISOString() ?? null,
        }
      : null,
    notes: Array.isArray(row.notes)
      ? row.notes.map((note) => ({
          id: note.id,
          content: note.content,
          createdAt: note.createdAt.toISOString(),
          updatedAt: note.updatedAt.toISOString(),
        }))
      : undefined,
  };
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAuthenticatedUser();
    if (!auth.ok) return auth.response;

    const { id } = await context.params;

    const prospect = await prisma.prospect.findUnique({
      where: { id },
      include: {
        person: true,
        notes: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!prospect) {
      return NextResponse.json({ success: false, error: 'Prospect not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, prospect: normalizeProspect(prospect) });
  } catch (error) {
    console.error('[Prospect API] GET error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to load prospect' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAuthenticatedUser();
    if (!auth.ok) return auth.response;

    const { id } = await context.params;
    const body = await request.json();
    const status = typeof body?.status === 'string' ? body.status : undefined;
    const priority = typeof body?.priority === 'string' ? body.priority : undefined;

    if (!status && !priority) {
      return NextResponse.json(
        { success: false, error: 'status or priority is required' },
        { status: 400 },
      );
    }

    if (status && !ALLOWED_STATUSES.has(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
    }

    if (priority && !ALLOWED_PRIORITIES.has(priority)) {
      return NextResponse.json({ success: false, error: 'Invalid priority' }, { status: 400 });
    }

    const updated = await prisma.prospect.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(priority ? { priority } : {}),
        lastReviewedAt: new Date(),
      },
      include: {
        person: true,
        notes: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });

    return NextResponse.json({ success: true, prospect: normalizeProspect(updated) });
  } catch (error) {
    console.error('[Prospect API] PATCH error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update prospect' },
      { status: 500 },
    );
  }
}
