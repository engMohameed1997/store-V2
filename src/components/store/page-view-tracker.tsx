'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';

export default function PageViewTracker() {
  const pathname = usePathname();
  const { user } = useAuth();

  useEffect(() => {
    if (!pathname) return;

    // Fire-and-forget pageview tracking request
    fetch('/api/v1/analytics/pageview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: pathname,
        userId: user?.id || null,
      }),
    }).catch(() => {
      // Silently ignore tracking errors
    });
  }, [pathname, user]);

  return null;
}
