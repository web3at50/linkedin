import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthenticatedUser } from '@/lib/auth';

type SuppressionRecord = {
  id: string;
  linkedinUrl: string;
  fullName: string | null;
  reason: string | null;
  source: string;
  createdAt: Date;
  updatedAt: Date;
};

function normalizeSuppression(row: SuppressionRecord) {
  return {
    id: row.id,
    linkedinUrl: row.linkedinUrl,
    fullName: row.fullName,
    reason: row.reason,
    source: row.source,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function GET() {
  try {
    const auth = await requireAuthenticatedUser();
    if (!auth.ok) return auth.response;

    const rows = await prisma.suppression.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, items: rows.map(normalizeSuppression) });
  } catch (error) {
    console.error('[Suppressions API] GET error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to load suppressions' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthenticatedUser();
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const linkedinUrl = typeof body?.linkedinUrl === 'string' ? body.linkedinUrl.trim() : '';
    const fullName = typeof body?.fullName === 'string' ? body.fullName.trim() : undefined;
    const reason = typeof body?.reason === 'string' ? body.reason.trim() : undefined;

    if (!linkedinUrl) {
      return NextResponse.json(
        { success: false, error: 'linkedinUrl is required' },
        { status: 400 },
      );
    }

    const record = await prisma.suppression.upsert({
      where: { linkedinUrl },
      update: {
        fullName: fullName || undefined,
        reason: reason || undefined,
        source: 'manual',
      },
      create: {
        linkedinUrl,
        fullName: fullName || undefined,
        reason: reason || undefined,
        source: 'manual',
      },
    });

    return NextResponse.json({ success: true, item: normalizeSuppression(record) });
  } catch (error) {
    console.error('[Suppressions API] POST error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to save suppression' },
      { status: 500 },
    );
  }
}
