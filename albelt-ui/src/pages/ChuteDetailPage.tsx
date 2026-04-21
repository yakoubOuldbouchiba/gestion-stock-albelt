import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { WastePiece } from '../types/index';
import { WastePieceService } from '../services/wastePieceService';
import { useI18n } from '@hooks/useI18n';
import { formatDate } from '../utils/date';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Tag } from 'primereact/tag';
import { QrCodeCard } from '../components/QrCodeCard';
import { MetricTile } from '../components/detail/MetricTile';
import { PlacementSVG } from '../components/detail/PlacementSVG';
import { PlacementForm } from '../components/detail/PlacementForm';
import { PlacementList } from '../components/detail/PlacementList';
import { usePlacements } from './hooks/usePlacements';
import '../styles/DetailPages.css';

export function ChuteDetailPage() {
  const { t } = useI18n();
  const { wasteId } = useParams<{ wasteId: string }>();
  const navigate = useNavigate();

  const [wastePiece, setWastePiece] = useState<WastePiece | null>(null);
  const [parentWaste, setParentWaste] = useState<WastePiece | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegeneratingQr, setIsRegeneratingQr] = useState(false);
  const [error, setLocalError] = useState<string | null>(null);

  const {
    placements,
    loadPlacements,
    form,
    setForm,
    isProcessing,
    error: placementError,
    editingId,
    handleSave,
    handleDelete,
    handleClear,
    startEdit,
    cancelEdit,
  } = usePlacements(wasteId || '', 'waste');

  const combinedError = error || placementError;

  useEffect(() => {
    if (wasteId) {
      loadData();
      loadPlacements();
    }
  }, [wasteId, loadPlacements]);

  const loadData = async () => {
    if (!wasteId) return;
    setIsLoading(true);
    try {
      const response = await WastePieceService.getById(wasteId);
      if (response.success && response.data) {
        const piece = response.data;
        setWastePiece(piece);

        const parentRes = await (
          piece.parentWastePieceId
            ? WastePieceService.getById(piece.parentWastePieceId)
            : Promise.resolve({ success: false, data: null })
        );

        if (parentRes.success) setParentWaste(parentRes.data);
      } else {
        setLocalError(t('waste.failedToLoadData'));
      }
    } catch (err) {
      setLocalError(t('waste.failedToLoadData'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateQr = async () => {
    if (!wastePiece || isRegeneratingQr) return;
    setIsRegeneratingQr(true);
    try {
      const response = await WastePieceService.regenerateQrCode(wastePiece.id);
      if (response.success && response.data) setWastePiece(response.data);
    } finally {
      setIsRegeneratingQr(false);
    }
  };

  const isCommandePlacement = (p: any) => Boolean(p.commandeItemId || p.commandeItem?.id);

  const sourceWidth = wastePiece?.widthMm || 0;
  const sourceLength = Math.round((wastePiece?.lengthM || 0) * 1000);

  if (isLoading) return <div className="flex justify-center p-8"><ProgressSpinner /></div>;
  if (!wastePiece) return <div className="p-4"><Message severity="error" text={t('waste.noPiecesFound')} /></div>;

  return (
    <div className="detail-page-container p-gutter">
      <header className="detail-header">
        <div className="detail-header__main">
          <Button icon="pi pi-arrow-left" text onClick={() => navigate('/inventory')} className="p-button-lg" />
          <div>
            <h1 className="detail-dashboard__title text-2xl">{t('waste.wasteDetailsTitle')}</h1>
            <div className="flex gap-2 text-sm text-muted">
              <span>ID: {wastePiece.id}</span>
              {wastePiece.reference && <span>• Ref: {wastePiece.reference}</span>}
            </div>
          </div>
        </div>
        <div className="detail-header__actions">
          <Tag value={wastePiece.wasteType?.replace('_', ' ')} severity={wastePiece.wasteType === 'CHUTE_EXPLOITABLE' ? 'success' : 'warning'} />
          <Tag value={wastePiece.materialType} severity="info" />
          <Tag value={t(`waste.status.${wastePiece.status}`)} severity={wastePiece.status === 'AVAILABLE' ? 'success' : 'warning'} />
          <Button label={t('navigation.movements')} icon="pi pi-share-alt" outlined size="small" onClick={() => navigate(`/chute/${wastePiece.id}/movements`)} />
          {wastePiece.rollId && <Button label={t('inventory.roll')} icon="pi pi-eye" outlined size="small" onClick={() => navigate(`/roll/${wastePiece.rollId}`)} />}
        </div>
      </header>

      {combinedError && <Message severity="error" text={combinedError} className="mb-4 w-full" />}

      <section className="metrics-grid">
        <MetricTile label={t('rollDetail.width')} value={wastePiece.widthMm} unit="mm" />
        <MetricTile label={t('rollDetail.length')} value={wastePiece.lengthM.toFixed(2)} unit="m" />
        <MetricTile label={t('rollDetail.area')} value={wastePiece.areaM2.toFixed(2)} unit="m²" />
        <MetricTile label={t('rollDetail.material')} value={wastePiece.materialType} subValue={`${wastePiece.nbPlis} plies • ${wastePiece.thicknessMm}mm`} />
      </section>

      <main className="detail-content-grid">
        <div className="detail-main">
          <PlacementSVG
            widthMm={sourceWidth}
            lengthMm={sourceLength}
            placements={placements}
            baseColor={wastePiece.colorHexCode}
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
            onSave={() => handleSave(sourceWidth, sourceLength)}
            onCancel={cancelEdit}
          />
        </div>

        <aside className="detail-sidebar">
          <Card title={t('rollDetail.basicInfo')} className="mb-4">
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between"><strong>{t('rollDetail.supplier')}:</strong><span>{wastePiece.supplierName || 'N/A'}</span></div>
              <div className="flex justify-between"><strong>{t('rollDetail.workshop')}:</strong><span>{wastePiece.altierLibelle || t('rollDetail.unassigned')}</span></div>
              <div className="flex justify-between"><strong>{t('waste.detailCreated')}:</strong><span>{formatDate(wastePiece.createdAt)}</span></div>
            </div>
          </Card>

          <Card title={t('rollDetail.processing')} className="mb-4">
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between"><strong>{t('rollDetail.totalCuts')}:</strong><span>{wastePiece.totalCuts}</span></div>
              <div className="flex justify-between"><strong>{t('inventory.availableArea')}:</strong><span className="font-bold text-success">{(wastePiece.availableAreaM2 || 0).toFixed(2)} m²</span></div>
            </div>
          </Card>

          <QrCodeCard
            label={t('rollDetail.qrCode')}
            qrCode={wastePiece.qrCode}
            onRegenerate={handleRegenerateQr}
            regenerating={isRegeneratingQr}
          />

          {parentWaste && (
            <Card title={t('waste.detailParentWaste')} className="mt-4">
              <div className="text-sm">
                <div>ID: {parentWaste.id}</div>
                <div>{parentWaste.widthMm}mm x {parentWaste.lengthM.toFixed(2)}m</div>
                <Button label="View Parent" icon="pi pi-external-link" text size="small" className="mt-2" onClick={() => navigate(`/chute/${parentWaste.id}`)} />
              </div>
            </Card>
          )}
        </aside>
      </main>
    </div>
  );
}

export default ChuteDetailPage;
