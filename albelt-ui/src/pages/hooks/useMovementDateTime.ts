export function formatDateTimeLocal(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

export function nowDateTimeLocal(): string {
  return formatDateTimeLocal(new Date());
}

export function dateTimeLocalToIso(dateTimeLocal: string): string {
  if (!dateTimeLocal) return '';
  const date = new Date(dateTimeLocal);
  return date.toISOString();
}

export function isoToDateTimeLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  return formatDateTimeLocal(date);
}

