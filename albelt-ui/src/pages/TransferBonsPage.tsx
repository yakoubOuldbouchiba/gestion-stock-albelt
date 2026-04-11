import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@hooks/useAuth';
import { Altier, Roll, RollMovement, TransferBon, WastePiece } from '../types/index';
import { AltierService } from '../services/altierService';
import { RollService } from '../services/rollService';
import { WastePieceService } from '../services/wastePieceService';
import rollMovementService from '../services/rollMovementService';
import transferBonService from '../services/transferBonService';
import { useI18n } from '@hooks/useI18n';
import { formatDateTime } from '../utils/date';
import { formatRollChuteLabel } from '@utils/rollChuteLabel';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Card } from 'primereact/card';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dropdown } from 'primereact/dropdown';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Tag } from 'primereact/tag';
import { useAsyncLock } from '@hooks/useAsyncLock';

export function TransferBonsPage() {
  const { t } = useI18n();
  const { user } = useAuthStore();

  const [altiers, setAltiers] = useState<Altier[]>([]);
  const [availableRolls, setAvailableRolls] = useState<Roll[]>([]);
  const [availableWastePieces, setAvailableWastePieces] = useState<WastePiece[]>([]);
  const [rollDetailsById, setRollDetailsById] = useState<Record<string, Roll>>({});
  const [wasteDetailsById, setWasteDetailsById] = useState<Record<string, WastePiece>>({});
  const [bons, setBons] = useState<TransferBon[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { run, isLocked, locks } = useAsyncLock();

  const getCurrentDateTimeLocal = () => new Date().toISOString().slice(0, 16);
  const formatDateTimeLocalValue = (date: Date | null) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const parseDateTimeLocalValue = (value: string) => (value ? new Date(value) : null);

  const [formData, setFormData] = useState({
    fromAltierID: '',
    toAltierID: '',
    dateSortie: getCurrentDateTimeLocal(),
    dateEntree: ''
  });

  const [selectedRollIds, setSelectedRollIds] = useState<string[]>([]);
  const [selectedWastePieceIds, setSelectedWastePieceIds] = useState<string[]>([]);
  const [selectedBonId, setSelectedBonId] = useState<string | null>(null);
  const [bonDetails, setBonDetails] = useState<(TransferBon & { movements?: RollMovement[] }) | null>(null);
  const [confirmData, setConfirmData] = useState({ dateEntree: getCurrentDateTimeLocal() });

  const toArray = <T,>(data: any): T[] => {
    if (Array.isArray(data)) return data;
    return data?.items ?? data?.content ?? [];
  };

  const userAltierIds = user?.altierIds || [];
  const userAvailableAltiers = useMemo(
    () => toArray<Altier>(altiers).filter((a) => userAltierIds.includes(a.id)),
    [altiers, userAltierIds]
  );

  const otherAltiers = useMemo(
    () => toArray<Altier>(altiers).filter((a) => a.id !== formData.fromAltierID),
    [altiers, formData.fromAltierID]
  );

  const selectedRolls = useMemo(
    () => availableRolls.filter((roll) => selectedRollIds.includes(roll.id)),
    [availableRolls, selectedRollIds]
  );

  const selectedWastePieces = useMemo(
    () => availableWastePieces.filter((piece) => selectedWastePieceIds.includes(piece.id)),
    [availableWastePieces, selectedWastePieceIds]
  );

  const getLockedId = (prefix: string) => {
    const match = Object.keys(locks).find((key) => key.startsWith(prefix) && locks[key]);
    return match ? match.slice(prefix.length) : null;
  };

  const viewLoadingBonId = getLockedId('transfer-view-');
  const deleteLoadingBonId = getLockedId('transfer-delete-');
  const removeMovementLoadingId = getLockedId('transfer-remove-');
  const isActionLocked = loading || isLocked();

  useEffect(() => {
    const loadBaseData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        const [altResponse, bonsResponse] = await Promise.all([
          AltierService.getAll(),
          transferBonService.listBons()
        ]);

        if (altResponse.success && altResponse.data) {
          const altItems = toArray<Altier>(altResponse.data);
          setAltiers(altItems);
          const firstAltier = altItems.find((a) => userAltierIds.includes(a.id));
          if (firstAltier && !formData.fromAltierID) {
            setFormData((prev) => ({ ...prev, fromAltierID: firstAltier.id }));
          }
        }

        if (bonsResponse.success && bonsResponse.data) {
          setBons(toArray<TransferBon>(bonsResponse.data));
        }
      } catch (e) {
        console.error(e);
        setError(t('transferBons.failedToLoadData'));
      } finally {
        setLoading(false);
      }
    };

    loadBaseData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, userAltierIds.length]);

  useEffect(() => {
    const loadSources = async () => {
      if (!formData.fromAltierID) {
        setAvailableRolls([]);
        setAvailableWastePieces([]);
        setSelectedRollIds([]);
        setSelectedWastePieceIds([]);
        return;
      }

      try {
        const [rollsResponse, wasteResponse] = await Promise.all([
          RollService.getTransferSources({ fromAltierId: formData.fromAltierID, page: 0, size: 200 }),
          WastePieceService.getTransferSources({ fromAltierId: formData.fromAltierID, page: 0, size: 200 })
        ]);

        if (rollsResponse.success && rollsResponse.data) {
          const rollItems = toArray<Roll>(rollsResponse.data);
          const rollMap: Record<string, Roll> = {};
          for (const roll of rollItems) {
            rollMap[roll.id] = roll;
          }
          setRollDetailsById((prev) => ({ ...rollMap, ...prev }));

          setAvailableRolls(rollItems);
          setSelectedRollIds([]);
        }

        if (wasteResponse.success && wasteResponse.data) {
          const wasteItems = toArray<WastePiece>(wasteResponse.data);
          setAvailableWastePieces(wasteItems);
          setSelectedWastePieceIds([]);
        }
      } catch (e) {
        console.error(e);
        setError(t('transferBons.failedToLoadRolls'));
      }
    };

    loadSources();
  }, [formData.fromAltierID]);

  const ensureRollDetails = async (rollIds: string[]) => {
    const unique = Array.from(new Set(rollIds)).filter(Boolean);
    const missing = unique.filter((id) => !rollDetailsById[id]);
    if (missing.length === 0) return;

    try {
      const responses = await Promise.all(missing.map((id) => RollService.getById(id)));
      const fetched: Record<string, Roll> = {};
      for (const res of responses) {
        if (res.success && res.data) {
          fetched[res.data.id] = res.data;
        }
      }
      if (Object.keys(fetched).length > 0) {
        setRollDetailsById((prev) => ({ ...prev, ...fetched }));
      }
    } catch (e) {
      // Non-blocking: we can still show rollId only
      console.warn('Failed to fetch some roll details', e);
    }
  };

  const ensureWastePieceDetails = async (wastePieceIds: string[]) => {
    const unique = Array.from(new Set(wastePieceIds)).filter(Boolean);
    const missing = unique.filter((id) => !wasteDetailsById[id]);
    if (missing.length === 0) return;

    try {
      const responses = await Promise.all(missing.map((id) => WastePieceService.getById(id)));
      const fetched: Record<string, WastePiece> = {};
      for (const res of responses) {
        if (res.success && res.data) {
          fetched[res.data.id] = res.data;
        }
      }
      if (Object.keys(fetched).length > 0) {
        setWasteDetailsById((prev) => ({ ...prev, ...fetched }));
      }
    } catch (e) {
      console.warn('Failed to fetch some waste piece details', e);
    }
  };

  const formatDate = (dateValue: any) => {
    if (!dateValue) return '-';
    if (Array.isArray(dateValue)) {
      const [year, month, day, hour, minute] = dateValue;
      return formatDateTime(new Date(year, month - 1, day, hour, minute));
    }
    return formatDateTime(dateValue);
  };

  const updateFormField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const formatDateTimeToISO = (dateStr: string) => {
    if (!dateStr) return '';
    return `${dateStr}:00.000Z`;
  };

  const reloadBons = async () => {
    const bonsResponse = await transferBonService.listBons();
    if (bonsResponse.success && bonsResponse.data) {
      setBons(toArray<TransferBon>(bonsResponse.data));
    }
  };

  const handleCreateBon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (isLocked()) return;

    if (!formData.fromAltierID) {
      setError(t('transferBons.fromRequired'));
      return;
    }
    if (!formData.toAltierID) {
      setError(t('transferBons.toRequired'));
      return;
    }
    if (!formData.dateSortie) {
      setError(t('transferBons.dateSortieRequired'));
      return;
    }
    if (selectedRollIds.length === 0 && selectedWastePieceIds.length === 0) {
      setError(t('transferBons.selectRolls'));
      return;
    }

    try {
      setError(null);
      await run(async () => {
        const dateSortieIso = formatDateTimeToISO(formData.dateSortie);
        const dateEntreeIso = formData.dateEntree ? formatDateTimeToISO(formData.dateEntree) : undefined;

        const bonResponse = await transferBonService.createBon({
          fromAltierID: formData.fromAltierID,
          toAltierID: formData.toAltierID,
          dateSortie: dateSortieIso,
          dateEntree: dateEntreeIso,
          operatorId: user.id
        });

        if (!bonResponse.success || !bonResponse.data) {
          setError(bonResponse.message || t('transferBons.failedToCreate'));
          return;
        }

        const bonId = bonResponse.data.id;

        await Promise.all([
          ...selectedRollIds.map((rollId) =>
            rollMovementService.recordMovement({
              rollId,
              fromAltierID: formData.fromAltierID,
              toAltierID: formData.toAltierID,
              dateSortie: dateSortieIso,
              dateEntree: dateEntreeIso || '',
              transferBonId: bonId,
              operatorId: user.id
            })
          ),
          ...selectedWastePieceIds.map((wastePieceId) =>
            rollMovementService.recordMovement({
              wastePieceId,
              fromAltierID: formData.fromAltierID,
              toAltierID: formData.toAltierID,
              dateSortie: dateSortieIso,
              dateEntree: dateEntreeIso || '',
              transferBonId: bonId,
              operatorId: user.id
            })
          )
        ]);

        await reloadBons();

        setFormData({
          fromAltierID: formData.fromAltierID,
          toAltierID: '',
          dateSortie: getCurrentDateTimeLocal(),
          dateEntree: ''
        });
        setSelectedRollIds([]);
        setSelectedWastePieceIds([]);
        setSelectedBonId(bonId);

        const details = await transferBonService.getBonDetails(bonId);
        if (details.success && details.data) {
          setBonDetails(details.data as any);
          const movements = (details.data as any).movements as RollMovement[] | undefined;
          if (Array.isArray(movements) && movements.length > 0) {
            await ensureRollDetails(movements.map((m) => m.rollId || ''));
            await ensureWastePieceDetails(movements.map((m) => m.wastePieceId || ''));
          }
        }
      }, 'transfer-create');
    } catch (e) {
      console.error(e);
      setError(t('transferBons.failedToCreate'));
    }
  };

  const handleSelectBon = async (bonId: string) => {
    if (isLocked()) {
      return;
    }
    setSelectedBonId(bonId);
    setBonDetails(null);
    setError(null);

    try {
      await run(async () => {
        const response = await transferBonService.getBonDetails(bonId);
        if (response.success && response.data) {
          setBonDetails(response.data as any);
          const movements = (response.data as any).movements as RollMovement[] | undefined;
          if (Array.isArray(movements) && movements.length > 0) {
            await ensureRollDetails(movements.map((m) => m.rollId || ''));
            await ensureWastePieceDetails(movements.map((m) => m.wastePieceId || ''));
          }
        } else {
          setError(response.message || t('transferBons.failedToLoadBon'));
        }
      }, `transfer-view-${bonId}`);
    } catch (e) {
      console.error(e);
      setError(t('transferBons.failedToLoadBon'));
    }
  };

  const handleDeleteBon = async (bonId: string) => {
    if (isLocked()) {
      return;
    }
    const bon = bons.find((b) => b.id === bonId);
    const isPending = bon ? !bon.dateEntree : true;
    if (!isPending) {
      setError(t('transferBons.onlyPendingDelete'));
      return;
    }

    const confirmed = window.confirm(t('transferBons.confirmDelete'));
    if (!confirmed) return;

    setError(null);

    try {
      await run(async () => {
        const response = await transferBonService.deleteBon(bonId);
        if (!response.success) {
          setError(response.message || t('transferBons.failedToDelete'));
          return;
        }

        if (selectedBonId === bonId) {
          setSelectedBonId(null);
          setBonDetails(null);
        }

        await reloadBons();
      }, `transfer-delete-${bonId}`);
    } catch (e) {
      console.error(e);
      setError(t('transferBons.failedToDelete'));
    }
  };

  const handleConfirmReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBonId) return;
    if (isLocked()) return;

    if (!confirmData.dateEntree) {
      setError(t('transferBons.dateEntreeRequired'));
      return;
    }

    try {
      setError(null);
      await run(async () => {
        const isoDateString = confirmData.dateEntree.endsWith('Z')
          ? confirmData.dateEntree
          : `${confirmData.dateEntree}:00.000Z`;

        const response = await transferBonService.confirmReceipt(selectedBonId, isoDateString);
        if (!response.success) {
          setError(response.message || t('transferBons.failedToConfirm'));
          return;
        }

        await reloadBons();
        await handleSelectBon(selectedBonId);
      }, 'transfer-confirm');
    } catch (e) {
      console.error(e);
      setError(t('transferBons.failedToConfirm'));
    }
  };

  const handleRemoveMovement = async (bonId: string, movementId: string) => {
    const confirmed = window.confirm(t('transferBons.confirmRemoveMovement'));
    if (!confirmed) return;
    if (isLocked()) {
      return;
    }
    setError(null);

    try {
      await run(async () => {
        const response = await transferBonService.removeMovement(bonId, movementId);
        if (!response.success) {
          setError(response.message || t('transferBons.failedToRemoveMovement'));
          return;
        }

        await reloadBons();
        await handleSelectBon(bonId);

        // Refresh available rolls list so a removed roll can be selected again
        if (formData.fromAltierID) {
          try {
            const [rollsResponse, wasteResponse] = await Promise.all([
              RollService.getTransferSources({ fromAltierId: formData.fromAltierID, page: 0, size: 200 }),
              WastePieceService.getTransferSources({ fromAltierId: formData.fromAltierID, page: 0, size: 200 })
            ]);

            if (rollsResponse.success && rollsResponse.data) {
              const rollItems = toArray<Roll>(rollsResponse.data);
              setAvailableRolls(rollItems);
            }

            if (wasteResponse.success && wasteResponse.data) {
              const wasteItems = toArray<WastePiece>(wasteResponse.data);
              setAvailableWastePieces(wasteItems);
            }
          } catch (e) {
            console.warn('Failed to refresh available rolls after movement removal', e);
          }
        }
      }, `transfer-remove-${movementId}`);
    } catch (e) {
      console.error(e);
      setError(t('transferBons.failedToRemoveMovement'));
    }
  };

  if (!user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
        <ProgressSpinner />
      </div>
    );
  }

  const bonMovements = Array.isArray((bonDetails as any)?.movements)
    ? ((bonDetails as any).movements as RollMovement[])
    : [];

  const movementItemBody = (movement: RollMovement) => {
    const roll = movement.rollId ? rollDetailsById[movement.rollId] : undefined;
    const wastePiece = movement.wastePieceId ? wasteDetailsById[movement.wastePieceId] : undefined;
    const label = roll ? formatRollChuteLabel(roll) : wastePiece ? formatRollChuteLabel(wastePiece) : '';
    const itemId = movement.rollId || movement.wastePieceId || '';
    const typeLabel = movement.rollId
      ? t('inventory.roll')
      : movement.wastePieceId
        ? t('inventory.wastePiece')
        : '-';

    return (
      <div>
        <div><strong>{typeLabel}</strong></div>
        <div>{itemId ? `${itemId.substring(0, 8)}...` : '-'}</div>
        {label && <small>{label}</small>}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <h1>{t('transferBons.title')}</h1>
        <p>{t('transferBons.description')}</p>
      </div>

      {error && <Message severity="error" text={error} />}

      <div
        className="albel-grid albel-grid--min320"
        style={{
          gap: '1rem',
        }}
      >
        <Card title={t('transferBons.createBon')}>
          <form className="p-fluid" onSubmit={handleCreateBon}>
            <div
              className="albel-grid albel-grid--min220"
              style={{
                gap: '1rem',
              }}
            >
              <div>
                <label htmlFor="fromAltierID">{t('transferBons.fromAltier')} *</label>
                <Dropdown
                  id="fromAltierID"
                  value={formData.fromAltierID || null}
                  options={userAvailableAltiers}
                  optionLabel="libelle"
                  optionValue="id"
                  placeholder={t('transferBons.selectSource')}
                  onChange={(e) => updateFormField('fromAltierID', e.value || '')}
                />
              </div>
              <div>
                <label htmlFor="toAltierID">{t('transferBons.toAltier')} *</label>
                <Dropdown
                  id="toAltierID"
                  value={formData.toAltierID || null}
                  options={otherAltiers}
                  optionLabel="libelle"
                  optionValue="id"
                  placeholder={t('transferBons.selectDestination')}
                  onChange={(e) => updateFormField('toAltierID', e.value || '')}
                />
              </div>
            </div>

            <div
              className="albel-grid albel-grid--min220"
              style={{
                gap: '1rem',
                marginTop: '1rem'
              }}
            >
              <div>
                <label htmlFor="dateSortie">{t('transferBons.dateSortie')} *</label>
                <Calendar
                  id="dateSortie"
                  value={parseDateTimeLocalValue(formData.dateSortie)}
                  onChange={(e) => updateFormField('dateSortie', formatDateTimeLocalValue(e.value as Date | null))}
                  showIcon
                  showTime
                  hourFormat="24"
                />
              </div>
              <div>
                <label htmlFor="dateEntree">{t('transferBons.dateEntree')}</label>
                <Calendar
                  id="dateEntree"
                  value={parseDateTimeLocalValue(formData.dateEntree)}
                  onChange={(e) => updateFormField('dateEntree', formatDateTimeLocalValue(e.value as Date | null))}
                  showIcon
                  showTime
                  hourFormat="24"
                />
              </div>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0 }}>{t('transferBons.selectRollsLabel')} *</h3>
                <Tag value={`${t('transferBons.selected')}: ${selectedRollIds.length}`} />
              </div>

              <div style={{ marginTop: '0.75rem' }}>
                <DataTable
                  value={availableRolls}
                  dataKey="id"
                  selectionMode="multiple"
                  selection={selectedRolls}
                  onSelectionChange={(e) => {
                    const value = e.value as Roll | Roll[] | null | undefined;
                    const next = Array.isArray(value) ? value : value ? [value] : [];
                    setSelectedRollIds(next.map((roll) => roll.id));
                  }}
                  emptyMessage={t('transferBons.noAvailableRolls')}
                  size="small"
                >
                  <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
                  <Column field="id" header={t('transferBons.roll')} />
                  <Column header={t('rolls.material')} body={(roll: Roll) => roll.materialType} />
                  <Column
                    header={t('purchaseBons.dimensions')}
                    body={(roll: Roll) =>
                      `${roll.widthMm}mm x ${(roll.lengthRemainingM || roll.lengthM).toFixed(2)}m`
                    }
                  />
                  <Column
                    header={t('rolls.status')}
                    body={(roll: Roll) => (
                      <Tag
                        value={roll.status}
                        severity={roll.status === 'AVAILABLE' ? 'success' : roll.status === 'OPENED' ? 'warning' : 'info'}
                      />
                    )}
                  />
                </DataTable>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0 }}>{t('transferBons.selectChutesLabel')}</h3>
                <Tag value={`${t('transferBons.selected')}: ${selectedWastePieceIds.length}`} />
              </div>

              <div style={{ marginTop: '0.75rem' }}>
                <DataTable
                  value={availableWastePieces}
                  dataKey="id"
                  selectionMode="multiple"
                  selection={selectedWastePieces}
                  onSelectionChange={(e) => {
                    const value = e.value as WastePiece | WastePiece[] | null | undefined;
                    const next = Array.isArray(value) ? value : value ? [value] : [];
                    setSelectedWastePieceIds(next.map((piece) => piece.id));
                  }}
                  emptyMessage={t('transferBons.noAvailableChutes')}
                  size="small"
                >
                  <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
                  <Column
                    header={t('inventory.wastePiece')}
                    body={(piece: WastePiece) => formatRollChuteLabel(piece)}
                  />
                  <Column header={t('rolls.material')} body={(piece: WastePiece) => piece.materialType} />
                  <Column
                    header={t('purchaseBons.dimensions')}
                    body={(piece: WastePiece) => `${piece.widthMm}mm x ${piece.lengthM.toFixed(2)}m`}
                  />
                  <Column
                    header={t('rolls.status')}
                    body={(piece: WastePiece) => (
                      <Tag
                        value={piece.status}
                        severity={piece.status === 'AVAILABLE' ? 'success' : piece.status === 'OPENED' ? 'warning' : 'info'}
                      />
                    )}
                  />
                </DataTable>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <Button
                type="submit"
                label={t('transferBons.createBonButton')}
                icon="pi pi-check"
                loading={isLocked('transfer-create')}
                disabled={isActionLocked}
              />
            </div>
          </form>
        </Card>

        <Card title={t('transferBons.existingBons')}>
          <DataTable
            value={bons}
            dataKey="id"
            loading={loading}
            emptyMessage={t('transferBons.noBonsYet')}
            size="small"
          >
            <Column header={t('transferBons.from')} body={(bon: TransferBon) => bon.fromAltier?.libelle || t('transferBons.dash')} />
            <Column header={t('transferBons.to')} body={(bon: TransferBon) => bon.toAltier?.libelle || t('transferBons.dash')} />
            <Column header={t('transferBons.exit')} body={(bon: TransferBon) => formatDate(bon.dateSortie)} />
            <Column header={t('transferBons.entry')} body={(bon: TransferBon) => formatDate(bon.dateEntree)} />
            <Column
              header={t('transferBons.status')}
              body={(bon: TransferBon) => (
                <Tag
                  value={bon.dateEntree ? t('transferBons.delivered') : t('transferBons.pending')}
                  severity={bon.dateEntree ? 'success' : 'warning'}
                />
              )}
            />
            <Column header={t('transferBons.rolls')} body={(bon: TransferBon) => bon.movementCount ?? t('transferBons.dash')} />
            <Column
              header={t('transferBons.action')}
              body={(bon: TransferBon) => (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button
                    label={t('transferBons.view')}
                    size="small"
                    onClick={() => handleSelectBon(bon.id)}
                    loading={viewLoadingBonId === bon.id}
                    disabled={isActionLocked}
                  />
                  {!bon.dateEntree && (
                    <Button
                      label={t('common.delete')}
                      severity="danger"
                      size="small"
                      onClick={() => handleDeleteBon(bon.id)}
                      loading={deleteLoadingBonId === bon.id}
                      disabled={isActionLocked}
                    />
                  )}
                </div>
              )}
            />
          </DataTable>

          {viewLoadingBonId && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
              <ProgressSpinner />
            </div>
          )}

          {bonDetails && (
            <Card title={t('transferBons.detailsTitle')} style={{ marginTop: '1rem' }}>
              <div
                className="albel-grid albel-grid--min200"
                style={{
                  gap: '0.5rem',
                }}
              >
                <div>
                  <strong>{t('transferBons.from')}:</strong> {bonDetails.fromAltier?.libelle || t('transferBons.dash')}
                </div>
                <div>
                  <strong>{t('transferBons.to')}:</strong> {bonDetails.toAltier?.libelle || t('transferBons.dash')}
                </div>
                <div>
                  <strong>{t('transferBons.exit')}:</strong> {formatDate(bonDetails.dateSortie)}
                </div>
                <div>
                  <strong>{t('transferBons.entry')}:</strong> {formatDate(bonDetails.dateEntree)}
                </div>
              </div>

              {!bonDetails.dateEntree && (
                <form className="p-fluid" onSubmit={handleConfirmReceipt} style={{ marginTop: '1rem' }}>
                  <div
                    className="albel-grid albel-grid--min220"
                    style={{
                      gap: '1rem',
                    }}
                  >
                    <div>
                      <label htmlFor="confirmDateEntree">{t('transferBons.confirmDateEntree')} *</label>
                      <Calendar
                        id="confirmDateEntree"
                        value={parseDateTimeLocalValue(confirmData.dateEntree)}
                        onChange={(e) =>
                          setConfirmData({ dateEntree: formatDateTimeLocalValue(e.value as Date | null) })
                        }
                        showIcon
                        showTime
                        hourFormat="24"
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <Button
                      type="submit"
                      label={t('transferBons.confirmReceipt')}
                      icon="pi pi-check"
                      loading={isLocked('transfer-confirm')}
                      disabled={isActionLocked}
                    />
                  </div>
                </form>
              )}

              <div style={{ marginTop: '1rem' }}>
                <h4 style={{ marginBottom: '0.5rem' }}>{t('transferBons.movementsTitle')}</h4>
                <DataTable
                  value={bonMovements}
                  dataKey="id"
                  emptyMessage={t('transferBons.noMovements')}
                  size="small"
                >
                  <Column header={t('transferBons.item')} body={movementItemBody} />
                  <Column header={t('transferBons.exit')} body={(movement: RollMovement) => formatDate(movement.dateSortie)} />
                  <Column header={t('transferBons.entry')} body={(movement: RollMovement) => formatDate(movement.dateEntree)} />
                  <Column
                    header={t('transferBons.status')}
                    body={(movement: RollMovement) => (
                      <Tag
                        value={movement.dateEntree ? t('transferBons.delivered') : t('transferBons.pending')}
                        severity={movement.dateEntree ? 'success' : 'warning'}
                      />
                    )}
                  />
                  {!bonDetails.dateEntree && (
                    <Column
                      header={t('transferBons.action')}
                      body={(movement: RollMovement) => (
                        <Button
                          type="button"
                          icon="pi pi-trash"
                          severity="danger"
                          text
                          onClick={() => handleRemoveMovement(bonDetails.id, movement.id)}
                          loading={removeMovementLoadingId === movement.id}
                          disabled={isActionLocked}
                        />
                      )}
                    />
                  )}
                </DataTable>
              </div>
            </Card>
          )}
        </Card>
      </div>
    </div>
  );
}

export default TransferBonsPage;
