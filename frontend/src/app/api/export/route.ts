import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthenticatedUser } from '@/lib/auth';

function csvCell(value: unknown): string {
  const text = value == null ? '' : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
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

    const suppressedUrls = includeSuppressed
      ? []
      : (
          await prisma.suppression.findMany({
            select: { linkedinUrl: true },
          })
        ).map((row) => row.linkedinUrl);

    const prospects = await prisma.prospect.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(priority ? { priority } : {}),
        ...(q
          ? {
              OR: [
                { person: { fullName: { contains: q, mode: 'insensitive' } } },
                { person: { headline: { contains: q, mode: 'insensitive' } } },
                { person: { currentCompany: { contains: q, mode: 'insensitive' } } },
              ],
            }
          : {}),
        ...(suppressedUrls.length > 0
          ? { person: { linkedinUrl: { notIn: suppressedUrls } } }
          : {}),
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        person: true,
        _count: { select: { notes: true } },
      },
    });

    const headers = [
      'prospect_id',
      'full_name',
      'headline',
      'location',
      'company',
      'linkedin_url',
      'status',
      'priority',
      'activity_fetched_at',
      'data_expires_at',
      'note_count',
      'created_at',
      'updated_at',
    ];

    const lines = [
      headers.join(','),
      ...prospects.map((row) =>
        [
          row.id,
          row.person.fullName,
          row.person.headline ?? '',
          row.person.location ?? '',
          row.person.currentCompany ?? '',
          row.person.linkedinUrl,
          row.status,
          row.priority,
          row.person.activityFetchedAt?.toISOString() ?? '',
          row.person.dataExpiresAt?.toISOString() ?? '',
          row._count.notes,
          row.createdAt.toISOString(),
          row.updatedAt.toISOString(),
        ]
          .map(csvCell)
          .join(','),
      ),
    ];

    return new NextResponse(lines.join('\n'), {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="prospects-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error('[Export API] GET error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to export CSV' },
      { status: 500 },
    );
  }
}

