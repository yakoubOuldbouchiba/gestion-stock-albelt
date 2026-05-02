import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuthStore } from '@hooks/useAuth';
import { useAsyncLock } from '@hooks/useAsyncLock';
import { useI18n } from '@hooks/useI18n';
import { AltierService } from '../../services/altierService';
import { RollService } from '../../services/rollService';
import { WastePieceService } from '../../services/wastePieceService';
import rollMovementService from '../../services/rollMovementService';
import transferBonService from '../../services/transferBonService';
import type { Altier, Roll, TransferBon, WastePiece } from '../../types/index';
import { formatRollChuteLabel } from '@utils/rollChuteLabel';
import {
  formatDateTimeToISO,
  getCurrentDateTimeLocal,
  LoadMode,
  matchesSearch,
  mergeById,
  SOURCE_PAGE_SIZE,
  toArray,
  TransferBonDetails,
} from '../transferBons.utils';

const BONS_PAGE_SIZE = 20;

type TransferBonFormData = {
  fromAltierID: string;
  toAltierID: string;
  dateSortie: string;
  dateEntree: string;
};

export function useTransferBonsPage() {
  const { t, i18n } = useI18n();
  const { user } = useAuthStore();
  const { run, isLocked, locks } = useAsyncLock();

  const [altiers, setAltiers] = useState<Altier[]>([]);
  const [bons, setBons] = useState<TransferBon[]>([]);
  const [rollDetailsById, setRollDetailsById] = useState<Record<string, Roll>>({});
  const [wasteDetailsById, setWasteDetailsById] = useState<Record<string, WastePiece>>({});

  const [availableRolls, setAvailableRolls] = useState<Roll[]>([]);
  const [availableWastePieces, setAvailableWastePieces] = useState<WastePiece[]>([]);
  const [rollPage, setRollPage] = useState(0);
  const [wastePage, setWastePage] = useState(0);
  const [rollTotal, setRollTotal] = useState(0);
  const [wasteTotal, setWasteTotal] = useState(0);
  const [rollsLoading, setRollsLoading] = useState(false);
  const [wasteLoading, setWasteLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [bonsLoadingMore, setBonsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bonsPage, setBonsPage] = useState(0);
  const [bonsTotal, setBonsTotal] = useState(0);

  const [formData, setFormData] = useState<TransferBonFormData>({
    fromAltierID: '',
    toAltierID: '',
    dateSortie: getCurrentDateTimeLocal(),
    dateEntree: ''
  });

  const [selectedRollIds, setSelectedRollIds] = useState<string[]>([]);
  const [selectedWastePieceIds, setSelectedWastePieceIds] = useState<string[]>([]);
  const [selectedBonId, setSelectedBonId] = useState<string | null>(null);
  const [bonDetails, setBonDetails] = useState<TransferBonDetails | null>(null);
  const [confirmData, setConfirmData] = useState({ dateEntree: getCurrentDateTimeLocal() });
  const [rollSearch, setRollSearch] = useState('');
  const [wasteSearch, setWasteSearch] = useState('');
  const [detailsVisible, setDetailsVisible] = useState(true);

  const [activeTab, setActiveTab] = useState<'sent' | 'received'>('sent');
  const [bonStatusFilter, setBonStatusFilter] = useState<'all' | 'pending' | 'delivered'>('all');
  const [bonSearch, setBonSearch] = useState('');

  const userAltierIds = user?.altierIds || [];

  const getLockedId = (prefix: string) => {
    const match = Object.keys(locks).find((key) => key.startsWith(prefix) && locks[key]);
    return match ? match.slice(prefix.length) : null;
  };

  const viewLoadingBonId = getLockedId('transfer-view-');
  const deleteLoadingBonId = getLockedId('transfer-delete-');
  const removeMovementLoadingId = getLockedId('transfer-remove-');
  const isActionLocked = loading || isLocked();

  const userAvailableAltiers = useMemo(
    () => altiers.filter((altier) => userAltierIds.includes(altier.id)),
    [altiers, userAltierIds]
  );

  const otherAltiers = useMemo(
    () => altiers.filter((altier) => altier.id !== formData.fromAltierID),
    [altiers, formData.fromAltierID]
  );

  const selectedRollsCount = selectedRollIds.length;
  const selectedWasteCount = selectedWastePieceIds.length;
  const selectedItemsCount = selectedRollsCount + selectedWasteCount;
  const pendingBonsCount = bons.filter((bon) => !bon.dateEntree).length;
  const deliveredBonsCount = bons.length - pendingBonsCount;
  const totalMovementCount = bons.reduce((sum, bon) => sum + (bon.movementCount || 0), 0);
  const bonMovements = Array.isArray(bonDetails?.movements) ? bonDetails.movements : [];
  const rollHasMore = availableRolls.length < rollTotal;
  const wasteHasMore = availableWastePieces.length < wasteTotal;
  const bonsHasMore = bons.length < bonsTotal;

  const filteredRolls = useMemo(
    () =>
      availableRolls.filter((roll) =>
        matchesSearch(rollSearch, [
          formatRollChuteLabel(roll),
          roll.id,
          roll.reference,
          roll.materialType,
          roll.status,
        ])
      ),
    [availableRolls, rollSearch]
  );

  const filteredWastePieces = useMemo(
    () =>
      availableWastePieces.filter((piece) =>
        matchesSearch(wasteSearch, [
          formatRollChuteLabel(piece),
          piece.id,
          piece.reference,
          piece.materialType,
          piece.status,
        ])
      ),
    [availableWastePieces, wasteSearch]
  );

  useEffect(() => {
    const loadBaseData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        const [altResponse, bonsResponse] = await Promise.all([
          AltierService.getAll(),
          transferBonService.listBons({ page: 0, size: BONS_PAGE_SIZE, altierIds: userAltierIds, direction: 'sent' })
        ]);

        if (altResponse.success && altResponse.data) {
          const altItems = toArray<Altier>(altResponse.data);
          setAltiers(altItems);

          const firstAltier = altItems.find((altier) => userAltierIds.includes(altier.id));
          if (firstAltier && !formData.fromAltierID) {
            setFormData((prev) => ({ ...prev, fromAltierID: firstAltier.id }));
            await Promise.all([loadRollSources(0, 'replace', firstAltier.id), loadWasteSources(0, 'replace', firstAltier.id)]);
          }
        }

        if (bonsResponse.success && bonsResponse.data) {
          const items = toArray<TransferBon>(bonsResponse.data);
          setBons(items);
          setBonsPage(0);
          setBonsTotal(bonsResponse.data.totalElements ?? items.length);
        }
      } catch (loadError) {
        console.error(loadError);
        setError(t('transferBons.failedToLoadData'));
      } finally {
        setLoading(false);
      }
    };

    loadBaseData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, userAltierIds.length]);

  const isFirstFilterEffectRef = useRef(true);
  useEffect(() => {
    if (isFirstFilterEffectRef.current) {
      isFirstFilterEffectRef.current = false;
      return;
    }
    void reloadBons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, bonStatusFilter, bonSearch]);

  useEffect(() => {
    if (!formData.fromAltierID) {
      setAvailableRolls([]);
      setAvailableWastePieces([]);
      setRollTotal(0);
      setWasteTotal(0);
      setRollPage(0);
      setWastePage(0);
      setSelectedRollIds([]);
      setSelectedWastePieceIds([]);
      return;
    }

    setSelectedRollIds([]);
    setSelectedWastePieceIds([]);
    void Promise.all([loadRollSources(0, 'replace'), loadWasteSources(0, 'replace')]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.fromAltierID]);

  const loadRollSources = async (page: number, mode: LoadMode, altierId?: string) => {
    const effectiveAltierId = altierId ?? formData.fromAltierID;
    if (!effectiveAltierId) return;

    try {
      setRollsLoading(true);
      const response = await RollService.getTransferSources({
        fromAltierId: effectiveAltierId,
        page,
        size: SOURCE_PAGE_SIZE
      });

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to load rolls');
      }

      const items = toArray<Roll>(response.data);
      const fetchedMap = items.reduce<Record<string, Roll>>((acc, roll) => {
        acc[roll.id] = roll;
        return acc;
      }, {});

      setRollDetailsById((prev) => ({ ...prev, ...fetchedMap }));
      setRollTotal(response.data.totalElements ?? items.length);
      setRollPage(page);
      setAvailableRolls((prev) => (mode === 'append' ? mergeById(prev, items) : items));
    } catch (loadError) {
      console.error(loadError);
      setError(t('transferBons.failedToLoadRolls'));
    } finally {
      setRollsLoading(false);
    }
  };

  const loadWasteSources = async (page: number, mode: LoadMode, altierId?: string) => {
    const effectiveAltierId = altierId ?? formData.fromAltierID;
    if (!effectiveAltierId) return;

    try {
      setWasteLoading(true);
      const response = await WastePieceService.getTransferSources({
        fromAltierId: effectiveAltierId,
        page,
        size: SOURCE_PAGE_SIZE
      });

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to load waste pieces');
      }

      const items = toArray<WastePiece>(response.data);
      const fetchedMap = items.reduce<Record<string, WastePiece>>((acc, piece) => {
        acc[piece.id] = piece;
        return acc;
      }, {});

      setWasteDetailsById((prev) => ({ ...prev, ...fetchedMap }));
      setWasteTotal(response.data.totalElements ?? items.length);
      setWastePage(page);
      setAvailableWastePieces((prev) => (mode === 'append' ? mergeById(prev, items) : items));
    } catch (loadError) {
      console.error(loadError);
      setError(t('transferBons.failedToLoadRolls'));
    } finally {
      setWasteLoading(false);
    }
  };

  const ensureRollDetails = async (rollIds: string[]) => {
    const uniqueIds = Array.from(new Set(rollIds)).filter(Boolean);
    const missingIds = uniqueIds.filter((id) => !rollDetailsById[id]);
    if (missingIds.length === 0) return;

    try {
      const responses = await Promise.all(missingIds.map((id) => RollService.getById(id)));
      const fetched = responses.reduce<Record<string, Roll>>((acc, response) => {
        if (response.success && response.data) {
          acc[response.data.id] = response.data;
        }
        return acc;
      }, {});

      if (Object.keys(fetched).length > 0) {
        setRollDetailsById((prev) => ({ ...prev, ...fetched }));
      }
    } catch (loadError) {
      console.warn('Failed to fetch some roll details', loadError);
    }
  };

  const ensureWastePieceDetails = async (wastePieceIds: string[]) => {
    const uniqueIds = Array.from(new Set(wastePieceIds)).filter(Boolean);
    const missingIds = uniqueIds.filter((id) => !wasteDetailsById[id]);
    if (missingIds.length === 0) return;

    try {
      const responses = await Promise.all(missingIds.map((id) => WastePieceService.getById(id)));
      const fetched = responses.reduce<Record<string, WastePiece>>((acc, response) => {
        if (response.success && response.data) {
          acc[response.data.id] = response.data;
        }
        return acc;
      }, {});

      if (Object.keys(fetched).length > 0) {
        setWasteDetailsById((prev) => ({ ...prev, ...fetched }));
      }
    } catch (loadError) {
      console.warn('Failed to fetch some waste piece details', loadError);
    }
  };

  const updateFormField = (field: keyof TransferBonFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const reloadBons = async () => {
    const statusParam = bonStatusFilter !== 'all' ? bonStatusFilter.toUpperCase() : undefined;
    const response = await transferBonService.listBons({
      page: 0,
      size: BONS_PAGE_SIZE,
      altierIds: userAltierIds,
      direction: activeTab,
      status: statusParam,
      search: bonSearch || undefined,
    });
    if (response.success && response.data) {
      const items = toArray<TransferBon>(response.data);
      setBons(items);
      setBonsPage(0);
      setBonsTotal(response.data.totalElements ?? items.length);
    }
  };

  const loadMoreBons = async () => {
    if (loading || bonsLoadingMore || !bonsHasMore) return;

    try {
      setBonsLoadingMore(true);
      const nextPage = bonsPage + 1;
      const statusParam = bonStatusFilter !== 'all' ? bonStatusFilter.toUpperCase() : undefined;
      const response = await transferBonService.listBons({
        page: nextPage,
        size: BONS_PAGE_SIZE,
        altierIds: userAltierIds,
        direction: activeTab,
        status: statusParam,
        search: bonSearch || undefined,
      });

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to load transfer bons');
      }

      const items = toArray<TransferBon>(response.data);
      setBons((prev) => mergeById(prev, items));
      setBonsPage(nextPage);
      setBonsTotal(response.data.totalElements ?? 0);
    } catch (loadError) {
      console.error(loadError);
      setError(t('transferBons.failedToLoadData'));
    } finally {
      setBonsLoadingMore(false);
    }
  };

  const refreshSources = async () => {
    if (!formData.fromAltierID) return;
    await Promise.all([loadRollSources(0, 'replace'), loadWasteSources(0, 'replace')]);
  };

  const handleCreateBon = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || isLocked()) return;

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
    if (selectedItemsCount === 0) {
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
        await refreshSources();

        setFormData({
          fromAltierID: formData.fromAltierID,
          toAltierID: '',
          dateSortie: getCurrentDateTimeLocal(),
          dateEntree: ''
        });
        setSelectedRollIds([]);
        setSelectedWastePieceIds([]);
        setSelectedBonId(bonId);

        const detailsResponse = await transferBonService.getBonDetails(bonId);
        if (detailsResponse.success && detailsResponse.data) {
          const details = detailsResponse.data as TransferBonDetails;
          setBonDetails(details);

          if (Array.isArray(details.movements) && details.movements.length > 0) {
            await ensureRollDetails(details.movements.map((movement) => movement.rollId || ''));
            await ensureWastePieceDetails(details.movements.map((movement) => movement.wastePieceId || ''));
          }
        }
      }, 'transfer-create');
    } catch (createError) {
      console.error(createError);
      setError(t('transferBons.failedToCreate'));
    }
  };

  const handleSelectBon = async (bonId: string) => {
    if (isLocked()) return;

    setSelectedBonId(bonId);
    setBonDetails(null);
    setDetailsVisible(true);
    setError(null);

    try {
      await run(async () => {
        const response = await transferBonService.getBonDetails(bonId);
        if (!response.success || !response.data) {
          setError(response.message || t('transferBons.failedToLoadBon'));
          return;
        }

        const details = response.data as TransferBonDetails;
        setBonDetails(details);

        if (Array.isArray(details.movements) && details.movements.length > 0) {
          await ensureRollDetails(details.movements.map((movement) => movement.rollId || ''));
          await ensureWastePieceDetails(details.movements.map((movement) => movement.wastePieceId || ''));
        }
      }, `transfer-view-${bonId}`);
    } catch (loadError) {
      console.error(loadError);
      setError(t('transferBons.failedToLoadBon'));
    }
  };

  const handleDeleteBon = async (bonId: string) => {
    if (isLocked()) return;

    const bon = bons.find((item) => item.id === bonId);
    if (bon?.dateEntree) {
      setError(t('transferBons.onlyPendingDelete'));
      return;
    }

    if (!window.confirm(t('transferBons.confirmDelete'))) return;

    try {
      setError(null);

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
        await refreshSources();
      }, `transfer-delete-${bonId}`);
    } catch (deleteError) {
      console.error(deleteError);
      setError(t('transferBons.failedToDelete'));
    }
  };

  const handleConfirmReceipt = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedBonId || isLocked()) return;

    if (!confirmData.dateEntree) {
      setError(t('transferBons.dateEntreeRequired'));
      return;
    }

    try {
      setError(null);

      await run(async () => {
        const response = await transferBonService.confirmReceipt(
          selectedBonId,
          confirmData.dateEntree.endsWith('Z')
            ? confirmData.dateEntree
            : `${confirmData.dateEntree}:00.000Z`
        );

        if (!response.success) {
          setError(response.message || t('transferBons.failedToConfirm'));
          return;
        }

        await reloadBons();
        await handleSelectBon(selectedBonId);
      }, 'transfer-confirm');
    } catch (confirmError) {
      console.error(confirmError);
      setError(t('transferBons.failedToConfirm'));
    }
  };

  const handleRemoveMovement = async (bonId: string, movementId: string) => {
    if (!window.confirm(t('transferBons.confirmRemoveMovement')) || isLocked()) return;

    try {
      setError(null);

      await run(async () => {
        const response = await transferBonService.removeMovement(bonId, movementId);
        if (!response.success) {
          setError(response.message || t('transferBons.failedToRemoveMovement'));
          return;
        }

        await reloadBons();
        await handleSelectBon(bonId);
        await refreshSources();
      }, `transfer-remove-${movementId}`);
    } catch (removeError) {
      console.error(removeError);
      setError(t('transferBons.failedToRemoveMovement'));
    }
  };

  const handleDownloadTransferPdf = async () => {
    if (!bonDetails) return;

    try {
      const blob = await transferBonService.downloadPdf(bonDetails.id, i18n.language || 'fr');
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `transfer-bon-${bonDetails.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (downloadError) {
      console.error(downloadError);
      setError(t('transferBons.failedToDownloadPdf'));
    }
  };

  const toggleRollSelection = (rollId: string) => {
    setSelectedRollIds((prev) =>
      prev.includes(rollId) ? prev.filter((id) => id !== rollId) : [...prev, rollId]
    );
  };

  const toggleWasteSelection = (wasteId: string) => {
    setSelectedWastePieceIds((prev) =>
      prev.includes(wasteId) ? prev.filter((id) => id !== wasteId) : [...prev, wasteId]
    );
  };

  return {
    user,
    error,
    setError,
    formData,
    updateFormField,
    confirmData,
    setConfirmData,
    userAvailableAltiers,
    otherAltiers,
    bons,
    bonDetails,
    bonMovements,
    selectedBonId,
    detailsVisible,
    setDetailsVisible,
    selectedRollIds,
    selectedWastePieceIds,
    selectedRollsCount,
    selectedWasteCount,
    selectedItemsCount,
    pendingBonsCount,
    deliveredBonsCount,
    totalMovementCount,
    availableRolls,
    availableWastePieces,
    filteredRolls,
    filteredWastePieces,
    rollTotal,
    wasteTotal,
    rollHasMore,
    wasteHasMore,
    bonsHasMore,
    rollsLoading,
    wasteLoading,
    loading,
    bonsLoadingMore,
    isActionLocked,
    viewLoadingBonId,
    deleteLoadingBonId,
    removeMovementLoadingId,
    rollPage,
    wastePage,
    rollSearch,
    setRollSearch,
    wasteSearch,
    setWasteSearch,
    rollDetailsById,
    wasteDetailsById,
    activeTab,
    setActiveTab,
    bonStatusFilter,
    setBonStatusFilter,
    bonSearch,
    setBonSearch,
    handleCreateBon,
    handleSelectBon,
    handleDeleteBon,
    handleConfirmReceipt,
    handleRemoveMovement,
    handleDownloadTransferPdf,
    loadMoreBons,
    toggleRollSelection,
    toggleWasteSelection,
    refreshSources,
    loadRollSources,
    loadWasteSources,
    isLocked,
  };
}
