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

export function WastePage() {
  const { t } = useI18n();
  const [wastePieces, setWastePieces] = useState<WastePiece[]>([]);
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
            // Only show DECHET (waste) rows
            setGroupedStats(res.data.filter(row => row[5] === 'DECHET'));
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

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [wasteResponse, operationsResponse, rollsResponse] = await Promise.all([
        WastePieceService.getLargeAvailable(0, 100),
        CuttingOperationService.getAll(),
        RollService.getAll(),
      ]);

      if (wasteResponse.success && wasteResponse.data) {
        setWastePieces(wasteResponse.data);
      }
      if (operationsResponse.success && operationsResponse.data) {
        setCuttingOperations(operationsResponse.data);
      }
      if (rollsResponse.success && rollsResponse.data) {
        setRolls(rollsResponse.data.items || []);
      }

      // Calculate statistics
      if (wasteResponse.data) {
        const available = wasteResponse.data.filter(w => w.status === 'AVAILABLE').length;
        const used = wasteResponse.data.filter(w => w.status === 'USED_IN_ORDER').length;
        const scrap = wasteResponse.data.filter(w => w.status === 'SCRAP').length;
        const totalArea = wasteResponse.data.reduce((sum, w) => sum + (w.areaM2 || 0), 0);

        setStats({
          totalAvailable: available,
          totalUsed: used,
          totalScrap: scrap,
          totalWasteArea: totalArea,
          reuseEfficiency: available > 0 ? ((used / (available + used + scrap)) * 100) : 0,
        });
      }
    } catch (err) {
      setError(t('waste.failedToLoadData'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsScrap = async (wasteId: string) => {
    if (!window.confirm(t('waste.confirmMarkScrap'))) return;

    try {
      const response = await WastePieceService.markAsScrap(wasteId);
      if (response.success && response.data) {
        setWastePieces(wastePieces.map(w => (w.id === wasteId ? response.data! : w)));
        setShowDetail(false);
      }
    } catch (err) {
      setError(t('waste.failedToMarkScrap'));
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

  const filteredWastePieces = wastePieces.filter(waste => {
    const matchesSearch =
      (waste.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (waste.materialType || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || waste.status === statusFilter;
    const matchesMaterial = materialFilter === 'ALL' || waste.materialType === materialFilter;

    return matchesSearch && matchesStatus && matchesMaterial;
  });

  const getStatusSeverity = (status: WasteStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return 'success';
      case 'USED_IN_ORDER':
        return 'info';
      case 'SCRAP':
        return 'danger';
      default:
        return undefined;
    }
  };

  const getStatusLabel = (status: WasteStatus): string => {
    switch (status) {
      case 'AVAILABLE':
        return t('waste.statusAvailable');
      case 'USED_IN_ORDER':
        return t('waste.statusUsed');
      case 'SCRAP':
        return t('waste.statusScrap');
      default:
        return status;
    }
  };

  const statusOptions = [
    { label: t('waste.all'), value: 'ALL' },
    { label: t('waste.statusAvailable'), value: 'AVAILABLE' },
    { label: t('waste.statusUsed'), value: 'USED_IN_ORDER' },
    { label: t('waste.statusScrap'), value: 'SCRAP' },
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
            label={t('waste.markAsScrap')}
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h1>{t('waste.title')}</h1>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div style={{ padding: '1rem', border: '1px solid var(--surface-border)', borderRadius: '6px' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{stats.totalAvailable}</div>
              <div>{t('waste.availableForReuse')}</div>
              <div>{stats.totalWasteArea.toFixed(2)} m²</div>
            </div>
            <div style={{ padding: '1rem', border: '1px solid var(--surface-border)', borderRadius: '6px' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{stats.totalUsed}</div>
              <div>{t('waste.successfullyReused')}</div>
              <div>
                {stats.totalAvailable + stats.totalUsed > 0
                  ? ((stats.totalUsed / (stats.totalAvailable + stats.totalUsed)) * 100).toFixed(1)
                  : 0}%
              </div>
            </div>
            <div style={{ padding: '1rem', border: '1px solid var(--surface-border)', borderRadius: '6px' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{stats.totalScrap}</div>
              <div>{t('waste.scrapDiscarded')}</div>
              <div>
                {stats.totalAvailable + stats.totalScrap > 0
                  ? ((stats.totalScrap / (stats.totalAvailable + stats.totalScrap)) * 100).toFixed(1)
                  : 0}%
              </div>
            </div>
            <div style={{ padding: '1rem', border: '1px solid var(--surface-border)', borderRadius: '6px' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{stats.reuseEfficiency.toFixed(1)}%</div>
              <div>{t('waste.reuseEfficiency')}</div>
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
            <span>{filteredWastePieces.length} {t('waste.pieces')}</span>
          </div>

          <DataTable
            value={filteredWastePieces}
            dataKey="id"
            size="small"
            emptyMessage={t('waste.noPiecesFound')}
          >
            <Column header={t('waste.tableWasteId')} body={(waste: WastePiece) => waste.id.substring(0, 8)} />
            <Column
              header={t('waste.tableMaterial')}
              body={(waste: WastePiece) => (
                <Tag value={waste.materialType} severity="info" />
              )}
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
              body={(waste: WastePiece) => ((waste.status === 'AVAILABLE' || waste.status === 'RESERVED') && ((waste.areaM2 || 0) > 3.0)) ? t('waste.yes') : t('waste.no')}
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
            <div><strong>{t('waste.detailWasteId')}:</strong> {selectedWaste.id.substring(0, 8)}</div>
            {selectedWaste.parentWastePieceId && (
              <div><strong>{t('waste.detailParentWaste') || 'Parent Waste Piece'}:</strong> {selectedWaste.parentWastePieceId.substring(0, 8)}</div>
            )}
            <div><strong>{t('waste.detailMaterial')}:</strong> {selectedWaste.materialType}</div>
            <div><strong>{t('waste.detailDimensions')}:</strong> {selectedWaste.widthMm}mm × {selectedWaste.lengthM}m</div>
            <div><strong>{t('waste.detailArea')}:</strong> {(selectedWaste.areaM2 || 0).toFixed(2)} m²</div>
            <div><strong>{t('waste.detailStatus')}:</strong> {getStatusLabel(selectedWaste.status)}</div>
            <div><strong>{t('waste.detailLargeWaste')}:</strong> {((selectedWaste.areaM2 || 0) > 3.0) ? t('waste.yes') : t('waste.no')}</div>
            <div><strong>{t('waste.detailReuseCandidate')}:</strong> {((selectedWaste.status === 'AVAILABLE' || selectedWaste.status === 'RESERVED') && ((selectedWaste.areaM2 || 0) > 3.0)) ? t('waste.yes') : t('waste.no')}</div>
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
              label: `${op.id.substring(0, 8)} - Roll: ${rolls.find(r => r.id === op.rollId)?.materialType || '-'} - Operator: ${op.operatorId}`,
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
