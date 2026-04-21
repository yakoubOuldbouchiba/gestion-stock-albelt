import { formatDateTime } from '../utils/date';
import type { Roll, RollMovement, TransferBon, WastePiece } from '../types/index';
import { formatRollChuteLabel } from '@utils/rollChuteLabel';

export type TransferBonDetails = TransferBon & { movements?: RollMovement[] };
export type LoadMode = 'replace' | 'append';

export const SOURCE_PAGE_SIZE = 24;

export function getCurrentDateTimeLocal() {
  return new Date().toISOString().slice(0, 16);
}

export function formatDateTimeLocalValue(date: Date | null) {
  if (!date) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function parseDateTimeLocalValue(value: string) {
  return value ? new Date(value) : null;
}

export function toArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data;

  const maybePaged = data as { items?: T[]; content?: T[] } | null;
  return maybePaged?.items ?? maybePaged?.content ?? [];
}

export function formatTransferDate(dateValue: unknown) {
  if (!dateValue) return '-';

  if (Array.isArray(dateValue)) {
    const [year, month, day, hour, minute] = dateValue;
    return formatDateTime(new Date(year, month - 1, day, hour, minute));
  }

  if (typeof dateValue === 'string' || typeof dateValue === 'number' || dateValue instanceof Date) {
    return formatDateTime(dateValue);
  }

  return '-';
}

export function formatDateTimeToISO(dateStr: string) {
  if (!dateStr) return '';
  return `${dateStr}:00.000Z`;
}

export function mergeById<T extends { id: string }>(current: T[], next: T[]) {
  const map = new Map<string, T>();

  [...current, ...next].forEach((item) => {
    map.set(item.id, item);
  });

  return Array.from(map.values());
}

export function shrinkId(value: string) {
  return value ? `${value.slice(0, 8)}...` : '-';
}

export function matchesSearch(search: string, values: Array<string | number | undefined | null>) {
  const query = search.trim().toLowerCase();
  if (!query) return true;

  return values.some((value) => String(value || '').toLowerCase().includes(query));
}

export function getMovementDisplay(movement: RollMovement, roll?: Roll, wastePiece?: WastePiece) {
  const label = roll ? formatRollChuteLabel(roll) : wastePiece ? formatRollChuteLabel(wastePiece) : '';
  const type = movement.rollId ? 'roll' : movement.wastePieceId ? 'wastePiece' : 'unknown';
  const fallbackId = movement.rollId || movement.wastePieceId || '';

  return {
    fallbackId,
    label,
    type,
  };
}
