'use client';

import { useMemo } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { createAdminClient } from '@/lib/client/admin';

export function useAdminClient() {
  const { isAuthenticated } = useAuth();

  return useMemo(() => {
    if (!isAuthenticated) return null;
    return createAdminClient();
  }, [isAuthenticated]);
}
