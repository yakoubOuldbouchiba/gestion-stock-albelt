import { formatDate } from '../utils/date';
import type { PurchaseBonItemRequest } from '../types/index';

export function toArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data;

  const maybePaged = data as { items?: T[]; content?: T[] } | null;
  return maybePaged?.items ?? maybePaged?.content ?? [];
}

export function formatDateInput(date: Date | null) {
  if (!date) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateInput(value: string) {
  return value ? new Date(`${value}T00:00:00`) : null;
}

export function formatPurchaseDate(value: unknown) {
  return formatDate(value as any);
}

export function computeAreaM2(widthMm: number, lengthMm: number) {
  // Both dimensions now in mm, convert to m² by dividing by 1,000,000
  return parseFloat(((widthMm * lengthMm) / 1_000_000).toFixed(4));
}

export function buildNextItemForm(itemForm: PurchaseBonItemRequest): PurchaseBonItemRequest {
  return {
    materialType: itemForm.materialType,
    nbPlis: itemForm.nbPlis,
    thicknessMm: itemForm.thicknessMm,
    widthMm: itemForm.widthMm,
    lengthMm: itemForm.lengthMm,
    areaM2: itemForm.areaM2,
    quantity: 1,
    colorId: itemForm.colorId,
    altierId: itemForm.altierId,
    qrCode: ''
  };
}

export function getDimensionsLabel(item: {
  widthMm: number;
  lengthMm: number;
  areaM2: number;
}) {
  return `${item.widthMm} x ${item.lengthMm} mm (${item.areaM2} m²)`;
}
