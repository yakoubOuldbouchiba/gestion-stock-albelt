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
  const [availableWasteByArticle, setAvailableWasteByArticle] = useState<Record<string, any[]>>({});
  const [wasteLoadingByArticle, setWasteLoadingByArticle] = useState<Record<string, boolean>>({});
  const [productionForItem, setProductionForItem] = useState<ProductionItem[]>([]);
  const [placementsForItem, setPlacementsForItem] = useState<PlacedRectangle[]>([]);
  const [optimizationComparison, setOptimizationComparison] = useState<OptimizationComparison | null>(null);
  const [optimizationLoading, setOptimizationLoading] = useState(false);
  const [optimizationError, setOptimizationError] = useState<string | null>(null);
  const [optimizationMode, setOptimizationMode] = useState<'load' | 'regenerate'>('load');
  const optimizationRequestRef = useRef(0);

  const [rollsByArticle, setRollsByArticle] = useState<Record<string, Roll[]>>({});
  const [rollsLoadingByArticle, setRollsLoadingByArticle] = useState<Record<string, boolean>>({});

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
    setOptimizationMode(forceRegenerate ? 'regenerate' : 'load');
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

  const ensureRollsForArticle = useCallback(async (articleId?: string | null) => {
    if (!articleId) return;
    if ((rollsByArticle[articleId] || []).length > 0) return;
    if (rollsLoadingByArticle[articleId]) return;

    setRollsLoadingByArticle((prev) => ({ ...prev, [articleId]: true }));
    try {
      const response = await RollService.getAvailableByArticle(articleId);
      if (response.success && response.data) {
        setRollsByArticle((prev) => ({ ...prev, [articleId]: response.data || [] }));
      } else {
        setRollsByArticle((prev) => ({ ...prev, [articleId]: [] }));
      }
    } catch (err) {
      console.error('Error loading rolls:', err);
      setRollsByArticle((prev) => ({ ...prev, [articleId]: [] }));
    } finally {
      setRollsLoadingByArticle((prev) => ({ ...prev, [articleId]: false }));
    }
  }, [rollsByArticle, rollsLoadingByArticle]);

  const ensureWasteForArticle = useCallback(async (articleId?: string | null) => {
    if (!articleId) return;
    if ((availableWasteByArticle[articleId] || []).length > 0) return;
    if (wasteLoadingByArticle[articleId]) return;

    setWasteLoadingByArticle((prev) => ({ ...prev, [articleId]: true }));
    try {
      const response = await WastePieceService.getAvailableByArticle(articleId, 0, 200);
      setAvailableWasteByArticle((prev) => ({ ...prev, [articleId]: response.data || [] }));
    } catch (err) {
      console.error('Error loading article waste:', err);
      setAvailableWasteByArticle((prev) => ({ ...prev, [articleId]: [] }));
    } finally {
      setWasteLoadingByArticle((prev) => ({ ...prev, [articleId]: false }));
    }
  }, [availableWasteByArticle, wasteLoadingByArticle]);

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
    optimizationMode,
    availableWasteByArticle,
    rollsByArticle,
    rollsLoadingByArticle,
    wasteLoadingByArticle,
    loadWasteForItem,
    loadProductionForItem,
    loadPlacementsForItem,
    loadOptimizationForItem,
    ensureWasteForArticle,
    ensureRollsForArticle,
  };
}
