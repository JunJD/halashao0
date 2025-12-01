import { useMemo } from 'react';
import { useRouter } from 'next/router';

export function useSearchParams(): readonly [URLSearchParams, (init: unknown) => void] {
  const router = useRouter();
  const params = useMemo(() => {
    const queryString = (router.asPath.split('?')[1] || '').split('#')[0];
    return new URLSearchParams(queryString);
  }, [router.asPath]);

  // placeholder setter for compatibility; no-op for now
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const setSearchParams = (_init: unknown) => {};

  return [params, setSearchParams] as const;
}

