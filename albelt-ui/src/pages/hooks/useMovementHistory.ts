import { useCallback, useEffect, useState } from 'react';
import rollMovementService, { type RollMovement } from '../../services/rollMovementService';

type MovementSource =
  | { type: 'ROLL'; id: string }
  | { type: 'WASTE_PIECE'; id: string };

interface UseMovementHistoryOptions {
  source: MovementSource | null;
  t: (key: string) => string;
}

export function useMovementHistory({ source, t }: UseMovementHistoryOptions) {
  const [movements, setMovements] = useState<RollMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!source) return;
    try {
      setLoading(true);
      const res =
        source.type === 'ROLL'
          ? await rollMovementService.getRollMovementHistory(source.id)
          : await rollMovementService.getWastePieceMovementHistory(source.id);
      if (res.success && res.data) {
        setMovements(res.data.items ?? []);
        setError(null);
      } else {
        setMovements([]);
        setError(res.message || t('rollMovement.failedToLoadData'));
      }
    } catch (err) {
      console.error('Failed to load movement history:', err);
      setMovements([]);
      setError(t('rollMovement.failedToLoadData'));
    } finally {
      setLoading(false);
    }
  }, [source, t]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { movements, loading, error, refresh, setError };
}

export default useMovementHistory;

