'use client';

import type { ComponentProps } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { currentPath, withNext } from '@/lib/utils/safe-next';

type AuthLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & {
  page: '/login' | '/register';
};

/**
 * Link to login/register that brings the visitor back to the current page
 * afterwards. The href uses the pathname (stable between server and client);
 * a plain click also carries the query string (filters, search…).
 */
export function AuthLink({ page, onClick, ...props }: AuthLinkProps) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <Link
      {...props}
      href={withNext(page, pathname)}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        router.push(withNext(page, currentPath()));
      }}
    />
  );
}
