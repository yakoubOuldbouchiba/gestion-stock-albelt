import { useEffect, useMemo, useState } from 'react';
import type { MaterialChuteThreshold, MaterialType } from '../types/index';
import { MaterialChuteThresholdService } from '@services/materialChuteThresholdService';
import { useI18n } from '@hooks/useI18n';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputNumber } from 'primereact/inputnumber';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useAsyncLock } from '@hooks/useAsyncLock';
import { PageHeader } from '../components/PageHeader';

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

export function MaterialChuteThresholdsPage({ hideHeader = false }: { hideHeader?: boolean }) {
  const { t } = useI18n();
  const [rows, setRows] = useState<EditableRow[]>(MATERIAL_TYPES.map(createDefaultRow));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const { run, isLocked } = useAsyncLock();

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
    if (isLocked('threshold-save')) {
      return;
    }

    const validationError = validateAll();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      await run(async () => {
        const response = await MaterialChuteThresholdService.upsertAll(rows);
        if (!response.success) {
          setError(response.message || t('materialChuteThresholds.failedToSave'));
          return;
        }
        setMessage(t('materialChuteThresholds.savedSuccessfully'));
        await load();
      }, 'threshold-save');
    } catch (e) {
      console.error(e);
      setError(t('materialChuteThresholds.failedToSave'));
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <div>
      {!hideHeader && (
        <PageHeader
          title={t('materialChuteThresholds.title')}
          subtitle={t('materialChuteThresholds.hint')}
          actions={
            <>
              <Button icon="pi pi-refresh" label={t('common.refresh')} severity="secondary" onClick={load} disabled={isLocked('threshold-save')} />
              <Button label={isLocked('threshold-save') ? t('common.saving') : t('common.save')} onClick={saveAll} disabled={isLocked('threshold-save')} loading={isLocked('threshold-save')} />
            </>
          }
        />
      )}

      {hideHeader && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginBottom: '1rem' }}>
          <Button icon="pi pi-refresh" label={t('common.refresh')} severity="secondary" onClick={load} disabled={isLocked('threshold-save')} />
          <Button label={isLocked('threshold-save') ? t('common.saving') : t('common.save')} onClick={saveAll} disabled={isLocked('threshold-save')} loading={isLocked('threshold-save')} />
        </div>
      )}

      {error && <Message severity="error" text={error} />}
      {message && <Message severity="success" text={message} />}

      <DataTable value={rows} dataKey="materialType" size="small" paginator rows={10} rowsPerPageOptions={[10, 25, 50]}>
        <Column field="materialType" header={t('materialChuteThresholds.material')} />
        <Column
          header={t('materialChuteThresholds.minWidth')}
          body={(row: EditableRow) => (
            <InputNumber
              value={row.minWidthMm}
              min={0}
              onValueChange={(e) => updateRow(row.materialType, { minWidthMm: e.value ?? 0 })}
              inputStyle={{ width: '100%' }}
              disabled={isLocked('threshold-save')}
            />
          )}
        />
        <Column
          header={t('materialChuteThresholds.minLength')}
          body={(row: EditableRow) => (
            <InputNumber
              value={row.minLengthM}
              min={0}
              mode="decimal"
              minFractionDigits={0}
              maxFractionDigits={2}
              onValueChange={(e) => updateRow(row.materialType, { minLengthM: e.value ?? 0 })}
              inputStyle={{ width: '100%' }}
              disabled={isLocked('threshold-save')}
            />
          )}
        />
      </DataTable>
    </div>
  );
}

export default MaterialChuteThresholdsPage;
