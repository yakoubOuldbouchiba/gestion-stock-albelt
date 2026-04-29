import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Roll, RollStatus, WastePiece } from '../types/index';
import { RollService } from '../services/rollService';
import { WastePieceService } from '../services/wastePieceService';
import { useI18n } from '@hooks/useI18n';
import { formatDate } from '../utils/date';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { Dropdown } from 'primereact/dropdown';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ProgressBar } from 'primereact/progressbar';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import { getRollChuteSummary } from '@utils/rollChuteLabel';
import { QrCodeCard } from '../components/QrCodeCard';
import { MetricTile } from '../components/detail/MetricTile';
import { PlacementSVG } from '../components/detail/PlacementSVG';
import { PlacementForm } from '../components/detail/PlacementForm';
import { PlacementList } from '../components/detail/PlacementList';
import { usePlacements } from './hooks/usePlacements';
import '../styles/DetailPages.css';
import { Toast } from 'primereact/toast';

export function RollDetailPage() {
  const { t } = useI18n();
  const { rollId } = useParams<{ rollId: string }>();
  const navigate = useNavigate();
  const toast = useRef<Toast>(null);
  const [roll, setRoll] = useState<Roll | null>(null);
  const [wastePieces, setWastePieces] = useState<WastePiece[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegeneratingQr, setIsRegeneratingQr] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const {
    placements,
    loadPlacements,
    form,
    setForm,
    isProcessing,
    error: placementError,
    clearPlacementError,
    editingId,
    handleSave,
    handleDelete,
    handleClear,
    startEdit,
    cancelEdit,
  } = usePlacements(rollId || '', 'roll');

  const combinedError = localError || placementError;
  const statuses: RollStatus[] = ['AVAILABLE', 'OPENED', 'EXHAUSTED', 'ARCHIVED'];
  const statusOptions = statuses.map(s => ({ label: t(`statuses.${s}`), value: s }));

  useEffect(() => {
    if (rollId) {
      loadData();
      loadPlacements();
    }
  }, [rollId, loadPlacements]);

  useEffect(() => {
    if (combinedError) {
      toast.current?.show({ severity: 'error', summary: combinedError, detail: combinedError, life: 5000 });
      setLocalError(null);
      clearPlacementError();
    }
  }, [combinedError, t, clearPlacementError]);

  const loadData = async () => {
    if (!rollId) return;
    setIsLoading(true);
    try {
      const [rollRes, wasteRes] = await Promise.all([
        RollService.getById(rollId),
        WastePieceService.getByRoll(rollId)
      ]);

      if (rollRes.success) setRoll(rollRes.data);
      else setLocalError(t('rollDetail.failedToLoad'));

      if (wasteRes.success) setWastePieces(wasteRes.data || []);
    } catch (err) {
      setLocalError(t('rollDetail.failedToLoad'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: RollStatus) => {
    if (!roll) return;
    try {
      const response = await RollService.updateStatus(roll.id, newStatus);
      if (response.success) setRoll(response.data);
    } catch (err) {
      setLocalError(t('rollDetail.failedToUpdate'));
    }
  };

  const handleRegenerateQr = async () => {
    if (!roll || isRegeneratingQr) return;
    setIsRegeneratingQr(true);
    try {
      const response = await RollService.regenerateQrCode(roll.id);
      if (response.success) setRoll(response.data);
    } finally {
      setIsRegeneratingQr(false);
    }
  };

  const isCommandePlacement = (p: any) => Boolean(p.commandeItemId || p.commandeItem?.id);

  if (isLoading) return <div className="flex justify-center p-8"><ProgressSpinner /></div>;
  if (!roll) return <div className="p-4"><Message severity="error" text={t('rollDetail.notFound')} /></div>;

  const rollSummary = getRollChuteSummary(roll);
  const usedAreaM2 = roll.usedAreaM2 ?? roll.totalWasteAreaM2 ?? 0;
  const availableAreaM2 = roll.availableAreaM2 ?? (roll.areaM2 - usedAreaM2);
  const wastePercent = roll.areaM2 ? (usedAreaM2 / roll.areaM2) * 100 : 0;
  
  const sourceWidth = roll.widthMm;
  const sourceLength = Math.round(roll.lengthM * 1000);

  return (
    <div className="detail-page-container p-gutter">
      <header className="detail-header">
        <div className="detail-header__main">
          <Button icon="pi pi-arrow-left" text onClick={() => navigate('/inventory')} className="p-button-lg" />
          <div>
            <h1 className="detail-dashboard__title text-2xl">{t('rollDetail.title')}</h1>
            <div className="flex gap-2 text-sm text-muted">
              <span>Lot: {roll.lotId || 'N/A'}</span>
              <span>• ID: {roll.id}</span>
              {rollSummary.reference && <span>• Ref: {rollSummary.reference}</span>}
            </div>
          </div>
        </div>
        <div className="detail-header__actions">
          <Tag value={roll.materialType} severity="info" />
          <div className="flex align-items-center gap-2">
            <span className="text-sm font-bold">{t('rollDetail.status')}:</span>
            <Dropdown value={roll.status} options={statusOptions} onChange={(e) => handleStatusChange(e.value)} className="p-inputtext-sm w-40" />
          </div>
          <Button label={t('rollDetail.movements')} icon="pi pi-map-marker" outlined size="small" onClick={() => navigate(`/roll/${roll.id}/movements`)} />
        </div>
      </header>
      <Toast ref={toast} position="bottom-center" />

      <section className="metrics-grid">
        <MetricTile label={t('rollDetail.width')} value={roll.widthMm} unit="mm" />
        <MetricTile 
          label={t('rollDetail.length')} 
          value={roll.lengthM.toFixed(2)} 
          unit="m" 
          subValue={`${(roll.lengthRemainingM ?? roll.lengthM).toFixed(2)}m remaining`} 
        />
        <MetricTile label={t('rollDetail.area')} value={roll.areaM2.toFixed(2)} unit="m²">
          <div className="mt-2">
            <ProgressBar value={Math.max(0, 100 - wastePercent)} showValue={false} style={{ height: '6px' }} />
            <div className="text-xs mt-1 text-success font-bold">{(100 - wastePercent).toFixed(1)}% available</div>
          </div>
        </MetricTile>
        <MetricTile label={t('rollDetail.material')} value={roll.materialType} subValue={`${roll.nbPlis} plies • ${roll.thicknessMm}mm`} />
      </section>

      <main className="detail-content-grid">
        <div className="detail-main">
          <PlacementSVG 
            widthMm={sourceWidth} 
            lengthMm={sourceLength} 
            placements={placements} 
            baseColor={roll.colorHexCode} 
          />
          
          <PlacementList 
            placements={placements} 
            onEdit={startEdit} 
            onDelete={handleDelete} 
            onClear={handleClear} 
            isCommandePlacement={isCommandePlacement} 
          />

          <PlacementForm 
            form={form} 
            isEditing={!!editingId} 
            isProcessing={isProcessing} 
            onChange={(name, val) => setForm(prev => ({ ...prev, [name]: val }))} 
            onSave={() => handleSave(sourceWidth, sourceLength, loadData)} 
            onCancel={cancelEdit} 
          />
        </div>

        <aside className="detail-sidebar">
          <Card title={t('rollDetail.basicInfo')} className="mb-4">
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between"><strong>{t('inventory.lotId') || 'Lot ID'}:</strong><span>{roll.lotId || 'N/A'}</span></div>
              <div className="flex justify-between"><strong>{t('rollDetail.supplier')}:</strong><span>{roll.supplierName || 'N/A'}</span></div>
              <div className="flex justify-between"><strong>{t('rollDetail.workshop')}:</strong><span>{roll.altierLibelle || t('rollDetail.unassigned')}</span></div>
              <div className="flex justify-between"><strong>{t('rollDetail.receivedDate')}:</strong><span>{formatDate(roll.receivedDate)}</span></div>
              <div className="flex justify-between">
                <strong>{t('inventory.color')}:</strong>
                <span className="flex align-items-center gap-2">
                  {roll.colorName || roll.article?.color?.name || 'N/A'}
                  {(roll.colorHexCode || roll.article?.color?.hexCode) && (
                    <span 
                      className="inline-block" 
                      style={{ 
                        width: '12px', 
                        height: '12px', 
                        borderRadius: '50%', 
                        backgroundColor: roll.colorHexCode || roll.article?.color?.hexCode,
                        border: '1px solid var(--surface-border)'
                      }} 
                    />
                  )}
                </span>
              </div>
            </div>
          </Card>

          <Card title={t('rollDetail.processing')} className="mb-4">
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between"><strong>{t('rollDetail.totalCuts')}:</strong><span>{placements.length}</span></div>
              <div className="flex justify-between"><strong>{t('inventory.availableArea')}:</strong><span className="font-bold text-success">{availableAreaM2.toFixed(2)} m²</span></div>
            </div>
          </Card>

          <QrCodeCard 
            label={t('rollDetail.qrCode')} 
            qrCode={roll.qrCode} 
            onRegenerate={handleRegenerateQr} 
            regenerating={isRegeneratingQr} 
          />
        </aside>
      </main>

      <section className="mt-8">
        <Card title={t('rollDetail.chutesTitle')}>
          {wastePieces.length === 0 ? (
            <Message severity="info" text={t('rollDetail.chutesEmpty')} />
          ) : (
            <DataTable value={wastePieces} dataKey="id" size="small" responsiveLayout="scroll" className="p-datatable-sm">
              <Column field="lotId" header={t('inventory.lotId') || 'Lot ID'} sortable />
              <Column field="id" header={t('waste.tableWasteId')} sortable />
              <Column header={t('waste.tableDimensions')} body={p => `${p.widthMm}mm × ${p.lengthM.toFixed(2)}m`} />
              <Column field="areaM2" header={t('waste.tableArea')} body={p => `${p.areaM2.toFixed(2)} m²`} sortable />
              <Column field="status" header={t('waste.tableStatus')} body={p => <Tag value={p.status} severity={p.status === 'AVAILABLE' ? 'success' : 'info'} />} />
              <Column field="wasteType" header={t('waste.tableType')} />
              <Column field="createdAt" header={t('waste.tableCreated')} body={p => formatDate(p.createdAt)} sortable />
              <Column body={p => p.wasteType !== 'DECHET' && <Button icon="pi pi-eye" text rounded onClick={() => navigate(`/chute/${p.id}`)} />} />
            </DataTable>
          )}
        </Card>
      </section>
    </div>
  );
}

export default RollDetailPage;
