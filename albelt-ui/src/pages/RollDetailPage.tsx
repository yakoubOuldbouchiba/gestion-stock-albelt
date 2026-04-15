import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { PlacedRectangle, Roll, RollStatus, WastePiece } from '../types/index';
import { RollService } from '../services/rollService';
import { WastePieceService } from '../services/wastePieceService';
import { PlacedRectangleService } from '../services/placedRectangleService';
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
import { InputText } from 'primereact/inputtext';
import { getRollChuteSummary } from '@utils/rollChuteLabel';

export function RollDetailPage() {
  const { t } = useI18n();
  const { rollId } = useParams<{ rollId: string }>();
  const navigate = useNavigate();
  
  const [roll, setRoll] = useState<Roll | null>(null);
  const [wastePieces, setWastePieces] = useState<WastePiece[]>([]);
  const [placements, setPlacements] = useState<PlacedRectangle[]>([]);
  const [creatingPlacement, setCreatingPlacement] = useState(false);
  const [placementForm, setPlacementForm] = useState({
    xMm: '',
    yMm: '',
    widthMm: '',
    heightMm: '',
    commandeItemId: '',
  });
  const [editingPlacementId, setEditingPlacementId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const statuses: RollStatus[] = ['AVAILABLE', 'OPENED', 'EXHAUSTED', 'ARCHIVED'];

  const isCommandePlacement = (placement: PlacedRectangle) =>
    Boolean(placement.commandeItemId || (placement as any).commandeItem?.id);

  const setCommandePlacementError = () => {
    setError('This placement is linked to an order. Edit/delete it from the commande page.');
  };

  useEffect(() => {
    loadRollDetails();
  }, [rollId]);

  const refreshRoll = async (id: string) => {
    try {
      const response = await RollService.getById(id);
      if (response.success && response.data) {
        setRoll(response.data);
      }
    } catch (err) {
      console.error(err);
      setError(t('rollDetail.failedToLoad'));
    }
  };

  const loadRollDetails = async () => {
    if (!rollId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const [rollResponse, wasteResponse, placementsResponse] = await Promise.all([
        RollService.getById(rollId),
        WastePieceService.getByRoll(rollId),
        PlacedRectangleService.getByRoll(rollId),
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

      if (placementsResponse.success && placementsResponse.data) {
        setPlacements(Array.isArray(placementsResponse.data) ? placementsResponse.data : []);
      } else {
        setPlacements([]);
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

  const updatePlacementField = (name: keyof typeof placementForm, value: string) => {
    setPlacementForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreatePlacement = async () => {
    if (!roll) return;
    const isEditing = editingPlacementId !== null;
    const xMm = parseInt(placementForm.xMm, 10);
    const yMm = parseInt(placementForm.yMm, 10);
    const widthMm = parseInt(placementForm.widthMm, 10);
    const heightMm = parseInt(placementForm.heightMm, 10);

    if ([xMm, yMm, widthMm, heightMm].some((value) => Number.isNaN(value))) {
      setError('Placement dimensions are required.');
      return;
    }

    const sourceWidthMm = Number(roll.widthRemainingMm ?? roll.widthMm ?? 0);
    const sourceLengthMm = Math.round(Number(roll.lengthRemainingM ?? roll.lengthM ?? 0) * 1000);
    if (sourceWidthMm <= 0 || sourceLengthMm <= 0) {
      setError('Source dimensions are required for placement.');
      return;
    }

    if (xMm < 0 || yMm < 0 || widthMm <= 0 || heightMm <= 0) {
      setError('Placement values must be positive.');
      return;
    }

    if (xMm >= sourceWidthMm || yMm >= sourceLengthMm || xMm + widthMm > sourceWidthMm || yMm + heightMm > sourceLengthMm) {
      setError('Placement is outside the source bounds.');
      return;
    }

    const hasOverlap = placements.some((placement) => {
      if (isEditing && placement.id === editingPlacementId) {
        return false;
      }
      const exX = placement.xMm;
      const exY = placement.yMm;
      const exW = placement.widthMm;
      const exH = placement.heightMm;
      return xMm < exX + exW && xMm + widthMm > exX && yMm < exY + exH && yMm + heightMm > exY;
    });
    if (hasOverlap) {
      setError('Placement overlaps an existing rectangle.');
      return;
    }

    try {
      if (creatingPlacement) return;
      setCreatingPlacement(true);
      if (isEditing && editingPlacementId) {
        const response = await PlacedRectangleService.update(editingPlacementId, {
          xMm,
          yMm,
          widthMm,
          heightMm,
        });
        if (!response.success) {
          setError(response.message || t('rollDetail.failedToUpdate'));
          return;
        }
      } else {
        const response = await PlacedRectangleService.create({
          rollId: roll.id,
          commandeItemId: placementForm.commandeItemId || undefined,
          xMm,
          yMm,
          widthMm,
          heightMm,
        });
        if (!response.success) {
          setError(response.message || t('rollDetail.failedToUpdate'));
          return;
        }
      }
      const placementsResponse = await PlacedRectangleService.getByRoll(roll.id);
      if (placementsResponse.success && placementsResponse.data) {
        const items = Array.isArray(placementsResponse.data) ? placementsResponse.data : [];
        setPlacements(items);
      } else {
        setError(placementsResponse.message || t('rollDetail.failedToLoad'));
      }
      await refreshRoll(roll.id);
      setPlacementForm((prev) => ({
        ...prev,
        xMm: '',
        yMm: '',
        widthMm: '',
        heightMm: '',
      }));
      setEditingPlacementId(null);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(t('rollDetail.failedToUpdate'));
    } finally {
      setCreatingPlacement(false);
    }
  };

  const startEditPlacement = (placement: PlacedRectangle) => {
    if (isCommandePlacement(placement)) {
      setCommandePlacementError();
      return;
    }
    setEditingPlacementId(placement.id);
    setPlacementForm({
      xMm: String(placement.xMm),
      yMm: String(placement.yMm),
      widthMm: String(placement.widthMm),
      heightMm: String(placement.heightMm),
      commandeItemId: placement.commandeItemId || '',
    });
  };

  const cancelEditPlacement = () => {
    setEditingPlacementId(null);
    setPlacementForm({
      xMm: '',
      yMm: '',
      widthMm: '',
      heightMm: '',
      commandeItemId: '',
    });
  };

  const handleDeletePlacement = async (placementId: string) => {
    if (!roll) return;
    const placement = placements.find((p) => p.id === placementId);
    if (placement && isCommandePlacement(placement)) {
      setCommandePlacementError();
      return;
    }
    if (!window.confirm('Delete this placement?')) return;
    try {
      await PlacedRectangleService.delete(placementId);
      const placementsResponse = await PlacedRectangleService.getByRoll(roll.id);
      const items = Array.isArray(placementsResponse.data) ? placementsResponse.data : [];
      setPlacements(items);
      await refreshRoll(roll.id);
      if (editingPlacementId === placementId) {
        cancelEditPlacement();
      }
    } catch (err) {
      console.error(err);
      setError(t('rollDetail.failedToUpdate'));
    }
  };

  const handleClearPlacements = async () => {
    if (!roll) return;
    if (placements.some(isCommandePlacement)) {
      setCommandePlacementError();
      return;
    }
    if (!window.confirm('Clear all placements for this roll?')) return;
    try {
      await PlacedRectangleService.clearByRoll(roll.id);
      setPlacements([]);
      await refreshRoll(roll.id);
      cancelEditPlacement();
    } catch (err) {
      console.error(err);
      setError(t('rollDetail.failedToUpdate'));
    }
  };

  const statusOptions = statuses.map((status) => ({ label: t(`statuses.${status}`), value: status }));
  const usedAreaM2 = roll?.usedAreaM2 ?? roll?.totalWasteAreaM2 ?? 0;
  const availableAreaM2 = roll?.availableAreaM2 ?? (roll?.areaM2 ? roll.areaM2 - usedAreaM2 : 0);
  const wastePercent = roll?.areaM2 ? (usedAreaM2 / roll.areaM2) * 100 : 0;
  const rollWidthMm = Number(roll?.widthRemainingMm ?? roll?.widthMm ?? 0);
  const rollLengthM = Number(roll?.lengthRemainingM ?? roll?.lengthM ?? 0);
  const rollLengthMm = Number.isFinite(rollLengthM) ? Math.round(rollLengthM * 1000) : 0;
  const placementsWidthMm = placements.length
    ? Math.max(...placements.map((placement) => placement.xMm + placement.widthMm))
    : 0;
  const placementsLengthMm = placements.length
    ? Math.max(...placements.map((placement) => placement.yMm + placement.heightMm))
    : 0;
  const placementWidthMm = rollWidthMm > 0 ? rollWidthMm : placementsWidthMm;
  const placementLengthMm = rollLengthMm > 0 ? rollLengthMm : placementsLengthMm;
  const isSameColor = (first?: string | null, second?: string | null) =>
    Boolean(first && second && first.toLowerCase() === second.toLowerCase());
  const fallbackPlacementFill = '#ff6f00';
  const fallbackPlacementStroke = '#e65100';
  const getPlacementFill = (placement: PlacedRectangle) => {
    if (!placement.colorHexCode) return fallbackPlacementFill;
    if (isSameColor(placement.colorHexCode, roll?.colorHexCode)) return fallbackPlacementFill;
    return placement.colorHexCode;
  };
  const getPlacementStroke = (placement: PlacedRectangle) => {
    if (!placement.colorHexCode) return fallbackPlacementStroke;
    if (isSameColor(placement.colorHexCode, roll?.colorHexCode)) return fallbackPlacementStroke;
    return placement.colorHexCode;
  };
  const chuteActionsBody = (piece: WastePiece) => (
    piece.wasteType !== 'DECHET' ? (
      <Button
        icon="pi pi-eye"
        text
        onClick={() => navigate(`/chute/${piece.id}`)}
        aria-label={t('common.view')}
      />
    ) : null
  );

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

  const rollSummary = getRollChuteSummary(roll);

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
            <div><strong>{t('inventory.reference') || 'Reference'}:</strong> {rollSummary.reference}</div>
            <div><strong>{t('rollDetail.material')}:</strong> <Tag value={roll.materialType} style={{ backgroundColor: roll.colorHexCode }} /></div>
            <div><strong>{t('inventory.color') || 'Color'}:</strong> {rollSummary.color}</div>
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
            <div><strong>{t('rollDetail.totalWaste')}:</strong> {usedAreaM2.toFixed(2)} m²</div>
            <div><strong>{t('inventory.availableArea')}:</strong> {availableAreaM2.toFixed(2)} m²</div>
            <div><strong>{t('rollDetail.totalCuts')}:</strong> {roll.totalCuts}</div>
            <div><strong>{t('rollDetail.lengthRemaining')}:</strong> {roll.lengthRemainingM ? roll.lengthRemainingM.toFixed(2) : roll.lengthM.toFixed(2)} m</div>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <ProgressBar value={Math.max(0, 100 - wastePercent)} />
            <div style={{ marginTop: '0.25rem' }}>{(100 - wastePercent).toFixed(1)}% {t('rollDetail.available')}</div>
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

        <Card title={t('rollDetail.placements') || 'Placements (SVG)'}>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {error && <Message severity="error" text={error} />}
            {placementWidthMm > 0 && placementLengthMm > 0 ? (
              <div
                style={{
                  border: '1px solid var(--surface-border)',
                  borderRadius: '8px',
                  padding: '0.5rem',
                  background: 'var(--surface-card)',
                }}
              >
                <svg
                  viewBox={`0 0 ${Math.max(1, placementLengthMm)} ${Math.max(1, placementWidthMm)}`}
                  width="100%"
                  height="240"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <rect
                    x={0}
                    y={0}
                    width={placementLengthMm}
                    height={placementWidthMm}
                    fill={roll?.colorHexCode || '#f5f5f5'}
                    stroke="#bdbdbd"
                    strokeWidth={2}
                  />
                  {placements.map((placement) => (
                    <g key={placement.id}>
                      <rect
                        x={placement.yMm}
                        y={placement.xMm}
                        width={placement.heightMm}
                        height={placement.widthMm}
                        fill={getPlacementFill(placement)}
                        fillOpacity={0.35}
                        stroke={getPlacementStroke(placement)}
                        strokeWidth={1}
                      />
                      <text
                        x={placement.yMm + 4}
                        y={placement.xMm + 14}
                        fontSize={12}
                        fill="#111111"
                        stroke="#ffffff"
                        strokeWidth={2}
                        paintOrder="stroke"
                        pointerEvents="none"
                      >
                        {`${placement.widthMm}x${placement.heightMm}`}
                      </text>
                    </g>
                  ))}
                </svg>
                <div style={{ marginTop: '0.35rem', fontSize: '0.85rem', color: 'var(--text-color-secondary)' }}>
                  {placementLengthMm / 1000}m x {placementWidthMm}mm ( {t('rollDetail.length')} on X, {t('rollDetail.width')} on Y)
                  {' '}•  {t('rollDetail.width')}: {placementWidthMm}mm • {t('rollDetail.height')}: {placementLengthMm}mm
                </div>
              </div>
            ) : (
              <Message severity="info" text={t('rollDetail.sourceDimensionsRequired') || 'Source dimensions are required for placement preview.'} />
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ fontWeight: 600 }}> {t('rollDetail.placements')}</div>
              {placements.length > 0 && (
                <Button
                  label={t('rollDetail.clearRoll') || 'Clear roll'}
                  icon="pi pi-trash"
                  severity="danger"
                  outlined
                  onClick={handleClearPlacements}
                  disabled={placements.some(isCommandePlacement)}
                />
              )}
            </div>

            {placements.length === 0 ? (
              <Message severity="info" text={t('rollDetail.noPlacements') || 'No placements recorded for this roll.'} />
            ) : (
              <div className="albel-compact-list">
                {placements.map((placement) => (
                  <div key={placement.id} className="albel-compact-item">
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span>x:{placement.xMm} y:{placement.yMm}</span>
                      <span>{placement.widthMm} x {placement.heightMm} mm</span>
                      <span>Width: {placement.widthMm}mm • Height: {placement.heightMm}mm</span>
                      {placement.commandeItemId && (
                        <span>Item: {placement.commandeItemId}</span>
                      )}
                      {placement.colorHexCode && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span
                            style={{
                              width: '12px',
                              height: '12px',
                              backgroundColor: placement.colorHexCode,
                              borderRadius: '3px',
                              border: '1px solid var(--surface-border)',
                            }}
                          />
                          {placement.colorName || placement.colorHexCode}
                        </span>
                      )}
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button
                          label={t('rollDetail.edit') || 'Edit'}
                          icon="pi pi-pencil"
                          outlined
                          onClick={() => startEditPlacement(placement)}
                          disabled={isCommandePlacement(placement)}
                        />
                        <Button
                          label={t('rollDetail.delete') || 'Delete'}
                          icon="pi pi-trash"
                          severity="danger"
                          outlined
                          onClick={() => handleDeletePlacement(placement.id)}
                          disabled={isCommandePlacement(placement)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div style={{ fontWeight: 600 }}>{editingPlacementId ? t('rollDetail.updatePlacement') || 'Update placement' : t('rollDetail.addPlacement') || 'Add placement'}</div>
              <div className="albel-grid albel-grid--min140" style={{ gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>X ({t('rollDetail.lengthMm') || 'length mm'})</label>
                  <InputText
                    value={placementForm.xMm}
                    onChange={(e) => updatePlacementField('xMm', e.target.value)}
                    type="number"
                    min={0}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>Y ({t('rollDetail.widthMm') || 'width mm'})</label>
                  <InputText
                    value={placementForm.yMm}
                    onChange={(e) => updatePlacementField('yMm', e.target.value)}
                    type="number"
                    min={0}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}> ({t('rollDetail.widthMm') || 'width mm'})</label>
                  <InputText
                    value={placementForm.widthMm}
                    onChange={(e) => updatePlacementField('widthMm', e.target.value)}
                    type="number"
                    min={1}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}> ({t('rollDetail.heightMm') || 'height mm'})</label>
                  <InputText
                    value={placementForm.heightMm}
                    onChange={(e) => updatePlacementField('heightMm', e.target.value)}
                    type="number"
                    min={1}
                  />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <Button
                    label={creatingPlacement ? t('rollDetail.saving') || 'Saving...' : (editingPlacementId ? t('rollDetail.updatePlacement') || 'Update placement' : t('rollDetail.savePlacement') || 'Save placement')}
                    icon={editingPlacementId ? 'pi pi-check' : 'pi pi-plus'}
                    onClick={handleCreatePlacement}
                    loading={creatingPlacement}
                  />
                  {editingPlacementId && (
                    <Button
                      label={t('rollDetail.cancel') || 'Cancel'}
                      severity="secondary"
                      outlined
                      onClick={cancelEditPlacement}
                    />
                  )}
                </div>
              </div>
            </div>
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
              <Column header={t('waste.tableActions')} body={chuteActionsBody} />
            </DataTable>
          )}
        </Card>
      </div>
    </div>
  );
}

export default RollDetailPage;
