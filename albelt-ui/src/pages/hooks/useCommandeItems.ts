import { useCallback, useMemo, useState } from 'react';
import type { CommandeItemRequest } from '../../types';

export function calculateSurfaceM2(item: { longueurM: number; largeurMm: number }): number {
  return (item.longueurM * item.largeurMm) / 1000;
}

export function calculateTotalSurfaceM2(item: { longueurM: number; largeurMm: number; quantite: number }): number {
  return calculateSurfaceM2(item) * item.quantite;
}

export function createDefaultCommandeItem(lineNumber: number): CommandeItemRequest {
  const longueurM = 5;
  const largeurMm = 1000;
  return {
    materialType: 'PU',
    nbPlis: 1,
    thicknessMm: 2.5,
    longueurM,
    longueurToleranceM: 0,
    largeurMm,
    quantite: 1,
    surfaceConsommeeM2: calculateSurfaceM2({ longueurM, largeurMm }),
    typeMouvement: 'COUPE',
    reference: '',
    colorId: undefined,
    lineNumber,
  };
}

type BaseCommandeItem = CommandeItemRequest & { id?: string };

interface UseCommandeItemsOptions<TItem extends BaseCommandeItem> {
  initialItems?: TItem[];
  preserveLineNumbers?: boolean;
  createItem?: (lineNumber: number) => TItem;
}

export function useCommandeItems<TItem extends BaseCommandeItem>({
  initialItems,
  preserveLineNumbers = false,
  createItem,
}: UseCommandeItemsOptions<TItem>) {
  const [items, setItems] = useState<TItem[]>(initialItems ?? []);

  const updateItem = useCallback((index: number, field: keyof TItem, value: unknown) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }, []);

  const getNextLineNumber = useCallback(
    (currentItems: TItem[]) => {
      if (!preserveLineNumbers) {
        return currentItems.length + 1;
      }
      const maxLine = currentItems.reduce((max, item) => Math.max(max, item.lineNumber || 0), 0);
      return maxLine + 1;
    },
    [preserveLineNumbers]
  );

  const addItem = useCallback(() => {
    setItems((prev) => {
      const nextLineNumber = getNextLineNumber(prev);
      const makeItem = createItem ?? (createDefaultCommandeItem as unknown as (lineNumber: number) => TItem);
      return [...prev, makeItem(nextLineNumber)];
    });
  }, [createItem, getNextLineNumber]);

  const removeItem = useCallback(
    (index: number) => {
      setItems((prev) => {
        const filtered = prev.filter((_, i) => i !== index);
        if (preserveLineNumbers) {
          return filtered;
        }
        return filtered.map((item, idx) => ({ ...item, lineNumber: idx + 1 }));
      });
    },
    [preserveLineNumbers]
  );

  const summary = useMemo(() => {
    const totalItems = items.length;
    const totalQuantity = items.reduce((sum, item) => sum + (item.quantite || 0), 0);
    const totalSurfaceM2 = items.reduce((sum, item) => sum + calculateSurfaceM2(item), 0);
    return { totalItems, totalQuantity, totalSurfaceM2 };
  }, [items]);

  return {
    items,
    setItems,
    updateItem,
    addItem,
    removeItem,
    summary,
  };
}

