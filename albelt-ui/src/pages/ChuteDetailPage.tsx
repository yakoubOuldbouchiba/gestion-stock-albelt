import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { PlacedRectangle, Roll, WastePiece } from '../types/index';
import { RollService } from '../services/rollService';
import { WastePieceService } from '../services/wastePieceService';
import { PlacedRectangleService } from '../services/placedRectangleService';
import { useI18n } from '@hooks/useI18n';
import { formatDate } from '../utils/date';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import { InputText } from 'primereact/inputtext';

export function ChuteDetailPage() {
  const { t } = useI18n();
  const { wasteId } = useParams<{ wasteId: string }>();
  const navigate = useNavigate();

  const [wastePiece, setWastePiece] = useState<WastePiece | null>(null);
  const [parentWaste, setParentWaste] = useState<WastePiece | null>(null);
  const [roll, setRoll] = useState<Roll | null>(null);
  const [placements, setPlacements] = useState<PlacedRectangle[]>([]);
  const [creatingPlacement, setCreatingPlacement] = useState(false);
  const [placementForm, setPlacementForm] = useState({
    xMm: '',
    yMm: '',
    widthMm: '',
    heightMm: '',
  });
  const [editingPlacementId, setEditingPlacementId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isCommandePlacement = (placement: PlacedRectangle) =>
    Boolean((placement as any).commandeItemId || (placement as any).commandeItem?.id);

  const setCommandePlacementError = () => {
    setError('This placement is linked to an order. Edit/delete it from the commande page.');
  };

  useEffect(() => {
    loadWastePiece();
  }, [wasteId]);

  const refreshWastePiece = async (id: string) => {
    try {
      const response = await WastePieceService.getById(id);
      if (response.success && response.data) {
        setWastePiece(response.data);
      }
    } catch (err) {
      console.error(err);
      setError(t('waste.failedToLoadData'));
    }
  };

  const loadWastePiece = async () => {
    if (!wasteId) {
      setIsLoading(false);
      setWastePiece(null);
      setError(t('waste.noPiecesFound'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await WastePieceService.getById(wasteId);
      if (!response.success || !response.data) {
        setWastePiece(null);
        setError(t('waste.failedToLoadData'));
        return;
      }

      const piece = response.data;
      setWastePiece(piece);

      const emptyResponse = { success: false, data: null, message: '', timestamp: '' };
      const [rollResponse, parentResponse, placementsResponse] = await Promise.all([
        piece.rollId ? RollService.getById(piece.rollId) : Promise.resolve(emptyResponse),
        piece.parentWastePieceId
          ? WastePieceService.getById(piece.parentWastePieceId)
          : Promise.resolve(emptyResponse),
        PlacedRectangleService.getByWastePiece(piece.id),
      ]);

      setRoll(rollResponse.success && rollResponse.data ? rollResponse.data : null);
      setParentWaste(parentResponse.success && parentResponse.data ? parentResponse.data : null);
      if (placementsResponse.success && placementsResponse.data) {
        setPlacements(Array.isArray(placementsResponse.data) ? placementsResponse.data : []);
      } else {
        setPlacements([]);
      }
    } catch (err) {
      console.error(err);
      setError(t('waste.failedToLoadData'));
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusSeverity = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'success';
      case 'OPENED':
        return 'warning';
      case 'EXHAUSTED':
        return 'secondary';
      case 'ARCHIVED':
        return 'secondary';
      default:
        return undefined;
    }
  };

  const getWasteTypeSeverity = (type: string | undefined) => {
    if (type === 'CHUTE_EXPLOITABLE') return 'success';
    if (type === 'DECHET') return 'warning';
    return undefined;
  };

  const updatePlacementField = (name: keyof typeof placementForm, value: string) => {
    setPlacementForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreatePlacement = async () => {
    if (!wastePiece) return;
    const isEditing = editingPlacementId !== null;
    const xMm = parseInt(placementForm.xMm, 10);
    const yMm = parseInt(placementForm.yMm, 10);
    const widthMm = parseInt(placementForm.widthMm, 10);
    const heightMm = parseInt(placementForm.heightMm, 10);

    if ([xMm, yMm, widthMm, heightMm].some((value) => Number.isNaN(value))) {
      setError('Placement dimensions are required.');
      return;
    }

    const sourceWidthMm = Number(wastePiece.widthRemainingMm ?? wastePiece.widthMm ?? 0);
    const sourceLengthMm = Math.round(Number(wastePiece.lengthRemainingM ?? wastePiece.lengthM ?? 0) * 1000);
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
          wastePieceId: wastePiece.id,
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

      const placementsResponse = await PlacedRectangleService.getByWastePiece(wastePiece.id);
      if (placementsResponse.success && placementsResponse.data) {
        setPlacements(Array.isArray(placementsResponse.data) ? placementsResponse.data : []);
      } else {
        setPlacements([]);
      }
      await refreshWastePiece(wastePiece.id);
      setPlacementForm({ xMm: '', yMm: '', widthMm: '', heightMm: '' });
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
    });
  };

  const cancelEditPlacement = () => {
    setEditingPlacementId(null);
    setPlacementForm({ xMm: '', yMm: '', widthMm: '', heightMm: '' });
  };

  const handleDeletePlacement = async (placementId: string) => {
    if (!wastePiece) return;
    const placement = placements.find((p) => p.id === placementId);
    if (placement && isCommandePlacement(placement)) {
      setCommandePlacementError();
      return;
    }
    if (!window.confirm('Delete this placement?')) return;
    try {
      await PlacedRectangleService.delete(placementId);
      const placementsResponse = await PlacedRectangleService.getByWastePiece(wastePiece.id);
      const items = Array.isArray(placementsResponse.data) ? placementsResponse.data : [];
      setPlacements(items);
      await refreshWastePiece(wastePiece.id);
      if (editingPlacementId === placementId) {
        cancelEditPlacement();
      }
    } catch (err) {
      console.error(err);
      setError(t('rollDetail.failedToUpdate'));
    }
  };

  const handleClearPlacements = async () => {
    if (!wastePiece) return;
    if (placements.some(isCommandePlacement)) {
      setCommandePlacementError();
      return;
    }
    if (!window.confirm('Clear all placements for this chute?')) return;
    try {
      await PlacedRectangleService.clearByWastePiece(wastePiece.id);
      setPlacements([]);
      await refreshWastePiece(wastePiece.id);
      cancelEditPlacement();
    } catch (err) {
      console.error(err);
      setError(t('rollDetail.failedToUpdate'));
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <ProgressSpinner />
      </div>
    );
  }

  if (!wastePiece) {
    return (
      <div>
        <Message severity="error" text={error || t('waste.noPiecesFound')} />
        <Button
          label={t('rollDetail.backToInventory')}
          icon="pi pi-arrow-left"
          onClick={() => navigate('/inventory')}
        />
      </div>
    );
  }

  const renderChuteCards = (piece: WastePiece, heading?: string, showPreview = true) => {
    const altierLabel = piece.altierLibelle || t('rollDetail.unassigned');
    const colorLabel = piece.colorName || piece.colorHexCode || 'N/A';
    const previewWidthMm = piece.widthMm || 0;
    const previewLengthMm = piece.lengthM ? Math.round(piece.lengthM * 1000) : 0;
    const previewFill = piece.colorHexCode || '#f5f5f5';

    return (
      <div style={{ display: 'grid', gap: '1rem' }}>
        {heading && <h2 style={{ margin: '0.5rem 0 0' }}>{heading}</h2>}
        <Card title={t('rollDetail.basicInfo')}>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <div><strong>{t('waste.detailWasteId')}:</strong> {piece.id}</div>
            {piece.reference && (
              <div><strong>{t('inventory.reference') || 'Reference'}:</strong> {piece.reference}</div>
            )}
            {piece.rollId && (
              <div><strong>{t('rollDetail.rollId')}:</strong> {piece.rollId}</div>
            )}
            <div><strong>{t('rollDetail.supplier')}:</strong> {piece.supplierName || 'N/A'}</div>
            <div><strong>{t('rollDetail.workshop')}:</strong> {altierLabel}</div>
            <div><strong>{t('waste.detailCreated')}:</strong> {formatDate(piece.createdAt)}</div>
          </div>
        </Card>

        <Card title={t('rollDetail.materialSpecs')}>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <div><strong>{t('rollDetail.material')}:</strong> {piece.materialType}</div>
            <div><strong>{t('rollDetail.plies')}:</strong> {piece.nbPlis}</div>
            <div><strong>{t('rollDetail.thickness')}:</strong> {piece.thicknessMm} mm</div>
            <div><strong>{t('inventory.color') || 'Color'}:</strong> {colorLabel}</div>
          </div>
        </Card>

        <Card title={t('rollDetail.dimensions')}>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <div><strong>{t('rollDetail.width')}:</strong> {piece.widthMm} mm</div>
            <div><strong>{t('rollDetail.length')}:</strong> {piece.lengthM.toFixed(2)} m</div>
            <div><strong>{t('rollDetail.area')}:</strong> {piece.areaM2.toFixed(2)} m2</div>
          </div>
        </Card>

        {showPreview && (
          <Card title="Preview (SVG)">
            {previewWidthMm > 0 && previewLengthMm > 0 ? (
              <div
                style={{
                  border: '1px solid var(--surface-border)',
                  borderRadius: '8px',
                  padding: '0.5rem',
                  background: 'var(--surface-card)',
                }}
              >
                <svg
                  viewBox={`0 0 ${Math.max(1, previewLengthMm)} ${Math.max(1, previewWidthMm)}`}
                  width="100%"
                  height="240"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <rect
                    x={0}
                    y={0}
                    width={previewLengthMm}
                    height={previewWidthMm}
                    fill={previewFill}
                    stroke="#bdbdbd"
                    strokeWidth={2}
                  />
                </svg>
                <div style={{ marginTop: '0.35rem', fontSize: '0.85rem', color: 'var(--text-color-secondary)' }}>
                  {previewLengthMm / 1000}m x {previewWidthMm}mm (length on X, width on Y)
                </div>
              </div>
            ) : (
              <Message severity="info" text="Source dimensions are required for preview." />
            )}
          </Card>
        )}

        <Card title={t('rollDetail.processing') || 'Processing'}>
          {(() => {
            const usedAreaM2 = piece.usedAreaM2 ?? piece.totalWasteAreaM2 ?? 0;
            const availableAreaM2 = piece.availableAreaM2 ?? (piece.areaM2 - usedAreaM2);
            return (
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <div><strong>{t('rollDetail.totalCuts')}:</strong> {piece.totalCuts}</div>
            <div><strong>{t('rollDetail.totalWaste')}:</strong> {usedAreaM2.toFixed(2)} m2</div>
            <div><strong>{t('inventory.availableArea')}:</strong> {availableAreaM2.toFixed(2)} m2</div>
            <div><strong>Last processing:</strong> {piece.lastProcessingDate ? formatDate(piece.lastProcessingDate) : 'N/A'}</div>
          </div>
            );
          })()}
        </Card>

        <Card title={t('rollDetail.statusTracking') || 'Status & Tracking'}>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <div><strong>{t('rollDetail.status')}:</strong> {t(`statuses.${piece.status}`)}</div>
            <div><strong>{t('waste.tableType') || 'Type'}:</strong> {t(`waste.types.${piece.wasteType}`) || 'N/A'}</div>
            <div><strong>{t('rollDetail.qrCode') || 'QR Code'}:</strong> {piece.qrCode || 'N/A'}</div>
            <div><strong>{t('rollDetail.classificationDate') || 'Classification date'}:</strong> {piece.classificationDate ? formatDate(piece.classificationDate) : 'N/A'}</div>
          </div>
        </Card>
      </div>
    );
  };

  const isSameColor = (first?: string | null, second?: string | null) =>
    Boolean(first && second && first.toLowerCase() === second.toLowerCase());
  const fallbackPlacementFill = '#ff6f00';
  const fallbackPlacementStroke = '#e65100';
  const getPlacementFill = (placement: PlacedRectangle) => {
    if (!placement.colorHexCode) return fallbackPlacementFill;
    if (isSameColor(placement.colorHexCode, wastePiece.colorHexCode)) return fallbackPlacementFill;
    return placement.colorHexCode;
  };
  const getPlacementStroke = (placement: PlacedRectangle) => {
    if (!placement.colorHexCode) return fallbackPlacementStroke;
    if (isSameColor(placement.colorHexCode, wastePiece.colorHexCode)) return fallbackPlacementStroke;
    return placement.colorHexCode;
  };
  const chuteWidthMm = wastePiece.widthRemainingMm ?? wastePiece.widthMm;
  const chuteLengthMm = Math.round((wastePiece.lengthRemainingM ?? wastePiece.lengthM) * 1000);
  const placementsWidthMm = placements.length
    ? Math.max(...placements.map((placement) => placement.xMm + placement.widthMm))
    : 0;
  const placementsLengthMm = placements.length
    ? Math.max(...placements.map((placement) => placement.yMm + placement.heightMm))
    : 0;
  const placementWidthMm = chuteWidthMm > 0 ? chuteWidthMm : placementsWidthMm;
  const placementLengthMm = chuteLengthMm > 0 ? chuteLengthMm : placementsLengthMm;

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
          <h1 style={{ margin: 0 }}>{t('waste.wasteDetailsTitle') || 'Chute Details'}</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {wastePiece.wasteType && (
            <Tag value={wastePiece.wasteType} severity={getWasteTypeSeverity(wastePiece.wasteType)} />
          )}
          <Tag value={wastePiece.materialType} />
          <Tag value={t(`waste.status.${wastePiece.status}`)} severity={getStatusSeverity(wastePiece.status)} />
          <Button
            label={t('navigation.movements') || 'Movements'}
            icon="pi pi-share-alt"
            onClick={() => navigate(`/chute/${wastePiece.id}/movements`)}
          />
          {wastePiece.rollId && (
            <Button
              label={`${t('common.view')} ${t('inventory.roll')}`}
              icon="pi pi-eye"
              onClick={() => navigate(`/roll/${wastePiece.rollId}`)}
            />
          )}
        </div>
      </div>

      {error && <Message severity="error" text={error} />}

      <div style={{ display: 'grid', gap: '1rem' }}>
        {renderChuteCards(wastePiece, undefined, false)}

        <Card title={` ${t('rollDetail.placements') || 'Placements'}`}>
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
                    fill={wastePiece.colorHexCode || '#f5f5f5'}
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
                  {placementLengthMm / 1000}m x {placementWidthMm}mm ( {t('rollDetail.lengthOnX') || 'length on X'}, {t('rollDetail.widthOnY') || 'width on Y'})
                </div>
              </div>
            ) : (
              <Message severity="info" text={t('rollDetail.sourceDimensionsRequired') || 'Source dimensions are required for placement preview.'} />
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ fontWeight: 600 }}>{t('rollDetail.existingPlacements') || 'Existing placements'}</div>
              {placements.length > 0 && (
                <Button
                  label={` ${t('rollDetail.clearChute') || 'Clear chute'}`}
                  icon="pi pi-trash"
                  severity="danger"
                  outlined
                  onClick={handleClearPlacements}
                  disabled={placements.some(isCommandePlacement)}
                />
              )}
            </div>

            {placements.length === 0 ? (
              <Message severity="info" text={t('rollDetail.noPlacements') || 'No placements recorded for this chute.'} />
            ) : (
              <div className="albel-compact-list">
                {placements.map((placement) => (
                  <div key={placement.id} className="albel-compact-item">
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span>x:{placement.xMm} y:{placement.yMm}</span>
                      <span>{placement.widthMm} x {placement.heightMm} mm</span>
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
                      {/* Display commande reference if exists */}
                      {placement.commandeItem?.reference && (
                        <span style={{ fontStyle: 'italic', color: '#3b82f6' }}>
                          Ref commande: {placement.commandeItem.reference}
                        </span>
                      )}
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button
                          label="Edit"
                          icon="pi pi-pencil"
                          outlined
                          onClick={() => startEditPlacement(placement)}
                          disabled={isCommandePlacement(placement)}
                        />
                        <Button
                          label="Delete"
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
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>X ({t('rollDetail.lengthOnX') || 'Length on X'})</label>
                  <InputText
                    value={placementForm.xMm}
                    onChange={(e) => updatePlacementField('xMm', e.target.value)}
                    type="number"
                    min={0}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>Y ({t('rollDetail.widthOnY') || 'Width on Y'})</label>
                  <InputText
                    value={placementForm.yMm}
                    onChange={(e) => updatePlacementField('yMm', e.target.value)}
                    type="number"
                    min={0}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>Width (mm)</label>
                  <InputText
                    value={placementForm.widthMm}
                    onChange={(e) => updatePlacementField('widthMm', e.target.value)}
                    type="number"
                    min={1}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>{t('rollDetail.heightMm') || 'Height (mm)'}</label>
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

        {parentWaste && renderChuteCards(parentWaste, t('waste.detailParentWaste') || 'Parent Chute')}
        {wastePiece.parentWastePieceId && !parentWaste && (
          <Message
            severity="info"
            text={t('waste.parentChuteNotAvailable', { id: wastePiece.parentWastePieceId }) || `Parent chute not available (${wastePiece.parentWastePieceId}).`}
          />
        )}

        {roll && (
          <Card title={t('rollDetail.basicInfo') || 'Roll'}>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <div><strong>{t('rollDetail.rollId')}:</strong> {roll.id}</div>
              <div><strong>{t('rollDetail.material')}:</strong> {roll.materialType}</div>
              <div><strong>{t('rollDetail.dimensions')}:</strong> {roll.widthMm} mm x {roll.lengthM} m</div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

export default ChuteDetailPage;
