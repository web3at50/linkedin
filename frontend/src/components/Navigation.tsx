'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ListChecks, ShieldBan } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SignOutButton } from '@/components/SignOutButton';

const navItems = [
  { name: 'Search', href: '/', icon: Home },
  { name: 'Prospects', href: '/prospects', icon: ListChecks },
  { name: 'Suppression', href: '/suppression', icon: ShieldBan },
];

export function Navigation() {
  const pathname = usePathname();
  const isLogin = pathname === '/login';

  if (isLogin) return null;

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-sm font-semibold tracking-tight text-slate-900">
            LinkedIn Activity Tool
          </Link>

          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/'
                  ? pathname === '/' || pathname === '/search'
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <SignOutButton />
      </div>
    </nav>
  );
}
