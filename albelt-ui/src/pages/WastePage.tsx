import { useEffect, useState } from 'react';
import type { WastePiece, CuttingOperation, Roll, MaterialType, WasteStatus } from '../types/index';
import { WastePieceService } from '@services/wastePieceService';
import { CuttingOperationService } from '@services/cuttingOperationService';
import { RollService } from '@services/rollService';
import { useI18n } from '@hooks/useI18n';
import { formatDate } from '../utils/date';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { Tag } from 'primereact/tag';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Checkbox } from 'primereact/checkbox';
import { Message } from 'primereact/message';
import { formatRollChuteLabel, getRollChuteSummary } from '@utils/rollChuteLabel';

export function WastePage() {
  const { t } = useI18n();
  const [wastePieces, setWastePieces] = useState<WastePiece[]>([]);
  const [totalWasteElements, setTotalWasteElements] = useState(0);
  // Grouped stats state
  const [showGrouped, setShowGrouped] = useState(false);
  const [groupedStats, setGroupedStats] = useState<any[]>([]);
  const [groupedLoading, setGroupedLoading] = useState(false);
    // Fetch grouped stats when toggled on
    useEffect(() => {
      if (showGrouped) {
        setGroupedLoading(true);
        WastePieceService.getGroupedByAllFields('DECHET').then(res => {
          if (res.success && res.data) {
            setGroupedStats(res.data);
          } else {
            setGroupedStats([]);
          }
          setGroupedLoading(false);
        }).catch(() => {
          setGroupedStats([]);
          setGroupedLoading(false);
        });
      }
    }, [showGrouped]);
  const [cuttingOperations, setCuttingOperations] = useState<CuttingOperation[]>([]);
  const [rolls, setRolls] = useState<Roll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | WasteStatus>('ALL');
  const [materialFilter, setMaterialFilter] = useState<'ALL' | MaterialType>('ALL');
  const [selectedWaste, setSelectedWaste] = useState<WastePiece | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showReuseModal, setShowReuseModal] = useState(false);
  const [selectedForReuse, setSelectedForReuse] = useState<WastePiece | null>(null);
  const [reuseInOperation, setReuseInOperation] = useState('');

  // Statistics
  const [stats, setStats] = useState({
    totalAvailable: 0,
    totalUsed: 0,
    totalScrap: 0,
    totalWasteArea: 0,
    reuseEfficiency: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (showGrouped) return;
    loadWastePieces();
  }, [searchTerm, statusFilter, materialFilter, showGrouped]);

  const loadWastePieces = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await WastePieceService.getAll({
        page: 0,
        size: 200,
        search: searchTerm || undefined,
        materialType: materialFilter === 'ALL' ? undefined : materialFilter,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      });
      const data = response.data;
      if (response.success && data) {
        setWastePieces(data.items || []);
        setTotalWasteElements(data.totalElements || 0);
      } else {
        setWastePieces([]);
        setTotalWasteElements(0);
      }
    } catch (err) {
      setError(t('waste.failedToLoadData'));
      console.error(err);
      setWastePieces([]);
      setTotalWasteElements(0);
    } finally {
      setIsLoading(false);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [wasteResponse, operationsResponse, rollsResponse] = await Promise.all([
        WastePieceService.getAll({ page: 0, size: 200 }),
        CuttingOperationService.getAll(),
        RollService.getAll(),
      ]);

      if (wasteResponse.success && wasteResponse.data) {
        setWastePieces(wasteResponse.data.items || []);
        setTotalWasteElements(wasteResponse.data.totalElements || 0);
      }
      if (operationsResponse.success && operationsResponse.data) {
        setCuttingOperations(operationsResponse.data);
      }
      if (rollsResponse.success && rollsResponse.data) {
        setRolls(rollsResponse.data.items || []);
      }

      // Calculate statistics (query-based counts)
      const [availableRes, openedRes, archivedRes] = await Promise.all([
        WastePieceService.countByStatus('AVAILABLE'),
        WastePieceService.countByStatus('OPENED'),
        WastePieceService.countByStatus('ARCHIVED'),
      ]);

      const available = availableRes.success ? (availableRes.data || 0) : 0;
      const opened = openedRes.success ? (openedRes.data || 0) : 0;
      const archived = archivedRes.success ? (archivedRes.data || 0) : 0;
      const totalArea = (wasteResponse.data?.items || []).reduce(
        (sum, w) => sum + (w.usedAreaM2 ?? w.totalWasteAreaM2 ?? w.areaM2 ?? 0),
        0
      );

      setStats({
        totalAvailable: available,
        totalUsed: opened,
        totalScrap: archived,
        totalWasteArea: totalArea,
        reuseEfficiency: available + opened > 0 ? ((opened / (available + opened)) * 100) : 0,
      });
    } catch (err) {
      setError(t('waste.failedToLoadData'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsScrap = async (wasteId: string) => {
    if (!window.confirm(t('waste.confirmMarkArchive'))) return;

    try {
      const response = await WastePieceService.markAsScrap(wasteId);
      if (response.success && response.data) {
        setWastePieces(wastePieces.map(w => (w.id === wasteId ? response.data! : w)));
        setShowDetail(false);
      }
    } catch (err) {
      setError(t('waste.failedToMarkArchive'));
      console.error(err);
    }
  };

  const handleMarkAsUsed = async () => {
    if (!selectedForReuse || !reuseInOperation) {
      setError(t('waste.selectCuttingOp'));
      return;
    }

    try {
      const response = await WastePieceService.markAsUsed(selectedForReuse.id);
      if (response.success && response.data) {
        setWastePieces(wastePieces.map(w => (w.id === selectedForReuse.id ? response.data! : w)));
        setShowReuseModal(false);
        setSelectedForReuse(null);
        setReuseInOperation('');
      }
    } catch (err) {
      setError(t('waste.failedToMarkUsed'));
      console.error(err);
    }
  };

  const getStatusSeverity = (status: WasteStatus) => {
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

  const getStatusLabel = (status: WasteStatus): string => {
    switch (status) {
      case 'AVAILABLE':
        return t('waste.statusAvailable');
      case 'OPENED':
        return t('waste.statusOpened');
      case 'EXHAUSTED':
        return t('waste.statusExhausted');
      case 'ARCHIVED':
        return t('waste.statusArchived');
      default:
        return status;
    }
  };

  const statusOptions = [
    { label: t('waste.all'), value: 'ALL' },
    { label: t('waste.statusAvailable'), value: 'AVAILABLE' },
    { label: t('waste.statusOpened'), value: 'OPENED' },
    { label: t('waste.statusExhausted'), value: 'EXHAUSTED' },
    { label: t('waste.statusArchived'), value: 'ARCHIVED' },
  ];

  const materialOptions = [
    { label: t('waste.allMaterials'), value: 'ALL' },
    { label: 'PU', value: 'PU' },
    { label: 'PVC', value: 'PVC' },
    { label: 'CAOUTCHOUC', value: 'CAOUTCHOUC' },
  ];

  const groupedColumns = (
    <>
      <Column header={t('inventory.color') || 'Color'} body={(row: any[]) => row[0] || '-'} />
      <Column header={t('rolls.plies') || 'Nb Plis'} body={(row: any[]) => row[1]} />
      <Column header={t('rolls.thickness') || 'Thickness (mm)'} body={(row: any[]) => row[2]} />
      <Column header={t('inventory.material') || 'Material'} body={(row: any[]) => row[3]} />
      <Column header={t('sidebar.workshops') || 'Workshop'} body={(row: any[]) => row[4]} />
      <Column header={t('inventory.status') || 'Status'} body={(row: any[]) => row[5]} />
      <Column header={t('inventory.count') || 'Count'} body={(row: any[]) => row[6]} />
      <Column header={t('inventory.totalArea') || 'Total Area (m²)'} body={(row: any[]) => row[7] ? Number(row[7]).toFixed(2) : '0.00'} />
    </>
  );

  const detailFooter = (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
      {selectedWaste?.status === 'AVAILABLE' && (
        <>
          <Button
            label={t('waste.markAsUsed')}
            icon="pi pi-replay"
            onClick={() => {
              if (!selectedWaste) return;
              setSelectedForReuse(selectedWaste);
              setShowReuseModal(true);
              setShowDetail(false);
            }}
          />
          <Button
            label={t('waste.markAsArchived')}
            icon="pi pi-trash"
            severity="danger"
            onClick={() => selectedWaste && handleMarkAsScrap(selectedWaste.id)}
          />
        </>
      )}
      <Button label={t('waste.close')} severity="secondary" onClick={() => setShowDetail(false)} />
    </div>
  );

  const reuseFooter = (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
      <Button label={t('waste.confirmReuse')} onClick={handleMarkAsUsed} />
      <Button
        label={t('waste.cancel')}
        severity="secondary"
        onClick={() => {
          setShowReuseModal(false);
          setSelectedForReuse(null);
          setReuseInOperation('');
        }}
      />
    </div>
  );

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <div>
      <div className="albel-page-header" style={{ marginBottom: '1rem' }}>
        <h1 className="albel-page-title">{t('waste.title')}</h1>
        <Button icon="pi pi-refresh" label={t('waste.refreshData')} onClick={loadData} />
      </div>

      {error && <Message severity="error" text={error} />}

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <Checkbox
          inputId="groupedWasteStats"
          checked={showGrouped}
          onChange={(e) => setShowGrouped(!!e.checked)}
        />
        <label htmlFor="groupedWasteStats">{t('waste.showGroupedStats') || 'Show Grouped Statistics'}</label>
      </div>

      {showGrouped && (
        <div style={{ marginBottom: '1rem' }}>
          {groupedLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
              <ProgressSpinner />
            </div>
          ) : groupedStats.length === 0 ? (
            <Message severity="info" text={t('waste.noGroupedStats') || 'No grouped statistics found.'} />
          ) : (
            <DataTable value={groupedStats} size="small">
              {groupedColumns}
            </DataTable>
          )}
        </div>
      )}

      {!showGrouped && (
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div className="albel-dashboard__stats">
            <div className="albel-stat">
              <div className="albel-stat__label">{t('waste.availableForReuse')}</div>
              <div className="albel-stat__value">{stats.totalAvailable}</div>
              <div className="albel-stat__meta">{stats.totalWasteArea.toFixed(2)} m²</div>
            </div>
            <div className="albel-stat">
              <div className="albel-stat__label">{t('waste.successfullyReused')}</div>
              <div className="albel-stat__value">{stats.totalUsed}</div>
              <div className="albel-stat__meta">
                {stats.totalAvailable + stats.totalUsed > 0
                  ? ((stats.totalUsed / (stats.totalAvailable + stats.totalUsed)) * 100).toFixed(1)
                  : 0}%
              </div>
            </div>
            <div className="albel-stat">
              <div className="albel-stat__label">{t('waste.scrapDiscarded')}</div>
              <div className="albel-stat__value">{stats.totalScrap}</div>
              <div className="albel-stat__meta">
                {stats.totalAvailable + stats.totalScrap > 0
                  ? ((stats.totalScrap / (stats.totalAvailable + stats.totalScrap)) * 100).toFixed(1)
                  : 0}%
              </div>
            </div>
            <div className="albel-stat">
              <div className="albel-stat__label">{t('waste.reuseEfficiency')}</div>
              <div className="albel-stat__value">{stats.reuseEfficiency.toFixed(1)}%</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
            <span className="p-input-icon-left">
              <i className="pi pi-search" />
              <InputText
                placeholder={t('waste.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </span>
            <Dropdown
              value={statusFilter}
              options={statusOptions}
              onChange={(e) => setStatusFilter(e.value)}
              placeholder={t('waste.filterStatus')}
            />
            <Dropdown
              value={materialFilter}
              options={materialOptions}
              onChange={(e) => setMaterialFilter(e.value)}
              placeholder={t('waste.filterMaterial')}
            />
            <span>{totalWasteElements} {t('waste.pieces')}</span>
          </div>

          <DataTable
            value={wastePieces}
            dataKey="id"
            size="small"
            emptyMessage={t('waste.noPiecesFound')}
          >
            <Column header={t('inventory.lotId') || 'Lot ID'} field="lotId" sortable style={{ width: '100px' }} />
            <Column header={t('waste.tableWasteId')} body={(waste: WastePiece) => waste.id.substring(0, 8)} />
            <Column
              header={t('waste.tableMaterial')}
              body={(waste: WastePiece) => {
                const summary = getRollChuteSummary(waste);
                return (
                  <div>
                    <Tag value={waste.materialType} severity="info" />
                    <div>Ref: {summary.reference}</div>
                    <div>Plis: {summary.nbPlis} | Thk: {summary.thickness} | Color: {summary.color}</div>
                  </div>
                );
              }}
            />
            <Column
              header={t('waste.tableDimensions')}
              body={(waste: WastePiece) => `${waste.widthMm}mm × ${waste.lengthM}m`}
            />
            <Column
              header={t('waste.tableArea')}
              body={(waste: WastePiece) => (waste.areaM2 || 0).toFixed(2)}
            />
            <Column
              header={t('waste.tableStatus')}
              body={(waste: WastePiece) => (
                <Tag value={getStatusLabel(waste.status)} severity={getStatusSeverity(waste.status)} />
              )}
            />
            <Column
              header={t('waste.tableParent')}
              body={(waste: WastePiece) => waste.parentWastePieceId ? waste.parentWastePieceId.substring(0, 8) : '-'}
            />
            <Column
              header={t('waste.tableSize')}
              body={(waste: WastePiece) => ((waste.areaM2 || 0) > 3.0) ? t('waste.large') : t('waste.small')}
            />
            <Column
              header={t('waste.tableReuse')}
              body={(waste: WastePiece) => ((waste.status === 'AVAILABLE' || waste.status === 'OPENED') && ((waste.areaM2 || 0) > 3.0)) ? t('waste.yes') : t('waste.no')}
            />
            <Column header={t('waste.tableCreated')} body={(waste: WastePiece) => formatDate(waste.createdAt)} />
            <Column
              header={t('waste.tableActions')}
              body={(waste: WastePiece) => (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button
                    label={t('waste.view')}
                    icon="pi pi-eye"
                    text
                    onClick={() => {
                      setSelectedWaste(waste);
                      setShowDetail(true);
                    }}
                  />
                  {waste.status === 'AVAILABLE' && (
                    <Button
                      label={t('waste.reuse')}
                      icon="pi pi-replay"
                      text
                      onClick={() => {
                        setSelectedForReuse(waste);
                        setShowReuseModal(true);
                      }}
                    />
                  )}
                </div>
              )}
            />
          </DataTable>
        </div>
      )}

      <Dialog
        header={t('waste.wasteDetailsTitle')}
        visible={showDetail && !!selectedWaste}
        onHide={() => setShowDetail(false)}
        footer={detailFooter}
        style={{ width: 'min(700px, 95vw)' }}
      >
        {selectedWaste && (
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <div><strong>{t('inventory.lotId') || 'Lot ID'}:</strong> {selectedWaste.lotId || 'N/A'}</div>
            <div><strong>{t('waste.detailWasteId')}:</strong> {selectedWaste.id.substring(0, 8)}</div>
            {selectedWaste.parentWastePieceId && (
              <div><strong>{t('waste.detailParentWaste') || 'Parent Waste Piece'}:</strong> {selectedWaste.parentWastePieceId.substring(0, 8)}</div>
            )}
            <div><strong>{t('inventory.reference') || 'Reference'}:</strong> {selectedWaste.reference || 'N/A'}</div>
            <div><strong>{t('waste.detailMaterial')}:</strong> {selectedWaste.materialType}</div>
            <div><strong>{t('rollDetail.plies')}:</strong> {selectedWaste.nbPlis}</div>
            <div><strong>{t('rollDetail.thickness')}:</strong> {selectedWaste.thicknessMm} mm</div>
            <div><strong>{t('inventory.color') || 'Color'}:</strong> {selectedWaste.colorName || selectedWaste.colorHexCode || 'N/A'}</div>
            <div><strong>{t('waste.detailDimensions')}:</strong> {selectedWaste.widthMm}mm × {selectedWaste.lengthM}m</div>
            <div><strong>{t('waste.detailArea')}:</strong> {(selectedWaste.areaM2 || 0).toFixed(2)} m²</div>
            <div><strong>{t('waste.detailStatus')}:</strong> {getStatusLabel(selectedWaste.status)}</div>
            <div><strong>{t('waste.detailLargeWaste')}:</strong> {((selectedWaste.areaM2 || 0) > 3.0) ? t('waste.yes') : t('waste.no')}</div>
            <div><strong>{t('waste.detailReuseCandidate')}:</strong> {((selectedWaste.status === 'AVAILABLE' || selectedWaste.status === 'OPENED') && ((selectedWaste.areaM2 || 0) > 3.0)) ? t('waste.yes') : t('waste.no')}</div>
            <div><strong>{t('waste.detailCreated')}:</strong> {formatDate(selectedWaste.createdAt)}</div>
          </div>
        )}
      </Dialog>

      <Dialog
        header={t('waste.markAsReuseTitle')}
        visible={showReuseModal && !!selectedForReuse}
        onHide={() => setShowReuseModal(false)}
        footer={reuseFooter}
        style={{ width: 'min(700px, 95vw)' }}
      >
        <p>{t('waste.reuseModalDesc')}</p>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          <label htmlFor="reuse-operation">{t('waste.cuttingOperation')} *</label>
          <Dropdown
            id="reuse-operation"
            value={reuseInOperation}
            options={cuttingOperations.map(op => ({
              label: `${op.id.substring(0, 8)} - Roll: ${rolls.find(r => r.id === op.rollId) ? formatRollChuteLabel(rolls.find(r => r.id === op.rollId)!) : 'N/A'} - Operator: ${op.operatorId}`,
              value: op.id,
            }))}
            onChange={(e) => setReuseInOperation(e.value)}
            placeholder={t('waste.selectOperation')}
            filter
          />
        </div>
      </Dialog>
    </div>
  );
}
