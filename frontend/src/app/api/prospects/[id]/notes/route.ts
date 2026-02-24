import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthenticatedUser } from '@/lib/auth';

type RouteContext = {
  params: Promise<{ id: string }>;
};

type ProspectNoteRecord = {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
};

function normalizeNote(note: ProspectNoteRecord) {
  return {
    id: note.id,
    content: note.content,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  };
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAuthenticatedUser();
    if (!auth.ok) return auth.response;

    const { id } = await context.params;

    const notes = await prisma.prospectNote.findMany({
      where: { prospectId: id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, notes: notes.map(normalizeNote) });
  } catch (error) {
    console.error('[Prospect Notes API] GET error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to load notes' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAuthenticatedUser();
    if (!auth.ok) return auth.response;

    const { id } = await context.params;
    const body = await request.json();
    const content = typeof body?.content === 'string' ? body.content.trim() : '';

    if (!content) {
      return NextResponse.json({ success: false, error: 'content is required' }, { status: 400 });
    }

    const note = await prisma.prospectNote.create({
      data: {
        prospectId: id,
        content,
      },
    });

    return NextResponse.json({ success: true, note: normalizeNote(note) });
  } catch (error) {
    console.error('[Prospect Notes API] POST error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create note' },
      { status: 500 },
    );
  }
}
