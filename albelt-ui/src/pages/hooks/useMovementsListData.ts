import { useCallback, useEffect, useMemo, useState } from 'react';
import rollMovementService, { type RollMovement } from '../../services/rollMovementService';

function dedupeById(items: RollMovement[]): RollMovement[] {
  const seen = new Set<string>();
  const out: RollMovement[] = [];
  for (const item of items) {
    if (!item?.id) continue;
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

interface UseMovementsListDataOptions {
  altierIds: string[];
  t: (key: string) => string;
}

export function useMovementsListData({ altierIds, t }: UseMovementsListDataOptions) {
  const [createdMovements, setCreatedMovements] = useState<RollMovement[]>([]);
  const [pendingMovements, setPendingMovements] = useState<RollMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!altierIds?.length) {
      setLoading(false);
      setCreatedMovements([]);
      setPendingMovements([]);
      setError(t('movementsList.userAltierNotAvailable'));
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const createdResults = await Promise.all(
        altierIds.map((altierID) => rollMovementService.getMovementsFromAltier(altierID, 0, 50, { excludeBon: true }))
      );
      const created = createdResults.flatMap((res) => (res.success && res.data ? res.data.items ?? [] : []));
      const createdDeduped = dedupeById(created).sort((a, b) => String(b.dateSortie).localeCompare(String(a.dateSortie)));
      setCreatedMovements(createdDeduped);

      const pendingResults = await Promise.all(
        altierIds.map((altierID) => rollMovementService.getPendingReceiptsByAltier(altierID, 0, 50, { excludeBon: true }))
      );
      const pending = pendingResults.flatMap((res) => (res.success && res.data ? res.data.items ?? [] : []));
      const pendingDeduped = dedupeById(pending).sort((a, b) => String(b.dateSortie).localeCompare(String(a.dateSortie)));
      setPendingMovements(pendingDeduped);
    } catch (err) {
      console.error('Error loading movements list:', err);
      setError(t('movementsList.failedToLoad'));
      setCreatedMovements([]);
      setPendingMovements([]);
    } finally {
      setLoading(false);
    }
  }, [altierIds, t]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const summary = useMemo(() => {
    return {
      createdCount: createdMovements.length,
      pendingCount: pendingMovements.length,
    };
  }, [createdMovements.length, pendingMovements.length]);

  return {
    createdMovements,
    pendingMovements,
    loading,
    error,
    setError,
    refresh,
    summary,
  };
}

export default useMovementsListData;

