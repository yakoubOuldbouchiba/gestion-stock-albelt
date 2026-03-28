import { useEffect, useMemo, useState } from 'react';
import type { MaterialChuteThreshold, MaterialType } from '../types/index';
import { MaterialChuteThresholdService } from '@services/materialChuteThresholdService';
import { useI18n } from '@hooks/useI18n';
import '../styles/MaterialChuteThresholdsPage.css';

const MATERIAL_TYPES: MaterialType[] = ['PU', 'PVC', 'CAOUTCHOUC'];

type EditableRow = Pick<
  MaterialChuteThreshold,
  'materialType' | 'minWidthMm' | 'minLengthM'
>;

const createDefaultRow = (materialType: MaterialType): EditableRow => ({
  materialType,
  minWidthMm: 0,
  minLengthM: 0,
});

export function MaterialChuteThresholdsPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<EditableRow[]>(MATERIAL_TYPES.map(createDefaultRow));
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const rowsByType = useMemo(() => {
    const map = new Map<MaterialType, EditableRow>();
    rows.forEach(r => map.set(r.materialType, r));
    return map;
  }, [rows]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await MaterialChuteThresholdService.getAll();
      if (!response.success || !response.data) {
        setError(response.message || t('materialChuteThresholds.failedToLoad'));
        return;
      }

      const normalized: EditableRow[] = MATERIAL_TYPES.map((type) => {
        const found = response.data!.find(t => t.materialType === type);
        return found
          ? {
              materialType: found.materialType,
              minWidthMm: Number(found.minWidthMm ?? 0),
              minLengthM: Number(found.minLengthM ?? 0),
            }
          : createDefaultRow(type);
      });
      setRows(normalized);
    } catch (e) {
      console.error(e);
      setError(t('materialChuteThresholds.failedToLoad'));
    } finally {
      setIsLoading(false);
    }
  };

  const updateRow = (materialType: MaterialType, patch: Partial<EditableRow>) => {
    setRows(prev =>
      prev.map(r => (r.materialType === materialType ? { ...r, ...patch } : r))
    );
  };

  const parseIntSafe = (value: string) => {
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const parseFloatSafe = (value: string) => {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const validateAll = (): string | null => {
    for (const type of MATERIAL_TYPES) {
      const row = rowsByType.get(type) || createDefaultRow(type);
      if (row.minWidthMm < 0 || row.minLengthM < 0) {
        return t('materialChuteThresholds.invalidValues', { type });
      }
    }
    return null;
  };

  const saveAll = async () => {
    setError(null);
    setMessage(null);

    const validationError = validateAll();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    try {
      const response = await MaterialChuteThresholdService.upsertAll(rows);
      if (!response.success) {
        setError(response.message || t('materialChuteThresholds.failedToSave'));
        return;
      }
      setMessage(t('materialChuteThresholds.savedSuccessfully'));
      await load();
    } catch (e) {
      console.error(e);
      setError(t('materialChuteThresholds.failedToSave'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="page-loading">{t('materialChuteThresholds.loading')}</div>;
  }

  return (
    <div className="material-thresholds-page">
      <div className="page-header">
        <h1>{t('materialChuteThresholds.title')}</h1>
        <div className="actions">
          <button className="btn btn-secondary" onClick={load} disabled={isSaving}>
            ↻ {t('common.refresh')}
          </button>
          <button className="btn btn-primary" onClick={saveAll} disabled={isSaving}>
            {isSaving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {message && <div className="success-banner">{message}</div>}

      <div className="thresholds-card">
        <p className="hint">
          {t('materialChuteThresholds.hint')}
        </p>

        <div className="thresholds-table">
          <div className="thresholds-row thresholds-header">
            <div>{t('materialChuteThresholds.material')}</div>
            <div>{t('materialChuteThresholds.minWidth')}</div>
            <div>{t('materialChuteThresholds.minLength')}</div>
          </div>

          {MATERIAL_TYPES.map((type) => {
            const row = rowsByType.get(type) || createDefaultRow(type);
            return (
              <div className="thresholds-row" key={type}>
                <div className="material-cell">{type}</div>
                <div>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={row.minWidthMm}
                    onChange={(e) => updateRow(type, { minWidthMm: parseIntSafe(e.target.value) })}
                  />
                </div>
                <div>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={row.minLengthM}
                    onChange={(e) => updateRow(type, { minLengthM: parseFloatSafe(e.target.value) })}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
