import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CommandeService } from '../services/commandeService';
import { ClientService } from '../services/clientService';
import type { Commande, Client, CommandeStatus } from '../types';
import '../styles/CommandesListPage.css';

export function CommandesListPage() {
  const navigate = useNavigate();
  
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<string>('');

  const statuses: CommandeStatus[] = ['PENDING', 'ENCOURS', 'COMPLETED', 'CANCELLED', 'ON_HOLD'];

  // Fetch orders and clients on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [commandesRes, clientsRes] = await Promise.all([
          CommandeService.getAll(),
          ClientService.getAll(),
        ]);
        
        if (commandesRes.data) {
          setCommandes(commandesRes.data);
        }
        if (clientsRes.data) {
          setClients(clientsRes.data);
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter orders based on search and filters
  const filteredCommandes = commandes.filter((commande) => {
    const matchesSearch =
      commande.numeroCommande.toLowerCase().includes(searchQuery.toLowerCase()) ||
      commande.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = !selectedStatus || commande.status === selectedStatus;
    const matchesClient = !selectedClient || commande.clientId === selectedClient;

    return matchesSearch && matchesStatus && matchesClient;
  });

  const handleCreateOrder = () => {
    navigate('/commandes/create');
  };

  const handleViewOrder = (id: string) => {
    navigate(`/commandes/${id}`);
  };

  const handleDeleteOrder = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        await CommandeService.delete(id);
        setCommandes(commandes.filter((c) => c.id !== id));
      } catch (err) {
        setError('Failed to delete order');
      }
    }
  };

  const getStatusBadge = (status: CommandeStatus) => {
    const statusClasses: Record<CommandeStatus, string> = {
      PENDING: 'status-badge pending',
      ENCOURS: 'status-badge encours',
      COMPLETED: 'status-badge completed',
      CANCELLED: 'status-badge cancelled',
      ON_HOLD: 'status-badge on-hold',
    };
    return statusClasses[status] || 'status-badge';
  };

  if (loading) {
    return <div className="commandes-page loading">Loading orders...</div>;
  }

  return (
    <div className="commandes-page">
      <div className="page-header">
        <h1>Orders (Commandes)</h1>
        <button className="btn btn-primary" onClick={handleCreateOrder}>
          + New Order
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by order number or client name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filters">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="filter-select"
          >
            <option value="">All Statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="filter-select"
          >
            <option value="">All Clients</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="stats-section">
        <div className="stat-card">
          <h3>Total Orders</h3>
          <p className="stat-value">{filteredCommandes.length}</p>
        </div>
        <div className="stat-card">
          <h3>In Progress</h3>
          <p className="stat-value">
            {filteredCommandes.filter((c) => c.status === 'ENCOURS').length}
          </p>
        </div>
      </div>

      {filteredCommandes.length === 0 ? (
        <div className="empty-state">
          <p>No orders found</p>
          <button className="btn btn-primary" onClick={handleCreateOrder}>
            Create First Order
          </button>
        </div>
      ) : (
        <div className="orders-table-container">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order No.</th>
                <th>Client</th>
                <th>Status</th>
                <th>Items</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCommandes.map((commande) => (
                <tr key={commande.id}>
                  <td className="order-number">
                    <strong>{commande.numeroCommande}</strong>
                  </td>
                  <td>{commande.clientName}</td>
                  <td>
                    <span className={getStatusBadge(commande.status)}>
                      {commande.status}
                    </span>
                  </td>
                  <td className="text-center">{commande.items?.length || 0}</td>
                  <td className="text-small">
                    {new Date(commande.createdAt).toLocaleDateString()}
                  </td>
                  <td className="actions-cell">
                    <button
                      className="btn btn-small btn-info"
                      onClick={() => handleViewOrder(commande.id)}
                    >
                      View
                    </button>
                    <button
                      className="btn btn-small btn-danger"
                      onClick={() => handleDeleteOrder(commande.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
