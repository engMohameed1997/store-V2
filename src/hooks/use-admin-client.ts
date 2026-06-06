'use client';

import { useMemo } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { createAdminClient } from '@/lib/client/admin';

export function useAdminClient() {
  const { accessToken } = useAuth();

  return useMemo(() => {
    if (!accessToken) return null;
    return createAdminClient(accessToken);
  }, [accessToken]);
}
