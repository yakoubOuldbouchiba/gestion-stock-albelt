import { useCallback, useRef, useState } from 'react';

type LockMap = Record<string, boolean>;

export function useAsyncLock() {
  const [locks, setLocks] = useState<LockMap>({});
  const locksRef = useRef<LockMap>({});

  const setLock = useCallback((key: string, value: boolean) => {
    setLocks((prev) => {
      const next = { ...prev, [key]: value };
      locksRef.current = next;
      return next;
    });
  }, []);

  const isLocked = useCallback((key?: string) => {
    const current = locksRef.current;
    if (!key) {
      return Object.values(current).some(Boolean);
    }
    return !!current[key];
  }, []);

  const run = useCallback(
    async <T,>(fn: () => Promise<T>, key = 'default'): Promise<T | undefined> => {
      if (locksRef.current[key]) {
        return;
      }
      setLock(key, true);
      try {
        return await fn();
      } finally {
        setLock(key, false);
      }
    },
    [setLock]
  );

  return { run, isLocked, locks };
}
