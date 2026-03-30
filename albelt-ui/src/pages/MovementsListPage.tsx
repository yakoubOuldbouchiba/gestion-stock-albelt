import { useState, useEffect } from 'react';
import { FileText, Calendar, Trash2, Edit, ArrowRight, CheckCircle } from 'lucide-react';
import rollMovementService, { RollMovement } from '../services/rollMovementService';
import { formatDateTime } from '../utils/date';
import { useAuthStore } from '@hooks/useAuth';
import { useI18n } from '@hooks/useI18n';
import { RollMovementForm } from '@components/RollMovementForm';
import '../styles/MovementsListPage.css';

export function MovementsListPage() {
  const { user } = useAuthStore();
  const { t } = useI18n();
  
  const [activeTab, setActiveTab] = useState<'created' | 'pending'>('created');
  const [createdMovements, setCreatedMovements] = useState<RollMovement[]>([]);
  const [pendingMovements, setPendingMovements] = useState<RollMovement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  
  // Form state
  const [showMovementForm, setShowMovementForm] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedMovement, setSelectedMovement] = useState<RollMovement | undefined>(undefined);
  
  // Confirmation form state
  const [showConfirmForm, setShowConfirmForm] = useState(false);
  const [selectedMovementId, setSelectedMovementId] = useState<string | null>(null);
  const [confirmData, setConfirmData] = useState({
    dateEntree: new Date().toISOString().slice(0, 16)
  });

  useEffect(() => {
    loadData();
  }, [user?.altierIds?.length]);

  const loadData = async () => {
    if (!user || !user.altierIds || user.altierIds.length === 0) {
      setLoading(false);
      setError(t('movementsList.userAltierNotAvailable'));
      console.warn('User or altierIds missing:', { user, altierIds: user?.altierIds });
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading movements for altiers:', user.altierIds);
      
      // Fetch movements from all altiers the user has access to
      // (My Created Movements = all movements FROM any of user's altiers)
      let allCreatedMovements: RollMovement[] = [];
      for (const altierID of user.altierIds) {
        const response = await rollMovementService.getMovementsFromAltier(altierID);
        console.log(`Created movements response for altier ${altierID}:`, response);
        if (response.success && response.data) {
          const items = Array.isArray(response.data)
            ? response.data
            : response.data.items ?? (response.data as any).content ?? [];
          allCreatedMovements = [...allCreatedMovements, ...items];
          console.log(`Loaded ${items.length} created movements from altier ${altierID}`);
        } else {
          console.error(`Failed to fetch created movements for altier ${altierID}:`, response.message);
        }
      }
      // Movements page should show only standalone movements (not linked to a bon)
      const createdWithoutBon = allCreatedMovements.filter((m) => !m.transferBonId);
      setCreatedMovements(createdWithoutBon);
      console.log('Total created movements (without bon):', createdWithoutBon.length);
      
      // Fetch pending receipts for each altier (movements TO the altier that haven't been received)
      let allPendingMovements: RollMovement[] = [];
      for (const altierID of user.altierIds) {
        const response = await rollMovementService.getPendingReceiptsByAltier(altierID);
        console.log(`Pending receipts response for altier ${altierID}:`, response);
        if (response.success && response.data) {
          const items = Array.isArray(response.data)
            ? response.data
            : response.data.items ?? (response.data as any).content ?? [];
          allPendingMovements = [...allPendingMovements, ...items];
          console.log(`Loaded ${items.length} pending receipts for altier ${altierID}`);
        } else {
          console.error(`Failed to fetch pending receipts for altier ${altierID}:`, response.message);
        }
      }
      const pendingWithoutBon = allPendingMovements.filter((m) => !m.transferBonId);
      setPendingMovements(pendingWithoutBon);
      console.log('Total pending movements (without bon):', pendingWithoutBon.length);
    } catch (err) {
      setError(t('movementsList.failedToLoad'));
      setCreatedMovements([]);
      setPendingMovements([]);
      console.error('Error loading movements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfirmData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateMovement = () => {
    setFormMode('create');
    setSelectedMovement(undefined);
    setShowMovementForm(true);
  };

  const handleEditMovement = (movement: RollMovement) => {
    setFormMode('edit');
    setSelectedMovement(movement);
    setShowMovementForm(true);
  };

  const handleFormSuccess = async () => {
    setShowMovementForm(false);
    setSelectedMovement(undefined);
    await loadData();
  };

  const handleFormCancel = () => {
    setShowMovementForm(false);
    setSelectedMovement(undefined);
  };

  const handleDelete = async (movementId: string) => {
    if (!confirm(t('movementsList.confirmDelete'))) {
      return;
    }
    
    try {
      setDeleting(movementId);
      const response = await rollMovementService.deleteMovement(movementId);
      
      if (response.success) {
        await loadData();
        setError(null);
      } else {
        setError(t('movementsList.failedToDelete') + ': ' + response.message);
      }
    } catch (err) {
      setError(t('movementsList.failedToDelete'));
      console.error(err);
    } finally {
      setDeleting(null);
    }
  };

  const handleConfirmReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMovementId || !user) return;
    
    if (!confirmData.dateEntree) {
      setError(t('movementsList.dateEntreeRequired'));
      return;
    }
    
    try {
      // Convert datetime-local format to ISO 8601 with timezone
      const isoDateString = confirmData.dateEntree.endsWith('Z') 
        ? confirmData.dateEntree 
        : `${confirmData.dateEntree}:00.000Z`;
      
      // Call API to confirm receipt with dateEntree
      const response = await rollMovementService.confirmReceipt(
        selectedMovementId,
        isoDateString
      );
      
      if (response.success) {
        // Reload movements
        await loadData();
        
        setConfirmData({ dateEntree: new Date().toISOString().slice(0, 16) });
        setSelectedMovementId(null);
        setShowConfirmForm(false);
        setError(null);
      } else {
        setError(response.message || t('movementsList.failedToConfirm'));
      }
    } catch (err) {
      setError(t('movementsList.failedToConfirm'));
      console.error(err);
    }
  };

  const formatDate = (dateValue: string | null | undefined | any[]) => {
    if (!dateValue) return '-';
    
    // Handle array format from backend [year, month, day, hour, minute, second, nano]
    if (Array.isArray(dateValue)) {
      const [year, month, day, hour, minute] = dateValue;
      return formatDateTime(new Date(year, month - 1, day, hour, minute));
    }
    
    // Handle ISO string format
    return formatDateTime(dateValue);
  };

  if (loading) {
    return <div className="movements-list-page"><div className="loading">{t('movementsList.loading')}</div></div>;
  }

  return (
    <div className="movements-list-page">
      <div className="page-header">
        <div className="header-content">
          <div>
            <h1>{t('movementsList.title')}</h1>
            <p>{t('movementsList.subtitle')}</p>
          </div>
          <button className="btn-create-movement" onClick={handleCreateMovement}>
            <ArrowRight size={18} /> {t('movementsList.createBtn')}
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Movement Form Modal */}
      {showMovementForm && user && (
        <RollMovementForm
          mode={formMode}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
          existingMovement={selectedMovement}
          userAltierIds={user.altierIds || []}
          userId={user.id}
        />
      )}

      <div className="tabs">
        <button 
          className={`tab-button ${activeTab === 'created' ? 'active' : ''}`}
          onClick={() => setActiveTab('created')}
        >
          <FileText size={18} /> {t('movementsList.createdTab', { count: createdMovements.length })}
        </button>
        <button 
          className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <Calendar size={18} /> {t('movementsList.pendingTab', { count: pendingMovements.length })}
        </button>
      </div>

      {showConfirmForm && selectedMovementId && (
        <div className="confirm-form-overlay">
          <div className="confirm-form-container">
            <form onSubmit={handleConfirmReceipt}>
              <h3>{t('movementsList.confirmTitle')}</h3>
              <div className="form-group">
                <label htmlFor="dateEntree">{t('movementsList.dateEntree')} *</label>
                <input 
                  type="datetime-local"
                  id="dateEntree"
                  name="dateEntree"
                  value={confirmData.dateEntree}
                  onChange={handleConfirmInputChange}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-submit">{t('movementsList.confirmBtn')}</button>
                <button 
                  type="button" 
                  className="btn-cancel" 
                  onClick={() => {
                    setShowConfirmForm(false);
                    setSelectedMovementId(null);
                  }}
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Created Movements Tab */}
      {activeTab === 'created' && (
        <div className="tab-content">
          {createdMovements.length === 0 ? (
            <div className="empty-state">
              <p>{t('movementsList.noCreatedMovements')}</p>
            </div>
          ) : (
            <div className="movements-list">
              <table className="movements-table">
                <thead>
                  <tr>
                    <th>{t('common.roll')}</th>
                    <th>{t('movementsList.bon')}</th>
                    <th>{t('movementsList.from')}</th>
                    <th>{t('movementsList.to')}</th>
                    <th>{t('movementsList.exitDate')}</th>
                    <th>{t('movementsList.entryDate')}</th>
                    <th>{t('common.status')}</th>
                    <th>{t('common.reason')}</th>
                    <th>{t('common.action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {createdMovements.map(movement => (
                    <tr key={movement.id} className="movement-row">
                      <td>
                        <strong>{movement.rollId}</strong>
                      </td>
                      <td>
                        {movement.transferBonId ? (
                          <span title={movement.transferBonId}>
                            {movement.transferBonId.substring(0, 8)}...
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>
                        {movement.fromAltier ? (
                          <>
                            <strong>{movement.fromAltier.libelle}</strong>
                            <br />
                            <small>{movement.fromAltier.adresse}</small>
                          </>
                        ) : (
                          <em>Supplier</em>
                        )}
                      </td>
                      <td>
                        <strong>{movement.toAltier.libelle}</strong>
                        <br />
                        <small>{movement.toAltier.adresse}</small>
                      </td>
                      <td>{formatDate(movement.dateSortie)}</td>
                      <td>{formatDate(movement.dateEntree)}</td>
                      <td>
                        <span className={`badge ${movement.dateEntree ? 'received' : 'pending'}`}>
                          {movement.dateEntree ? t('movementsList.delivered') : t('movementsList.pending')}
                        </span>
                      </td>
                      <td>{movement.reason || t('common.dash')}</td>
                      <td>
                        <div className="action-buttons">
                          {!movement.dateEntree && (
                            <>
                              <button 
                                type="button"
                                className="btn-edit"
                                onClick={() => handleEditMovement(movement)}
                                title={t('movementsList.editTitle')}
                              >
                                <Edit size={16} /> {t('common.edit')}
                              </button>
                              <button 
                                type="button"
                                className="btn-delete"
                                onClick={() => handleDelete(movement.id)}
                                disabled={deleting === movement.id}
                              >
                                <Trash2 size={16} /> {deleting === movement.id ? t('movementsList.deleting') : t('common.delete')}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Pending Receipts Tab */}
      {activeTab === 'pending' && (
        <div className="tab-content">
          {pendingMovements.length === 0 ? (
            <div className="empty-state">
              <p>{t('movementsList.noPendingReceipts')}</p>
            </div>
          ) : (
            <div className="movements-list">
              <table className="movements-table">
                <thead>
                  <tr>
                    <th>{t('common.roll')}</th>
                    <th>{t('movementsList.bon')}</th>
                    <th>{t('movementsList.from')}</th>
                    <th>{t('movementsList.toYourAltier')}</th>
                    <th>{t('movementsList.exitDate')}</th>
                    <th>{t('movementsList.createdBy')}</th>
                    <th>{t('common.reason')}</th>
                    <th>{t('common.action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingMovements.map(movement => (
                    <tr key={movement.id} className="movement-row">
                      <td>
                        <strong>{movement.rollId}</strong>
                      </td>
                      <td>
                        {movement.transferBonId ? (
                          <span title={movement.transferBonId}>
                            {movement.transferBonId.substring(0, 8)}...
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>
                        {movement.fromAltier ? (
                          <>
                            <strong>{movement.fromAltier.libelle}</strong>
                            <br />
                            <small>{movement.fromAltier.adresse}</small>
                          </>
                        ) : (
                          <em>Supplier</em>
                        )}
                      </td>
                      <td>
                        <strong>{movement.toAltier.libelle}</strong>
                        <br />
                        <small>{movement.toAltier.adresse}</small>
                      </td>
                      <td>{formatDate(movement.dateSortie)}</td>
                      <td>{movement.operator.username}</td>
                      <td>{movement.reason || t('common.dash')}</td>
                      <td>
                        <button 
                          type="button" 
                          className="btn-confirm"
                          onClick={() => {
                            setShowConfirmForm(true);
                            setSelectedMovementId(movement.id);
                          }}
                          title={t('movementsList.confirmTitle')}
                        >
                          <CheckCircle size={16} /> {t('movementsList.confirmBtn')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
