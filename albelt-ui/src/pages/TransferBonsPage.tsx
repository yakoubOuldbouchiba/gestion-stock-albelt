import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@hooks/useAuth';
import { Altier, Roll, RollMovement, TransferBon } from '../types/index';
import { AltierService } from '../services/altierService';
import { RollService } from '../services/rollService';
import rollMovementService from '../services/rollMovementService';
import transferBonService from '../services/transferBonService';
import { useI18n } from '@hooks/useI18n';
import { formatDateTime } from '../utils/date';
import '../styles/TransferBonsPage.css';

export function TransferBonsPage() {
  const { t } = useI18n();
  const { user } = useAuthStore();

  const [altiers, setAltiers] = useState<Altier[]>([]);
  const [availableRolls, setAvailableRolls] = useState<Roll[]>([]);
  const [rollDetailsById, setRollDetailsById] = useState<Record<string, Roll>>({});
  const [bons, setBons] = useState<TransferBon[]>([]);

  const [loading, setLoading] = useState(false);
  const [viewLoadingBonId, setViewLoadingBonId] = useState<string | null>(null);
  const [deleteLoadingBonId, setDeleteLoadingBonId] = useState<string | null>(null);
  const [removeMovementLoadingId, setRemoveMovementLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getCurrentDateTimeLocal = () => new Date().toISOString().slice(0, 16);

  const [formData, setFormData] = useState({
    fromAltierID: '',
    toAltierID: '',
    dateSortie: getCurrentDateTimeLocal(),
    dateEntree: ''
  });

  const [selectedRollIds, setSelectedRollIds] = useState<string[]>([]);
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
    const loadRolls = async () => {
      if (!formData.fromAltierID) {
        setAvailableRolls([]);
        setSelectedRollIds([]);
        return;
      }

      try {
        const [rollsResponse, outgoingResponse] = await Promise.all([
          RollService.getAll(),
          rollMovementService.getMovementsFromAltier(formData.fromAltierID)
        ]);

        const excludedRollIds = new Set<string>();
        if (outgoingResponse.success && outgoingResponse.data) {
          const outgoingItems = toArray<RollMovement>(outgoingResponse.data);
          for (const movement of outgoingItems) {
            // Exclude rolls already included in an active bon (not yet received)
            if (movement.transferBonId && !movement.dateEntree) {
              excludedRollIds.add(movement.rollId);
            }
          }
        }

        if (rollsResponse.success && rollsResponse.data) {
          const rollItems = toArray<Roll>(rollsResponse.data);
          // Cache roll details for later display (bon details table)
          const rollMap: Record<string, Roll> = {};
          for (const roll of rollItems) {
            rollMap[roll.id] = roll;
          }
          setRollDetailsById((prev) => ({ ...rollMap, ...prev }));

          const filtered = rollItems.filter((roll) => {
            const isAtFromAltier = roll.altierId === formData.fromAltierID;
            const isAvailable = roll.status === 'AVAILABLE' || roll.status === 'OPENED';
            const isExcluded = excludedRollIds.has(roll.id);
            return isAtFromAltier && isAvailable && !isExcluded;
          });
          setAvailableRolls(filtered);
          setSelectedRollIds([]);
        }
      } catch (e) {
        console.error(e);
        setError(t('transferBons.failedToLoadRolls'));
      }
    };

    loadRolls();
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

  const formatDate = (dateValue: any) => {
    if (!dateValue) return '-';
    if (Array.isArray(dateValue)) {
      const [year, month, day, hour, minute] = dateValue;
      return formatDateTime(new Date(year, month - 1, day, hour, minute));
    }
    return formatDateTime(dateValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const toggleRoll = (rollId: string) => {
    setSelectedRollIds((prev) =>
      prev.includes(rollId) ? prev.filter((id) => id !== rollId) : [...prev, rollId]
    );
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
    if (selectedRollIds.length === 0) {
      setError(t('transferBons.selectRolls'));
      return;
    }

    try {
      setLoading(true);
      setError(null);

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

      await Promise.all(
        selectedRollIds.map((rollId) =>
          rollMovementService.recordMovement({
            rollId,
            fromAltierID: formData.fromAltierID,
            toAltierID: formData.toAltierID,
            dateSortie: dateSortieIso,
            dateEntree: dateEntreeIso || '',
            transferBonId: bonId,
            operatorId: user.id
          })
        )
      );

      await reloadBons();

      setFormData({
        fromAltierID: formData.fromAltierID,
        toAltierID: '',
        dateSortie: getCurrentDateTimeLocal(),
        dateEntree: ''
      });
      setSelectedRollIds([]);
      setSelectedBonId(bonId);

      const details = await transferBonService.getBonDetails(bonId);
      if (details.success && details.data) {
        setBonDetails(details.data as any);
        const movements = (details.data as any).movements as RollMovement[] | undefined;
        if (Array.isArray(movements) && movements.length > 0) {
          await ensureRollDetails(movements.map((m) => m.rollId));
        }
      }
    } catch (e) {
      console.error(e);
      setError(t('transferBons.failedToCreate'));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBon = async (bonId: string) => {
    setSelectedBonId(bonId);
    setBonDetails(null);
    setError(null);
    setViewLoadingBonId(bonId);

    try {
      const response = await transferBonService.getBonDetails(bonId);
      if (response.success && response.data) {
        setBonDetails(response.data as any);
        const movements = (response.data as any).movements as RollMovement[] | undefined;
        if (Array.isArray(movements) && movements.length > 0) {
          await ensureRollDetails(movements.map((m) => m.rollId));
        }
      } else {
        setError(response.message || t('transferBons.failedToLoadBon'));
      }
    } catch (e) {
      console.error(e);
      setError(t('transferBons.failedToLoadBon'));
    } finally {
      setViewLoadingBonId(null);
    }
  };

  const handleDeleteBon = async (bonId: string) => {
    const bon = bons.find((b) => b.id === bonId);
    const isPending = bon ? !bon.dateEntree : true;
    if (!isPending) {
      setError(t('transferBons.onlyPendingDelete'));
      return;
    }

    const confirmed = window.confirm(t('transferBons.confirmDelete'));
    if (!confirmed) return;

    setDeleteLoadingBonId(bonId);
    setError(null);

    try {
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
    } catch (e) {
      console.error(e);
      setError(t('transferBons.failedToDelete'));
    } finally {
      setDeleteLoadingBonId(null);
    }
  };

  const handleConfirmReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBonId) return;

    if (!confirmData.dateEntree) {
      setError(t('transferBons.dateEntreeRequired'));
      return;
    }

    try {
      setLoading(true);
      setError(null);

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
    } catch (e) {
      console.error(e);
      setError(t('transferBons.failedToConfirm'));
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMovement = async (bonId: string, movementId: string) => {
    const confirmed = window.confirm(t('transferBons.confirmRemoveMovement'));
    if (!confirmed) return;

    setRemoveMovementLoadingId(movementId);
    setError(null);

    try {
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
          const [rollsResponse, outgoingResponse] = await Promise.all([
            RollService.getAll(),
            rollMovementService.getMovementsFromAltier(formData.fromAltierID)
          ]);

          const excludedRollIds = new Set<string>();
          if (outgoingResponse.success && outgoingResponse.data) {
            for (const movement of outgoingResponse.data) {
              if (movement.transferBonId && !movement.dateEntree) {
                excludedRollIds.add(movement.rollId);
              }
            }
          }

          if (rollsResponse.success && rollsResponse.data) {
            const filtered = rollsResponse.data.filter((roll) => {
              const isAtFromAltier = roll.altierId === formData.fromAltierID;
              const isAvailable = roll.status === 'AVAILABLE' || roll.status === 'OPENED';
              const isExcluded = excludedRollIds.has(roll.id);
              return isAtFromAltier && isAvailable && !isExcluded;
            });
            setAvailableRolls(filtered);
          }
        } catch (e) {
          console.warn('Failed to refresh available rolls after movement removal', e);
        }
      }
    } catch (e) {
      console.error(e);
      setError(t('transferBons.failedToRemoveMovement'));
    } finally {
      setRemoveMovementLoadingId(null);
    }
  };

  if (!user) {
    return (
      <div className="transfer-bons-page">
        <div className="loading">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="transfer-bons-page">
      <div className="page-header">
        <div>
          <h1>{t('transferBons.title')}</h1>
          <p>{t('transferBons.description')}</p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="grid">
        <div className="panel">
          <h2>{t('transferBons.createBon')}</h2>

          <form onSubmit={handleCreateBon} className="bon-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="fromAltierID">{t('transferBons.fromAltier')} *</label>
                <select
                  id="fromAltierID"
                  name="fromAltierID"
                  value={formData.fromAltierID}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">-- {t('transferBons.selectSource')} --</option>
                  {userAvailableAltiers.map((altier) => (
                    <option key={altier.id} value={altier.id}>
                      {altier.libelle} ({altier.adresse})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="toAltierID">{t('transferBons.toAltier')} *</label>
                <select
                  id="toAltierID"
                  name="toAltierID"
                  value={formData.toAltierID}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">-- {t('transferBons.selectDestination')} --</option>
                  {otherAltiers.map((altier) => (
                    <option key={altier.id} value={altier.id}>
                      {altier.libelle} ({altier.adresse})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="dateSortie">{t('transferBons.dateSortie')} *</label>
                <input
                  type="datetime-local"
                  id="dateSortie"
                  name="dateSortie"
                  value={formData.dateSortie}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="dateEntree">{t('transferBons.dateEntree')}</label>
                <input
                  type="datetime-local"
                  id="dateEntree"
                  name="dateEntree"
                  value={formData.dateEntree}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="rolls-picker">
              <div className="rolls-picker-header">
                <h3>{t('transferBons.selectRollsLabel')} *</h3>
                <div className="rolls-count">{t('transferBons.selected')}: {selectedRollIds.length}</div>
              </div>

              {availableRolls.length === 0 ? (
                <div className="empty-state">
                  <p>{t('transferBons.noAvailableRolls')}</p>
                </div>
              ) : (
                <div className="rolls-list">
                  {availableRolls.map((roll) => (
                    <label key={roll.id} className="roll-item">
                      <input
                        type="checkbox"
                        checked={selectedRollIds.includes(roll.id)}
                        onChange={() => toggleRoll(roll.id)}
                      />
                      <div className="roll-item-content">
                        <div className="roll-line">
                          <strong>{roll.id}</strong>
                        </div>
                        <div className="roll-line meta">
                          {roll.materialType} • {roll.widthMm}mm × {(roll.lengthRemainingM || roll.lengthM).toFixed(2)}m • {roll.status}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? t('transferBons.creating') : t('transferBons.createBonButton')}
              </button>
            </div>
          </form>
        </div>

        <div className="panel">
          <h2>{t('transferBons.existingBons')}</h2>

          {loading && <div className="loading">{t('common.loading')}</div>}

          {bons.length === 0 ? (
            <div className="empty-state">
              <p>{t('transferBons.noBonsYet')}</p>
            </div>
          ) : (
            <table className="bons-table">
              <thead>
                <tr>
                  <th>{t('transferBons.from')}</th>
                  <th>{t('transferBons.to')}</th>
                  <th>{t('transferBons.exit')}</th>
                  <th>{t('transferBons.entry')}</th>
                  <th>{t('transferBons.status')}</th>
                  <th>{t('transferBons.rolls')}</th>
                  <th>{t('transferBons.action')}</th>
                </tr>
              </thead>
              <tbody>
                {bons.map((bon) => (
                  <tr key={bon.id} className={selectedBonId === bon.id ? 'selected' : ''}>
                    <td>{bon.fromAltier?.libelle || '-'}</td>
                    <td>{bon.toAltier?.libelle || '-'}</td>
                    <td>{formatDate(bon.dateSortie)}</td>
                    <td>{formatDate(bon.dateEntree)}</td>
                    <td>
                      <span className={`badge ${bon.dateEntree ? 'received' : 'pending'}`}>
                        {bon.dateEntree ? t('transferBons.delivered') : t('transferBons.pending')}
                      </span>
                    </td>
                    <td>{bon.movementCount ?? '-'}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => handleSelectBon(bon.id)}
                          disabled={viewLoadingBonId === bon.id || deleteLoadingBonId === bon.id}
                        >
                          {viewLoadingBonId === bon.id ? t('transferBons.loading') : t('transferBons.view')}
                        </button>

                        {!bon.dateEntree && (
                          <button
                            type="button"
                            className="btn-danger"
                            onClick={() => handleDeleteBon(bon.id)}
                            disabled={deleteLoadingBonId === bon.id || viewLoadingBonId === bon.id}
                          >
                            {deleteLoadingBonId === bon.id ? 'Deleting...' : 'Delete'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {viewLoadingBonId && (
            <div className="loading">Loading bon details...</div>
          )}

          {bonDetails && (
            <div className="bon-details">
              <h3>Bon Details</h3>

              {!bonDetails.dateEntree && (
                <form onSubmit={handleConfirmReceipt} className="confirm-form">
                  <div className="form-group">
                    <label htmlFor="confirmDateEntree">Confirm Date Entree *</label>
                    <input
                      type="datetime-local"
                      id="confirmDateEntree"
                      value={confirmData.dateEntree}
                      onChange={(e) => setConfirmData({ dateEntree: e.target.value })}
                      required
                    />
                  </div>
                  <button type="submit" className="btn-primary" disabled={loading}>
                    Confirm Receipt
                  </button>
                </form>
              )}

              <div className="movements-block">
                <h4>Movements</h4>
                {Array.isArray((bonDetails as any).movements) && (bonDetails as any).movements.length > 0 ? (
                  <table className="movements-table">
                    <thead>
                      <tr>
                        <th>Roll</th>
                        <th>Exit</th>
                        <th>Entry</th>
                        <th>Status</th>
                        {!bonDetails.dateEntree && <th>Action</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {(bonDetails as any).movements.map((m: RollMovement) => (
                        <tr key={m.id}>
                          <td>
                            <div>
                              <strong>{m.rollId}</strong>
                            </div>
                            {rollDetailsById[m.rollId] && (
                              <small>
                                {rollDetailsById[m.rollId].materialType} • {rollDetailsById[m.rollId].widthMm}mm × {(rollDetailsById[m.rollId].lengthRemainingM || rollDetailsById[m.rollId].lengthM).toFixed(2)}m • {rollDetailsById[m.rollId].status}
                              </small>
                            )}
                          </td>
                          <td>{formatDate(m.dateSortie)}</td>
                          <td>{formatDate(m.dateEntree)}</td>
                          <td>
                            <span className={`badge ${m.dateEntree ? 'received' : 'pending'}`}>
                              {m.dateEntree ? 'Delivered' : 'Pending'}
                            </span>
                          </td>
                          {!bonDetails.dateEntree && (
                            <td>
                              {!m.dateEntree && (
                                <button
                                  type="button"
                                  className="btn-danger"
                                  onClick={() => handleRemoveMovement(bonDetails.id, m.id)}
                                  disabled={removeMovementLoadingId === m.id || loading}
                                >
                                  {removeMovementLoadingId === m.id ? 'Removing...' : 'Remove'}
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty-state">
                    <p>No movements linked to this bon.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TransferBonsPage;
