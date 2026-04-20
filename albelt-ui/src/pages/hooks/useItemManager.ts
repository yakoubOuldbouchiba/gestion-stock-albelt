import { useState, useEffect, useCallback, useRef } from 'react';
import { WastePieceService } from '../../services/wastePieceService';
import { ProductionItemService } from '../../services/productionItemService';
import { PlacedRectangleService } from '../../services/placedRectangleService';
import { CommandeService } from '../../services/commandeService';
import { RollService } from '../../services/rollService';
import type { 
  ProductionItem, 
  PlacedRectangle, 
  OptimizationComparison, 
  Roll 
} from '../../types';
import { useI18n } from '@hooks/useI18n';

export function useItemManager(selectedItemId: string | null) {
  const { t } = useI18n();
  const [wasteForItem, setWasteForItem] = useState<any[]>([]);
  const [productionForItem, setProductionForItem] = useState<ProductionItem[]>([]);
  const [placementsForItem, setPlacementsForItem] = useState<PlacedRectangle[]>([]);
  const [optimizationComparison, setOptimizationComparison] = useState<OptimizationComparison | null>(null);
  const [optimizationLoading, setOptimizationLoading] = useState(false);
  const [optimizationError, setOptimizationError] = useState<string | null>(null);
  const optimizationRequestRef = useRef(0);

  const [rollsByMaterial, setRollsByMaterial] = useState<Record<string, Roll[]>>({});
  const [rollsLoadingByMaterial, setRollsLoadingByMaterial] = useState<Record<string, boolean>>({});

  const loadWasteForItem = useCallback(async (itemId: string) => {
    try {
      const response = await WastePieceService.getByCommandeItem(itemId);
      if (response.data) {
        setWasteForItem(response.data);
      }
    } catch (err) {
      console.error('Error loading waste:', err);
    }
  }, []);

  const loadProductionForItem = useCallback(async (itemId: string) => {
    try {
      const response = await ProductionItemService.getByCommandeItemId(itemId);
      if (response.data) {
        const items = Array.isArray(response.data) ? response.data : [];
        setProductionForItem(items);
      } else {
        setProductionForItem([]);
      }
    } catch (err) {
      console.error('Error loading production items:', err);
      setProductionForItem([]);
    }
  }, []);

  const loadPlacementsForItem = useCallback(async (itemId: string) => {
    try {
      const response = await PlacedRectangleService.getByCommandeItem(itemId);
      if (response.data) {
        const items = Array.isArray(response.data) ? response.data : [];
        setPlacementsForItem(items);
      } else {
        setPlacementsForItem([]);
      }
    } catch (err) {
      console.error('Error loading placements:', err);
      setPlacementsForItem([]);
    }
  }, []);

  const loadOptimizationForItem = useCallback(async (itemId: string, forceRegenerate = false) => {
    const requestId = optimizationRequestRef.current + 1;
    optimizationRequestRef.current = requestId;
    setOptimizationLoading(true);
    setOptimizationError(null);
    try {
      const response = forceRegenerate
        ? await CommandeService.regenerateOptimization(itemId)
        : await CommandeService.getOptimizationComparison(itemId);

      if (optimizationRequestRef.current !== requestId) {
        return;
      }

      if (response.data) {
        setOptimizationComparison(response.data);
      } else {
        setOptimizationComparison(null);
      }
    } catch (err) {
      if (optimizationRequestRef.current !== requestId) {
        return;
      }
      console.error('Error loading optimization comparison:', err);
      setOptimizationError(t('messages.failedToLoad'));
      setOptimizationComparison(null);
    } finally {
      if (optimizationRequestRef.current === requestId) {
        setOptimizationLoading(false);
      }
    }
  }, [t]);

  const ensureRollsForMaterial = useCallback(async (materialType?: string) => {
    if (!materialType) return;
    if ((rollsByMaterial[materialType] || []).length > 0) return;
    if (rollsLoadingByMaterial[materialType]) return;

    setRollsLoadingByMaterial((prev) => ({ ...prev, [materialType]: true }));
    try {
      const response = await RollService.getAvailableByMaterial(materialType as any);
      if (response.success && response.data) {
        setRollsByMaterial((prev) => ({ ...prev, [materialType]: response.data || [] }));
      } else {
        setRollsByMaterial((prev) => ({ ...prev, [materialType]: [] }));
      }
    } catch (err) {
      console.error('Error loading rolls:', err);
      setRollsByMaterial((prev) => ({ ...prev, [materialType]: [] }));
    } finally {
      setRollsLoadingByMaterial((prev) => ({ ...prev, [materialType]: false }));
    }
  }, [rollsByMaterial, rollsLoadingByMaterial]);

  useEffect(() => {
    if (!selectedItemId) {
      setWasteForItem([]);
      setProductionForItem([]);
      setPlacementsForItem([]);
      setOptimizationComparison(null);
      setOptimizationError(null);
      return;
    }

    loadWasteForItem(selectedItemId);
    loadProductionForItem(selectedItemId);
    loadPlacementsForItem(selectedItemId);
    loadOptimizationForItem(selectedItemId);
  }, [selectedItemId, loadWasteForItem, loadProductionForItem, loadPlacementsForItem, loadOptimizationForItem]);

  return {
    wasteForItem,
    productionForItem,
    placementsForItem,
    optimizationComparison,
    optimizationLoading,
    optimizationError,
    rollsByMaterial,
    rollsLoadingByMaterial,
    loadWasteForItem,
    loadProductionForItem,
    loadPlacementsForItem,
    loadOptimizationForItem,
    ensureRollsForMaterial,
  };
}
