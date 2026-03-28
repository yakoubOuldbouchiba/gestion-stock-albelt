type DateInput = string | number | Date | null | undefined | any[];

const parseDate = (value?: DateInput): Date | null => {
  if (!value) return null;

  if (Array.isArray(value)) {
    const [year, month, day, hour = 0, minute = 0, second = 0] = value;
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day, hour, minute, second);
  }

  const date = new Date(value as string | number | Date);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatDate = (value?: DateInput, fallback = '-'): string => {
  const date = parseDate(value);
  return date ? date.toLocaleDateString() : fallback;
};

export const formatDateTime = (value?: DateInput, fallback = '-'): string => {
  const date = parseDate(value);
  return date ? date.toLocaleString() : fallback;
};
