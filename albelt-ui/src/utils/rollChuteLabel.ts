export type RollChuteLike = {
  lotId?: number | null;
  reference?: string | null;
  nbPlis?: number | null;
  thicknessMm?: number | null;
  colorName?: string | null;
  colorHexCode?: string | null;
};

const normalizeReference = (reference?: string | null) => {
  const trimmed = reference?.trim();
  return trimmed ? trimmed : 'N/A';
};

export const getRollChuteSummary = (item: RollChuteLike) => {
  const lotIdValue = item.lotId ?? null;
  const reference = normalizeReference(item.reference);
  const nbPlisValue = item.nbPlis ?? null;
  const thicknessValue = item.thicknessMm ?? null;
  const lotId = lotIdValue === null ? 'N/A' : String(lotIdValue);
  const nbPlis = nbPlisValue === null ? 'N/A' : String(nbPlisValue);
  const thickness = thicknessValue === null ? 'N/A' : `${thicknessValue}mm`;
  const color = item.colorName || item.colorHexCode || 'N/A';

  return { lotId, reference, nbPlis, thickness, color };
};

export const formatRollChuteLabel = (item: RollChuteLike) => {
  const summary = getRollChuteSummary(item);
  return `Lot: ${summary.lotId} | Ref: ${summary.reference} | Plis: ${summary.nbPlis} | Thk: ${summary.thickness} | Color: ${summary.color}`;
};
