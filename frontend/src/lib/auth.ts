import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getAllowedEmails } from '@/lib/supabase/config';

export async function getAuthenticatedUser(): Promise<User | null> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const allowedEmails = getAllowedEmails();
  if (allowedEmails.length > 0) {
    const email = user.email?.toLowerCase();
    if (!email || !allowedEmails.includes(email)) {
      return null;
    }
  }

  return user;
}

export async function requireAuthenticatedUser() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      ),
    };
  }

  return { ok: true as const, user };
}

