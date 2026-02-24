'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export function SignOutButton() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSignOut() {
    setIsSubmitting(true);
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
      router.replace('/login');
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleSignOut} disabled={isSubmitting}>
      <LogOut className="mr-2 h-4 w-4" />
      {isSubmitting ? 'Signing out...' : 'Sign out'}
    </Button>
  );
}

