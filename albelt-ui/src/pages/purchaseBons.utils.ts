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

export function computeAreaM2(widthMm: number, lengthM: number) {
  const widthM = widthMm / 1000;
  return parseFloat((widthM * lengthM).toFixed(4));
}

export function buildNextItemForm(itemForm: PurchaseBonItemRequest): PurchaseBonItemRequest {
  return {
    materialType: itemForm.materialType,
    nbPlis: itemForm.nbPlis,
    thicknessMm: itemForm.thicknessMm,
    widthMm: itemForm.widthMm,
    lengthM: itemForm.lengthM,
    areaM2: itemForm.areaM2,
    quantity: 1,
    colorId: itemForm.colorId,
    altierId: itemForm.altierId,
    qrCode: ''
  };
}

export function getDimensionsLabel(item: {
  widthMm: number;
  lengthM: number;
  areaM2: number;
}) {
  return `${item.widthMm} x ${item.lengthM} (${item.areaM2} m2)`;
}
