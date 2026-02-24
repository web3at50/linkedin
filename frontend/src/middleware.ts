import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getAllowedEmails, getSupabaseConfig } from '@/lib/supabase/config';

function isPublicPath(pathname: string) {
  if (pathname.startsWith('/_next')) return true;
  if (pathname.startsWith('/favicon')) return true;
  if (pathname.startsWith('/public')) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const response = NextResponse.next({ request });

  let config: ReturnType<typeof getSupabaseConfig>;
  try {
    config = getSupabaseConfig();
  } catch (error) {
    console.warn('[Auth Middleware] Supabase config missing, skipping auth guard:', error);
    return response;
  }

  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const allowedEmails = getAllowedEmails();
  const emailAllowed =
    !user?.email ||
    allowedEmails.length === 0 ||
    allowedEmails.includes(user.email.toLowerCase());

  if (pathname === '/login' && (!user || !emailAllowed)) {
    return response;
  }

  if (!user || !emailAllowed) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    if (!pathname.startsWith('/api/')) {
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (pathname === '/login' && user && emailAllowed) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = '/';
    return NextResponse.redirect(homeUrl);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
