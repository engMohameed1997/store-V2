'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';

export function useStoreChat() {
  const pathname = usePathname();
  // Daily messages left, reported by the server in X-Chat-Remaining.
  const [remaining, setRemaining] = useState<number | null>(null);

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
        fetch: async (input, init) => {
          const res = await fetch(input, init);
          const left = res.headers.get('X-Chat-Remaining');
          if (left !== null && left !== '') setRemaining(Number(left));
          return res;
        },
      }),
    [currentPage]
  );

  const chat = useChat({ transport });
  return { ...chat, remaining };
}
