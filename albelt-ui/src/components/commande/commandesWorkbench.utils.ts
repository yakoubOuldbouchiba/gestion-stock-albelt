import type { CommandeItem } from '../../types';
import type { WorkbenchItemCounts, WorkbenchOrderMetrics, WorkbenchTagSeverity } from './CommandesWorkbench.types';
import { getArticleMaterialType } from '../../utils/article';

export function getStatusSeverity(status: string): WorkbenchTagSeverity {
  const statusMap: Record<string, WorkbenchTagSeverity> = {
    PENDING: 'warning',
    ENCOURS: 'info',
    COMPLETED: 'success',
    CANCELLED: 'danger',
    ON_HOLD: 'secondary',
    IN_PROGRESS: 'info',
  };

  return statusMap[status] ?? 'contrast';
}

export function getItemCounts(items: CommandeItem[]): WorkbenchItemCounts {
  const totals: WorkbenchItemCounts = {
    total: items.length,
    pending: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
    quantity: 0,
  };

  items.forEach((item) => {
    totals.quantity += item.quantite ?? 0;

    if (item.status === 'PENDING') totals.pending += 1;
    if (item.status === 'IN_PROGRESS') totals.inProgress += 1;
    if (item.status === 'COMPLETED') totals.completed += 1;
    if (item.status === 'CANCELLED') totals.cancelled += 1;
  });

  return totals;
}

export function getProgressPct(items: CommandeItem[]) {
  if (!items.length) {
    return 0;
  }

  const completed = items.filter((item) => item.status === 'COMPLETED').length;
  return Math.round((completed / items.length) * 100);
}

export function getNextActionItem(items: CommandeItem[]) {
  return (
    items.find((item) => item.status === 'IN_PROGRESS') ??
    items.find((item) => item.status === 'PENDING') ??
    items[0]
  );
}

export function getPrimaryMaterial(items: CommandeItem[]) {
  const materialCount = new Map<string, number>();

  items.forEach((item) => {
    const key = getArticleMaterialType(item) || 'Unknown';
    materialCount.set(key, (materialCount.get(key) ?? 0) + 1);
  });

  let bestMaterial = '';
  let bestCount = 0;

  materialCount.forEach((count, material) => {
    if (count > bestCount) {
      bestMaterial = material;
      bestCount = count;
    }
  });

  return bestMaterial;
}

export function getOrderMetrics(items: CommandeItem[]): WorkbenchOrderMetrics {
  return {
    counts: getItemCounts(items),
    progress: getProgressPct(items),
    nextItem: getNextActionItem(items),
    primaryMaterial: getPrimaryMaterial(items),
  };
}
