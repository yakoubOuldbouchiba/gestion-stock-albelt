import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CommandeService } from '../services/commandeService';
import { ClientService } from '../services/clientService';
import type { Client, CommandeRequest, CommandeItemRequest, MaterialType, TypeMouvement } from '../types';
import '../styles/CommandeCreatePage.css';

export function CommandeCreatePage() {
  const navigate = useNavigate();

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state for order header
  const [numeroCommande, setNumeroCommande] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  // Form state for items
  const [items, setItems] = useState<CommandeItemRequest[]>([
    {
      materialType: 'PU',
      nbPlis: 1,
      thicknessMm: 2.5,
      longueurM: 5,
      longueurToleranceM: 0,
      largeurMm: 1000,
      quantite: 1,
      surfaceConsommeeM2: 5,
      typeMouvement: 'COUPE',
      lineNumber: 1,
    },
  ]);

  const materials: MaterialType[] = ['PU', 'PVC', 'CAOUTCHOUC'];
  const mouvements: TypeMouvement[] = ['ENCOURS', 'COUPE', 'SORTIE', 'RETOUR'];

  // Fetch clients on mount
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await ClientService.getAll();
        if (res.data) {
          setClients(res.data);
        }
      } catch (err) {
        console.error('Error fetching clients:', err);
        setError('Failed to load clients');
      }
    };

    fetchClients();
  }, []);

  // Generate order number
  const generateOrderNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    setNumeroCommande(`CMD-${timestamp}-${random}`);
  };

  const handleAddItem = () => {
    const newLineNumber = Math.max(...items.map((i) => i.lineNumber || 0)) + 1;
    setItems([
      ...items,
      {
        materialType: 'PU',
        nbPlis: 1,
        thicknessMm: 2.5,
        longueurM: 5,
        longueurToleranceM: 0,
        largeurMm: 1000,
        quantite: 1,
        surfaceConsommeeM2: 5,
        typeMouvement: 'COUPE',
        lineNumber: newLineNumber,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof CommandeItemRequest, value: unknown) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const calculateSurface = (item: CommandeItemRequest): number => {
    return (item.longueurM * item.largeurMm) / 1000;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!numeroCommande || !selectedClient || items.length === 0) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Validate items
      const validItems = items.map((item, index) => ({
        ...item,
        lineNumber: index + 1,
        surfaceConsommeeM2: calculateSurface(item),
      }));

      const request: CommandeRequest = {
        numeroCommande,
        clientId: selectedClient,
        status: 'PENDING',
        description,
        notes,
        items: validItems,
      };

      const res = await CommandeService.create(request);
      
      if (res.data?.id) {
        navigate(`/commandes/${res.data.id}`);
      }
    } catch (err) {
      console.error('Error creating order:', err);
      setError('Failed to create order. Please check your input and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? Unsaved changes will be lost.')) {
      navigate('/commandes');
    }
  };

  return (
    <div className="commande-create-page">
      <div className="page-header">
        <h1>Create New Order</h1>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="commande-form">
        {/* Order Header Section */}
        <div className="form-section">
          <h2>Order Header</h2>

          <div className="form-group">
            <label>Order Number *</label>
            <div className="input-with-button">
              <input
                type="text"
                value={numeroCommande}
                onChange={(e) => setNumeroCommande(e.target.value)}
                placeholder="CMD-XXXXXXXXX"
                required
              />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={generateOrderNumber}
              >
                Auto-Generate
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Client *</label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              required
            >
              <option value="">Select a client...</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Order description..."
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>
        </div>

        {/* Items Section */}
        <div className="form-section">
          <div className="section-header">
            <h2>Order Items</h2>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleAddItem}
            >
              + Add Item
            </button>
          </div>

          <div className="items-list">
            {items.map((item, index) => (
              <div key={index} className="item-card">
                <div className="item-header">
                  <h3>Item #{index + 1}</h3>
                  {items.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => handleRemoveItem(index)}
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="item-grid">
                  <div className="form-group">
                    <label>Material Type *</label>
                    <select
                      value={item.materialType}
                      onChange={(e) =>
                        handleItemChange(index, 'materialType', e.target.value)
                      }
                      required
                    >
                      {materials.map((mat) => (
                        <option key={mat} value={mat}>
                          {mat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Plies *</label>
                    <input
                      type="number"
                      min="1"
                      value={item.nbPlis}
                      onChange={(e) =>
                        handleItemChange(index, 'nbPlis', parseInt(e.target.value))
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Thickness (mm) *</label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={item.thicknessMm}
                      onChange={(e) =>
                        handleItemChange(index, 'thicknessMm', parseFloat(e.target.value))
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Length (m) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.longueurM}
                      onChange={(e) =>
                        handleItemChange(index, 'longueurM', parseFloat(e.target.value))
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Length Tolerance (m)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.longueurToleranceM || 0}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          'longueurToleranceM',
                          parseFloat(e.target.value)
                        )
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Width (mm) *</label>
                    <input
                      type="number"
                      min="0"
                      value={item.largeurMm}
                      onChange={(e) =>
                        handleItemChange(index, 'largeurMm', parseInt(e.target.value))
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Quantity *</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantite}
                      onChange={(e) =>
                        handleItemChange(index, 'quantite', parseInt(e.target.value))
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Movement Type *</label>
                    <select
                      value={item.typeMouvement}
                      onChange={(e) =>
                        handleItemChange(index, 'typeMouvement', e.target.value)
                      }
                      required
                    >
                      {mouvements.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Surface (m²)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={calculateSurface(item).toFixed(4)}
                      disabled
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Observations</label>
                  <textarea
                    value={item.observations || ''}
                    onChange={(e) =>
                      handleItemChange(index, 'observations', e.target.value)
                    }
                    placeholder="Item notes..."
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Order'}
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-lg"
            onClick={handleCancel}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
