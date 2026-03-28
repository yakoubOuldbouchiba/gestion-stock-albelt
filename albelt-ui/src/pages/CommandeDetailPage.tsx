import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CommandeService } from '../services/commandeService';
import { WastePieceService } from '../services/wastePieceService';
import { RollService } from '../services/rollService';
import type { Commande, CommandeItem, ItemStatus } from '../types';
import '../styles/CommandeDetailPage.css';

export function CommandeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [commande, setCommande] = useState<Commande | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [rolls, setRolls] = useState<any[]>([]);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CommandeItem | null>(null);
  const [wasteForItem, setWasteForItem] = useState<any[]>([]);
  
  // Roll processing form
  const [processingForm, setProcessingForm] = useState({
    rollId: '',
    lengthUsedM: '',
    widthRemainingMm: '',
    wasteType: 'DECHET' as 'DECHET' | 'REUSABLE',
    weightKg: '',
    notes: '',
  });

  const statuses = ['PENDING', 'ENCOURS', 'COMPLETED', 'CANCELLED', 'ON_HOLD'];
  const itemStatuses: ItemStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

  useEffect(() => {
    if (!id) {
      setError('Order ID not provided');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await CommandeService.getById(id);
        if (res.data) {
          setCommande(res.data);
          setSelectedStatus(res.data.status);
        }
        
        // Fetch available rolls
        const rollsRes = await RollService.getAll();
        if (rollsRes.data) {
          setRolls(Array.isArray(rollsRes.data) ? rollsRes.data : []);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleStatusUpdate = async () => {
    if (!commande || !id) return;

    try {
      setUpdating(true);
      const res = await CommandeService.updateStatus(id, selectedStatus);
      if (res.data) {
        setCommande(res.data);
        setError(null);
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const handleItemStatusUpdate = async (itemId: string, newStatus: ItemStatus) => {
    if (!commande) return;

    try {
      const res = await CommandeService.updateItemStatus(itemId, newStatus);
      if (res.data) {
        // Refetch the order to get updated data
        const commandeRes = await CommandeService.getById(commande.id);
        if (commandeRes.data) {
          setCommande(commandeRes.data);
        }
      }
    } catch (err) {
      console.error('Error updating item status:', err);
      setError('Failed to update item status');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      await CommandeService.deleteItem(itemId);
      if (commande) {
        setCommande({
          ...commande,
          items: commande.items.filter((item) => item.id !== itemId),
        });
      }
    } catch (err) {
      console.error('Error deleting item:', err);
      setError('Failed to delete item');
    }
  };

  const handleDeleteOrder = async () => {
    if (!window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return;
    }

    try {
      if (commande?.id) {
        await CommandeService.delete(commande.id);
        navigate('/commandes');
      }
    } catch (err) {
      console.error('Error deleting order:', err);
      setError('Failed to delete order');
    }
  };

  const handleEditOrder = () => {
    if (commande?.id) {
      navigate(`/commandes/${commande.id}/edit`);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: '#FFC107',
      ENCOURS: '#1976D2',
      COMPLETED: '#4CAF50',
      CANCELLED: '#F44336',
      ON_HOLD: '#FF9800',
    };
    return colors[status] || '#999';
  };

  const handleOpenProcessingModal = (item: CommandeItem) => {
    setSelectedItem(item);
    setProcessingForm({
      rollId: '',
      lengthUsedM: '',
      widthRemainingMm: '',
      wasteType: 'DECHET',
      weightKg: '',
      notes: '',
    });
    // Load waste already created for this item
    loadWasteForItem(item.id);
    setShowProcessingModal(true);
  };

  const handleCloseProcessingModal = () => {
    setShowProcessingModal(false);
    setSelectedItem(null);
    setProcessingForm({
      rollId: '',
      lengthUsedM: '',
      widthRemainingMm: '',
      wasteType: 'DECHET',
      weightKg: '',
      notes: '',
    });
  };

  const loadWasteForItem = async (itemId: string) => {
    try {
      // Fetch waste for this specific commande item
      const response = await WastePieceService.getAll();
      if (response.data) {
        const wastes = Array.isArray(response.data) ? response.data : [];
        const itemWaste = wastes.filter((w: any) => w.commandeItemId === itemId);
        setWasteForItem(itemWaste);
      }
    } catch (err) {
      console.error('Error loading waste:', err);
    }
  };

  const handleProcessingInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProcessingForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProcessRoll = async () => {
    if (!selectedItem || !processingForm.rollId) {
      alert('Please select a roll');
      return;
    }

    try {
      const selectedRoll = rolls.find(r => r.id === processingForm.rollId);
      if (!selectedRoll) {
        alert('Roll not found');
        return;
      }

      const lengthUsed = parseFloat(processingForm.lengthUsedM) || 0;
      const widthRemaining = parseInt(processingForm.widthRemainingMm) || selectedRoll.widthMm;
      
      // Calculate waste dimensions
      const wasteLength = lengthUsed;
      const wasteWidth = selectedRoll.widthMm - widthRemaining;

      if (wasteWidth > 0 && wasteLength > 0) {
        // Create waste record
        const wasteData = {
          rollId: processingForm.rollId,
          commandeItemId: selectedItem.id,
          materialType: selectedRoll.materialType,
          widthMm: wasteWidth,
          lengthM: wasteLength,
          wasteType: processingForm.wasteType,
          weightKg: processingForm.weightKg ? parseFloat(processingForm.weightKg) : 0,
          notes: processingForm.notes,
          status: 'AVAILABLE',
          quantityPieces: 1,
        };

        await WastePieceService.create(wasteData);

        // Mark roll as opened (being used)
        await RollService.updateStatus(processingForm.rollId, 'OPENED');

        // Reload data
        await loadWasteForItem(selectedItem.id);
        const res = await CommandeService.getById(id!);
        if (res.data) {
          setCommande(res.data);
        }

        setError(null);
        // Don't close modal - let operator add more waste if needed
        alert('Waste recorded successfully!');
      } else {
        alert('Invalid waste dimensions');
      }
    } catch (err) {
      console.error('Error processing roll:', err);
      setError('Failed to record waste');
    }
  };

  if (loading) {
    return <div className="commande-detail-page loading">Loading order details...</div>;
  }

  if (!commande) {
    return (
      <div className="commande-detail-page error">
        <h2>Order not found</h2>
        <button className="btn btn-primary" onClick={() => navigate('/commandes')}>
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div className="commande-detail-page">
      <div className="page-header">
        <div className="header-title">
          <h1>{commande.numeroCommande}</h1>
          <span className="status-badge" style={{ backgroundColor: getStatusColor(commande.status) }}>
            {commande.status}
          </span>
        </div>
        <div className="header-actions">
          <button className="btn btn-info" onClick={handleEditOrder}>
            Edit
          </button>
          <button className="btn btn-danger" onClick={handleDeleteOrder}>
            Delete Order
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/commandes')}>
            Back
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Order Information */}
      <div className="detail-section">
        <h2>Order Information</h2>
        <div className="info-grid">
          <div className="info-item">
            <strong>Order Number</strong>
            <p>{commande.numeroCommande}</p>
          </div>
          <div className="info-item">
            <strong>Client</strong>
            <p>{commande.clientName}</p>
          </div>
          <div className="info-item">
            <strong>Created By</strong>
            <p>{commande.createdByName || 'N/A'}</p>
          </div>
          <div className="info-item">
            <strong>Created Date</strong>
            <p>{new Date(commande.createdAt).toLocaleString()}</p>
          </div>
          <div className="info-item">
            <strong>Total Items</strong>
            <p className="value-highlight">{commande.items?.length || 0}</p>
          </div>
        </div>

        {commande.description && (
          <div className="info-item full-width">
            <strong>Description</strong>
            <p>{commande.description}</p>
          </div>
        )}

        {commande.notes && (
          <div className="info-item full-width">
            <strong>Notes</strong>
            <p>{commande.notes}</p>
          </div>
        )}
      </div>

      {/* Status Update Section */}
      <div className="detail-section status-section">
        <h2>Update Order Status</h2>
        <div className="status-update-controls">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="status-select"
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <button
            className="btn btn-primary"
            onClick={handleStatusUpdate}
            disabled={updating || selectedStatus === commande.status}
          >
            {updating ? 'Updating...' : 'Update Status'}
          </button>
        </div>
      </div>

      {/* Order Items Section */}
      <div className="detail-section items-section">
        <h2>Order Items ({commande.items?.length || 0})</h2>

        {!commande.items || commande.items.length === 0 ? (
          <div className="empty-state">
            <p>No items in this order</p>
          </div>
        ) : (
          <div className="items-list-table">
            {commande.items.map((item: CommandeItem) => (
              <div key={item.id} className="item-card">
                <div className="item-summary">
                  <div className="item-badge">Line {item.lineNumber}</div>
                  <div className="item-specs">
                    <span className="material">{item.materialType}</span>
                    <span className="specs">
                      {item.nbPlis}P | {item.thicknessMm}mm | {item.longueurM}m × {item.largeurMm}mm
                    </span>
                  </div>
                  <div className="item-qty">Qty: {item.quantite}</div>
                  <div className="item-status">
                    <select
                      value={item.status}
                      onChange={(e) =>
                        handleItemStatusUpdate(item.id, e.target.value as ItemStatus)
                      }
                      className={`item-status-select status-${item.status.toLowerCase()}`}
                    >
                      {itemStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="item-movement">
                    <span className="movement-badge">{item.typeMouvement}</span>
                  </div>
                  <div className="item-actions">
                    <button
                      className="btn btn-small btn-info"
                      onClick={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)}
                    >
                      {expandedItemId === item.id ? 'Hide' : 'Show'} Cutting Details
                    </button>
                    <button
                      className="btn btn-small btn-danger"
                      onClick={() => handleDeleteItem(item.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Expanded Roll Processing Section */}
                {expandedItemId === item.id && (
                  <div className="item-processing-details">
                    <div className="processing-section">
                      <h4>Roll Processing & Waste Tracking</h4>
                      <button
                        className="btn btn-primary btn-small"
                        onClick={() => handleOpenProcessingModal(item)}
                      >
                        + Process Roll (Update Dimensions)
                      </button>
                      
                      {/* Waste Created for This Item */}
                      <div className="waste-list">
                        <h5>Waste Created:</h5>
                        {wasteForItem.length === 0 ? (
                          <p className="no-data">No waste recorded yet</p>
                        ) : (
                          <div className="waste-items">
                            {wasteForItem.map((waste: any) => (
                              <div key={waste.id} className="waste-item">
                                <span className="waste-type">{waste.wasteType}</span>
                                <span className="waste-dims">
                                  {waste.lengthM}m × {waste.widthMm}mm ({waste.areaM2?.toFixed(2)}m²)
                                </span>
                                <span className="waste-weight">{waste.weightKg}kg</span>
                                <span className="waste-date">
                                  {new Date(waste.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Processing Modal */}
      {showProcessingModal && selectedItem && (
        <div className="modal-overlay" onClick={handleCloseProcessingModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Process Roll - Line {selectedItem.lineNumber}</h3>
              <button className="modal-close" onClick={handleCloseProcessingModal}>✕</button>
            </div>
            
            <div className="modal-body">
              <div className="form-section">
                <h4>Select Roll</h4>
                <div className="form-group">
                  <label>Roll *</label>
                  <select
                    name="rollId"
                    value={processingForm.rollId}
                    onChange={handleProcessingInputChange}
                    className="form-input"
                  >
                    <option value="">-- Select a Roll --</option>
                    {rolls.map((roll) => (
                      <option key={roll.id} value={roll.id}>
                        {roll.referenceRouleau} - {roll.lengthRemainingM || roll.lengthM}m × {roll.widthMm}mm
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-section">
                <h4>Update Dimensions (to calculate waste)</h4>
                <div className="form-group">
                  <label>Length Used (m)</label>
                  <input
                    type="number"
                    name="lengthUsedM"
                    value={processingForm.lengthUsedM}
                    onChange={handleProcessingInputChange}
                    placeholder="0.00"
                    step="0.01"
                    className="form-input"
                  />
                  <small>Length of material used from the roll</small>
                </div>

                <div className="form-group">
                  <label>Remaining Width (mm)</label>
                  <input
                    type="number"
                    name="widthRemainingMm"
                    value={processingForm.widthRemainingMm}
                    onChange={handleProcessingInputChange}
                    placeholder="0"
                    className="form-input"
                  />
                  <small>Width remaining after cut (waste width = original width - remaining width)</small>
                </div>
              </div>

              <div className="form-section">
                <h4>Waste Classification</h4>
                <div className="form-group">
                  <label>Waste Type *</label>
                  <select
                    name="wasteType"
                    value={processingForm.wasteType}
                    onChange={handleProcessingInputChange}
                    className="form-input"
                  >
                    <option value="DECHET">Déchet (Scrap)</option>
                    <option value="REUSABLE">Réutilisable (Reusable)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Weight (kg)</label>
                  <input
                    type="number"
                    name="weightKg"
                    value={processingForm.weightKg}
                    onChange={handleProcessingInputChange}
                    placeholder="0.00"
                    step="0.01"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    name="notes"
                    value={processingForm.notes}
                    onChange={handleProcessingInputChange}
                    placeholder="Add notes..."
                    className="form-input"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleCloseProcessingModal}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleProcessRoll}>
                Record Waste & Update Roll
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
