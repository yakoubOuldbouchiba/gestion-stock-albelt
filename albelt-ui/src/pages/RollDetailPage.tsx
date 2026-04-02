import { useEffect, useState } from 'react';
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

export function RollDetailPage() {
  const { t } = useI18n();
  const { rollId } = useParams<{ rollId: string }>();
  const navigate = useNavigate();
  
  const [roll, setRoll] = useState<Roll | null>(null);
  const [wastePieces, setWastePieces] = useState<WastePiece[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const statuses: RollStatus[] = ['AVAILABLE', 'OPENED', 'EXHAUSTED', 'ARCHIVED'];

  useEffect(() => {
    loadRollDetails();
  }, [rollId]);

  const loadRollDetails = async () => {
    if (!rollId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const [rollResponse, wasteResponse] = await Promise.all([
        RollService.getById(rollId),
        WastePieceService.getByRoll(rollId),
      ]);

      if (rollResponse.success && rollResponse.data) {
        setRoll(rollResponse.data);
        
      } else {
        setError(t('rollDetail.failedToLoad'));
      }

      if (wasteResponse.success && wasteResponse.data) {
        setWastePieces(wasteResponse.data);
      } else {
        setWastePieces([]);
      }
    } catch (err) {
      setError(t('rollDetail.failedToLoad'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: RollStatus) => {
    if (!roll) return;
    
    try {
      const response = await RollService.updateStatus(roll.id, newStatus);
      if (response.success && response.data) {
        setRoll(response.data);
      }
    } catch (err) {
      setError(t('rollDetail.failedToUpdate'));
      console.error(err);
    }
  };

  const statusOptions = statuses.map((status) => ({ label: status, value: status }));
  const wastePercent = roll?.areaM2 ? (roll.totalWasteAreaM2 / roll.areaM2) * 100 : 0;

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <ProgressSpinner />
      </div>
    );
  }

  if (!roll) {
    return (
      <div>
        <Message severity="error" text={error || t('rollDetail.notFound')} />
        <Button label={t('rollDetail.backToInventory')} icon="pi pi-arrow-left" onClick={() => navigate('/inventory')} />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Button
            icon="pi pi-arrow-left"
            text
            onClick={() => navigate('/inventory')}
            aria-label={t('rollDetail.back')}
          />
          <h1 style={{ margin: 0 }}>{t('rollDetail.title')}</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Button
            label={t('rollDetail.movements')}
            icon="pi pi-map-marker"
            onClick={() => navigate(`/roll/${roll.id}/movements`)}
          />
          <Tag value={roll.materialType} style={{ backgroundColor: roll.colorHexCode }} />
        </div>
      </div>

      {error && <Message severity="error" text={error} />}

      <div style={{ display: 'grid', gap: '1rem' }}>
        <Card title={t('rollDetail.basicInfo')}>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <div><strong>{t('rollDetail.rollId')}:</strong> {roll.id}</div>
            <div><strong>{t('rollDetail.material')}:</strong> <Tag value={roll.materialType} style={{ backgroundColor: roll.colorHexCode }} /></div>
            <div><strong>{t('rollDetail.supplier')}:</strong> {roll.supplierName || 'N/A'}</div>
            <div><strong>{t('rollDetail.workshop')}:</strong> {roll.altierLibelle || t('rollDetail.unassigned')}</div>
            <div><strong>{t('rollDetail.receivedDate')}:</strong> {formatDate(roll.receivedDate)}</div>
          </div>
        </Card>

        <Card title={t('rollDetail.materialSpecs')}>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <div><strong>{t('rollDetail.plies')}:</strong> {roll.nbPlis}</div>
            <div><strong>{t('rollDetail.thickness')}:</strong> {roll.thicknessMm} mm</div>
          </div>
        </Card>

        <Card title={t('rollDetail.dimensions')}>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <div><strong>{t('rollDetail.width')}:</strong> {roll.widthMm} mm</div>
            <div><strong>{t('rollDetail.length')}:</strong> {roll.lengthM} m</div>
            <div><strong>{t('rollDetail.area')}:</strong> {roll.areaM2.toFixed(2)} m²</div>
          </div>
        </Card>

        <Card title={t('rollDetail.processing')}>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <div><strong>{t('rollDetail.totalArea')}:</strong> {roll.areaM2.toFixed(2)} m²</div>
            <div><strong>{t('rollDetail.totalWaste')}:</strong> {roll.totalWasteAreaM2.toFixed(2)} m²</div>
            <div><strong>{t('rollDetail.totalCuts')}:</strong> {roll.totalCuts}</div>
            <div><strong>{t('rollDetail.lengthRemaining')}:</strong> {roll.lengthRemainingM ? roll.lengthRemainingM.toFixed(2) : roll.lengthM.toFixed(2)} m</div>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <ProgressBar value={Math.max(0, 100 - wastePercent)} />
            <div style={{ marginTop: '0.25rem' }}>{(100 - wastePercent).toFixed(1)}% Available</div>
          </div>
        </Card>

        <Card title={t('rollDetail.statusTracking') || 'Status & Tracking'}>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <div>
              <label htmlFor="status">{t('rollDetail.status') || 'Status'}:</label>
              <Dropdown
                id="status"
                value={roll.status}
                options={statusOptions}
                onChange={(e) => handleStatusChange(e.value)}
              />
            </div>
            <div><strong>{t('rollDetail.qrCode') || 'QR Code'}:</strong> {roll.qrCode || 'N/A'}</div>
          </div>
        </Card>

        <Card title={t('rollDetail.chutesTitle')}>
          {wastePieces.length === 0 ? (
            <Message severity="info" text={t('rollDetail.chutesEmpty')} />
          ) : (
            <DataTable value={wastePieces} dataKey="id" size="small">
              <Column header={t('waste.tableWasteId')} field="id" />
              <Column
                header={t('waste.tableDimensions')}
                body={(piece: WastePiece) => `${piece.widthMm} mm × ${piece.lengthM.toFixed(2)} m`}
              />
              <Column header={t('waste.tableArea')} body={(piece: WastePiece) => piece.areaM2.toFixed(2)} />
              <Column header={t('waste.tableStatus')} field="status" />
              <Column header={t('waste.tableType') || 'Type'} body={(piece: WastePiece) => piece.wasteType || 'N/A'} />
              <Column header={t('waste.tableCreated')} body={(piece: WastePiece) => formatDate(piece.createdAt)} />
            </DataTable>
          )}
        </Card>
      </div>
    </div>
  );
}

export default RollDetailPage;
