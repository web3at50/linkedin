import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthenticatedUser } from '@/lib/auth';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAuthenticatedUser();
    if (!auth.ok) return auth.response;

    const { id } = await context.params;
    await prisma.suppression.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Suppression API] DELETE error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete suppression' },
      { status: 500 },
    );
  }
}

