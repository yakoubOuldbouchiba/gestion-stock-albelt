import { useState, useCallback, useEffect } from 'react';
import { PlacedRectangleService } from '../../services/placedRectangleService';
import type { PlacedRectangle } from '../../types';

/**
 * Hook to load placements for a selected roll or waste piece
 */
export function useSourcePlacements(sourceId: string | null, sourceType: 'roll' | 'waste' | null) {
  const [placements, setPlacements] = useState<PlacedRectangle[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadPlacements = useCallback(async () => {
    if (!sourceId || !sourceType) {
      setPlacements([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = sourceType === 'roll'
        ? await PlacedRectangleService.getByRoll(sourceId)
        : await PlacedRectangleService.getByWastePiece(sourceId);

      if (response.success && response.data) {
        setPlacements(Array.isArray(response.data) ? response.data : []);
      } else {
        setPlacements([]);
      }
    } catch (err) {
      console.error('Failed to load source placements:', err);
      setPlacements([]);
    } finally {
      setIsLoading(false);
    }
  }, [sourceId, sourceType]);

  useEffect(() => {
    loadPlacements();
  }, [loadPlacements]);

  return {
    placements,
    isLoading,
    reload: loadPlacements,
  };
}
