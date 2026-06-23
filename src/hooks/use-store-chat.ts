'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

export function useStoreChat() {
  const pathname = usePathname();

  const currentPage = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) return 'home';
    return segments[0];
  }, [pathname]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/v1/chat',
        credentials: 'include',
        prepareSendMessagesRequest: ({ messages, body }) => ({
          body: { ...body, messages, currentPage },
        }),
      }),
    [currentPage]
  );

  return useChat({ transport });
}
