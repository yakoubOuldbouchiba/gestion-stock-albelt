import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Toast } from 'primereact/toast';
import { useI18n } from '@hooks/useI18n';
import { useAsyncLock } from '@hooks/useAsyncLock';
import { CommandeService } from '../services/commandeService';
import { ProductionItemService } from '../services/productionItemService';
import { ReturnBonService } from '../services/returnBonService';
import { formatDateTime } from '../utils/date';
import { formatRollChuteLabel } from '@utils/rollChuteLabel';
import type {
  Commande,
  CommandeItem,
  ProductionItem,
  ReturnBon,
  ReturnBonItemRequest,
  ReturnMode,
  ReturnMeasureAction,
  ReturnType,
} from '../types';

type ProductionRow = {
  productionItem: ProductionItem;
  commandeItem: CommandeItem;
};

type ReturnItemForm = {
  commandeItemId: string;
  productionItemId: string;
  quantity: number;
  returnType: ReturnType;
  measureAction?: ReturnMeasureAction;
  adjustedWidthMm?: number | null;
  adjustedLengthM?: number | null;
};

export function CommandeReturnPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { run, isLocked } = useAsyncLock();
  const toastRef = useRef<Toast>(null);

  const [commande, setCommande] = useState<Commande | null>(null);
  const [returnBons, setReturnBons] = useState<ReturnBon[]>([]);
  const [productionRows, setProductionRows] = useState<ProductionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [returnMode, setReturnMode] = useState<ReturnMode>('PARTIAL');
  const [reason, setReason] = useState('');
  const [reasonDetails, setReasonDetails] = useState('');
  const [notes, setNotes] = useState('');
  const [formItems, setFormItems] = useState<Record<string, ReturnItemForm>>({});

  const reasonOptions = [
    { label: t('returns.reasonDamaged'), value: 'DAMAGED' },
    { label: t('returns.reasonDimension'), value: 'DIMENSION' },
    { label: t('returns.reasonClient'), value: 'CLIENT' },
    { label: t('returns.reasonOther'), value: 'OTHER' },
  ];

  const returnModeOptions = [
    { label: t('returns.modeTotal'), value: 'TOTAL' },
    { label: t('returns.modePartial'), value: 'PARTIAL' },
  ];

  const returnTypeOptions = [
    { label: t('returns.typeMatiere'), value: 'MATIERE' },
    { label: t('returns.typeMesure'), value: 'MESURE' },
  ];

  const measureActionOptions = [
    { label: t('returns.measureAdjust'), value: 'AJUST' },
    { label: t('returns.measureWaste'), value: 'DECHET' },
  ];

  useEffect(() => {
    if (!id) {
      setError(t('returns.loadError'));
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        const commandeRes = await CommandeService.getById(id);
        if (!commandeRes.data) {
          setError(t('returns.loadError'));
          return;
        }
        setCommande(commandeRes.data);

        const items = commandeRes.data.items ?? [];
        const rows = await Promise.all(
          items.map(async (item) => {
            const response = await ProductionItemService.getByCommandeItemId(item.id);
            const productionItems = response.data ?? [];
            return productionItems.map((productionItem) => ({
              productionItem,
              commandeItem: item,
            }));
          })
        );
        setProductionRows(rows.flat());

        const returnRes = await ReturnBonService.getByCommandeId(id);
        setReturnBons(returnRes.data ?? []);
        setError(null);
      } catch (err) {
        console.error('Error loading return data', err);
        setError(t('returns.loadError'));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, t]);

  const returnedByProductionId = useMemo(() => {
    const totals: Record<string, number> = {};
    returnBons.forEach((bon) => {
      bon.items?.forEach((item) => {
        totals[item.productionItemId] = (totals[item.productionItemId] || 0) + item.quantity;
      });
    });
    return totals;
  }, [returnBons]);

  const rowsWithRemaining = useMemo(() => {
    return productionRows.map((row) => {
      const returned = returnedByProductionId[row.productionItem.id] || 0;
      const remaining = Math.max(0, row.productionItem.quantity - returned);
      return { ...row, remaining };
    });
  }, [productionRows, returnedByProductionId]);

  useEffect(() => {
    setFormItems((prev) => {
      const next: Record<string, ReturnItemForm> = { ...prev };
      rowsWithRemaining.forEach((row) => {
        const existing = prev[row.productionItem.id];
        next[row.productionItem.id] = {
          commandeItemId: row.commandeItem.id,
          productionItemId: row.productionItem.id,
          quantity: existing?.quantity ?? 0,
          returnType: existing?.returnType ?? 'MATIERE',
          measureAction: existing?.measureAction,
          adjustedWidthMm: existing?.adjustedWidthMm ?? null,
          adjustedLengthM: existing?.adjustedLengthM ?? null,
        };
      });
      return next;
    });
  }, [rowsWithRemaining]);

  useEffect(() => {
    if (returnMode !== 'TOTAL') return;
    setFormItems((prev) => {
      const next = { ...prev };
      rowsWithRemaining.forEach((row) => {
        if (row.remaining > 0) {
          next[row.productionItem.id] = {
            ...next[row.productionItem.id],
            quantity: row.remaining,
          };
        }
      });
      return next;
    });
  }, [returnMode, rowsWithRemaining]);

  const showError = (detail: string) => {
    toastRef.current?.show({
      severity: 'error',
      summary: t('common.error'),
      detail,
      life: 3000,
    });
  };

  const showSuccess = (detail: string) => {
    toastRef.current?.show({
      severity: 'success',
      summary: t('common.success'),
      detail,
      life: 2500,
    });
  };

  const handleSubmit = async () => {
    if (!commande) return;
    if (isLocked('return-create')) return;

    const selectedItems = rowsWithRemaining
      .map((row) => formItems[row.productionItem.id])
      .filter((item) => item && item.quantity > 0);

    if (!reason) {
      showError(t('returns.reasonRequired'));
      return;
    }

    if (selectedItems.length === 0) {
      showError(t('returns.selectItemRequired'));
      return;
    }

    if (returnMode === 'TOTAL') {
      const missing = rowsWithRemaining.some((row) => {
        if (row.remaining <= 0) return false;
        const item = formItems[row.productionItem.id];
        return !item || item.quantity !== row.remaining;
      });
      if (missing) {
        showError(t('returns.totalCoverageRequired'));
        return;
      }
    }

    const payloadItems: ReturnBonItemRequest[] = selectedItems.map((item) => ({
      commandeItemId: item.commandeItemId,
      productionItemId: item.productionItemId,
      quantity: item.quantity,
      returnType: item.returnType,
      measureAction: item.returnType === 'MESURE' ? item.measureAction : undefined,
      adjustedWidthMm: item.returnType === 'MESURE' && item.measureAction === 'AJUST'
        ? item.adjustedWidthMm ?? undefined
        : undefined,
      adjustedLengthM: item.returnType === 'MESURE' && item.measureAction === 'AJUST'
        ? item.adjustedLengthM ?? undefined
        : undefined,
    }));

    try {
      setSaving(true);
      await run(async () => {
        const response = await ReturnBonService.create({
          commandeId: commande.id,
          returnMode,
          reason,
          reasonDetails: reason === 'OTHER' ? reasonDetails : undefined,
          notes: notes || undefined,
          items: payloadItems,
        });

        if (response.success) {
          showSuccess(t('returns.createSuccess'));
          const returnRes = await ReturnBonService.getByCommandeId(commande.id);
          setReturnBons(returnRes.data ?? []);
          if (returnMode !== 'TOTAL') {
            setFormItems({});
          }
        } else {
          showError(response.message || t('returns.createError'));
        }
      }, 'return-create');
    } catch (err) {
      console.error('Error creating return bon', err);
      showError(t('returns.createError'));
    } finally {
      setSaving(false);
    }
  };

  const renderReturnItems = () => {
    if (!rowsWithRemaining.length) {
      return <Message severity="info" text={t('returns.noProductionItems')} />;
    }

    return rowsWithRemaining.map((row) => {
      const form = formItems[row.productionItem.id];
      const productionItem = row.productionItem;
      const commandeItem = row.commandeItem;
      const baseItem: ReturnItemForm = form ?? {
        commandeItemId: row.commandeItem.id,
        productionItemId: productionItem.id,
        quantity: 0,
        returnType: 'MATIERE',
      };
      const isTotal = returnMode === 'TOTAL';
      const source = productionItem.placedRectangle?.roll
        ? formatRollChuteLabel(productionItem.placedRectangle.roll)
        : productionItem.placedRectangle?.wastePiece
        ? formatRollChuteLabel(productionItem.placedRectangle.wastePiece)
        : t('returns.unknownSource');

      return (
        <Card key={productionItem.id} style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
              <span><strong>{t('returns.line')}</strong> {commandeItem.lineNumber}</span>
              <span><strong>{t('returns.material')}</strong> {commandeItem.materialType}</span>
              <span>
                <strong>{t('returns.dimensions')}</strong> {productionItem.pieceWidthMm}mm x {productionItem.pieceLengthM}m
              </span>
              <span><strong>{t('returns.produced')}</strong> {productionItem.quantity}</span>
              <span><strong>{t('returns.remaining')}</strong> {row.remaining}</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
              <span><strong>{t('returns.source')}</strong> {source}</span>
            </div>
            <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem' }}>{t('returns.quantity')}</label>
                <InputNumber
                  value={form?.quantity ?? 0}
                  onValueChange={(e) =>
                    setFormItems((prev) => ({
                      ...prev,
                      [productionItem.id]: {
                        ...baseItem,
                        quantity: e.value ? Number(e.value) : 0,
                      },
                    }))
                  }
                  min={0}
                  max={row.remaining}
                  disabled={isTotal || row.remaining === 0}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem' }}>{t('returns.returnType')}</label>
                <Dropdown
                  value={form?.returnType ?? 'MATIERE'}
                  options={returnTypeOptions}
                  onChange={(e) =>
                    setFormItems((prev) => ({
                      ...prev,
                      [productionItem.id]: {
                        ...baseItem,
                        returnType: e.value,
                        measureAction: e.value === 'MESURE' ? baseItem.measureAction ?? 'DECHET' : undefined,
                      },
                    }))
                  }
                  style={{ width: '100%' }}
                />
              </div>
              {form?.returnType === 'MESURE' && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem' }}>{t('returns.measureAction')}</label>
                  <Dropdown
                    value={form?.measureAction ?? 'DECHET'}
                    options={measureActionOptions}
                    onChange={(e) =>
                      setFormItems((prev) => ({
                        ...prev,
                        [productionItem.id]: {
                          ...baseItem,
                          measureAction: e.value,
                        },
                      }))
                    }
                    style={{ width: '100%' }}
                  />
                </div>
              )}
              {form?.returnType === 'MESURE' && form?.measureAction === 'AJUST' && (
                <>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem' }}>{t('returns.adjustedWidth')}</label>
                    <InputNumber
                      value={form?.adjustedWidthMm ?? undefined}
                      onValueChange={(e) =>
                        setFormItems((prev) => ({
                          ...prev,
                          [productionItem.id]: {
                            ...baseItem,
                            adjustedWidthMm: e.value ? Number(e.value) : null,
                          },
                        }))
                      }
                      min={1}
                      max={productionItem.pieceWidthMm}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem' }}>{t('returns.adjustedLength')}</label>
                    <InputNumber
                      value={form?.adjustedLengthM ?? undefined}
                      onValueChange={(e) =>
                        setFormItems((prev) => ({
                          ...prev,
                          [productionItem.id]: {
                            ...baseItem,
                            adjustedLengthM: e.value ? Number(e.value) : null,
                          },
                        }))
                      }
                      min={0}
                      max={productionItem.pieceLengthM}
                      mode="decimal"
                      minFractionDigits={1}
                      maxFractionDigits={2}
                      style={{ width: '100%' }}
                    />
                  </div>
                </>
              )}
            </div>
            {row.remaining === 0 && (
              <Message severity="info" text={t('returns.noRemaining')} />
            )}
          </div>
        </Card>
      );
    });
  };

  if (loading) {
    return (
      <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ProgressSpinner />
      </div>
    );
  }

  if (!commande) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <Message severity="warn" text={t('returns.notFound')} style={{ marginBottom: '1rem' }} />
        <Button label={t('returns.backToOrder')} onClick={() => navigate('/commandes')} />
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      <Toast ref={toastRef} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>{t('returns.title')}</h2>
          <p style={{ margin: '0.25rem 0 0', color: '#6b7280' }}>
            {t('returns.subtitle')} {commande.numeroCommande}
          </p>
        </div>
        <Button
          icon="pi pi-arrow-left"
          label={t('returns.backToOrder')}
          onClick={() => navigate(`/commandes/${commande.id}`)}
          outlined
        />
      </div>

      {error && <Message severity="error" text={error} style={{ margin: '1rem 0' }} />}

      <Card title={t('returns.detailsTitle')} style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem' }}>{t('returns.mode')}</label>
            <Dropdown
              value={returnMode}
              options={returnModeOptions}
              onChange={(e) => setReturnMode(e.value)}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem' }}>{t('returns.reason')}</label>
            <Dropdown
              value={reason}
              options={reasonOptions}
              onChange={(e) => setReason(e.value)}
              placeholder={t('returns.reasonPlaceholder')}
              style={{ width: '100%' }}
            />
          </div>
          {reason === 'OTHER' && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem' }}>{t('returns.reasonDetails')}</label>
              <InputText
                value={reasonDetails}
                onChange={(e) => setReasonDetails(e.target.value)}
                placeholder={t('returns.reasonDetailsPlaceholder')}
                style={{ width: '100%' }}
              />
            </div>
          )}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem' }}>{t('returns.notes')}</label>
            <InputTextarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              autoResize
              rows={3}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </Card>

      <Card title={t('returns.itemsTitle')} style={{ marginTop: '1.5rem' }}>
        {renderReturnItems()}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <Button
            label={t('returns.createReturn')}
            icon="pi pi-check"
            onClick={handleSubmit}
            loading={saving}
            disabled={saving || isLocked('return-create')}
          />
        </div>
      </Card>

      <Card title={t('returns.historyTitle')} style={{ marginTop: '1.5rem' }}>
        {!returnBons.length ? (
          <Message severity="info" text={t('returns.noReturns')} />
        ) : (
          <DataTable value={returnBons} responsiveLayout="scroll">
            <Column
              header={t('returns.createdAt')}
              body={(bon: ReturnBon) => formatDateTime(bon.createdAt)}
            />
            <Column field="returnMode" header={t('returns.mode')} />
            <Column field="reason" header={t('returns.reason')} />
            <Column
              header={t('returns.items')}
              body={(bon: ReturnBon) => bon.itemCount ?? bon.items?.length ?? 0}
            />
            <Column
              header={t('returns.createdBy')}
              body={(bon: ReturnBon) => bon.createdBy?.username || '-'}
            />
          </DataTable>
        )}
      </Card>
    </div>
  );
}

export default CommandeReturnPage;
