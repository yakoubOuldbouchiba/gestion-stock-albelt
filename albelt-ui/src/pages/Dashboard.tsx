import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import type { InventoryMetrics, WasteMetrics, Roll } from '../types/index';
import { RollService } from '@services/rollService';
import { useI18n } from '@hooks/useI18n';
import '../styles/Dashboard.css';
import { formatDate } from '../utils/date';

export function Dashboard() {
  const { t } = useI18n();
  const [inventoryMetrics, setInventoryMetrics] = useState<InventoryMetrics | null>(null);
  const [wasteMetrics, setWasteMetrics] = useState<WasteMetrics | null>(null);
  const [recentRolls, setRecentRolls] = useState<Roll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Load all rolls to calculate metrics
      const response = await RollService.getAll();
      
      if (response.success && response.data) {
        const rolls = response.data;
        setRecentRolls(rolls.slice(0, 5));

        // Calculate inventory metrics
        const totalRolls = rolls.length;
        const totalArea = rolls.reduce((sum, roll) => sum + roll.areaM2, 0);
        
        const byMaterial = [
          { material: 'PU' as const, count: 0, area: 0 },
          { material: 'PVC' as const, count: 0, area: 0 },
          { material: 'CAOUTCHOUC' as const, count: 0, area: 0 },
        ];

        rolls.forEach(roll => {
          const material = byMaterial.find(m => m.material === roll.materialType);
          if (material) {
            material.count++;
            material.area += roll.areaM2;
          }
        });

        setInventoryMetrics({
          totalRolls,
          totalArea,
          byMaterial,
        });

        // Set waste metrics (will update when waste service is available)
        setWasteMetrics({
          totalWaste: 0,
          totalArea: 0,
          reuseEfficiency: 0,
          byStatus: [
            { status: 'AVAILABLE', count: 0, area: 0 },
            { status: 'USED_IN_ORDER', count: 0, area: 0 },
            { status: 'SCRAP', count: 0, area: 0 },
          ],
        });
      }
    } catch (err) {
      setError(t('messages.failedToLoad'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="dashboard-loading">{t('common.loading_data')}</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>{t('dashboard.title')}</h1>
        <button onClick={loadDashboardData} className="refresh-button">
          <RefreshCw size={18} /> {t('common.refresh')}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="dashboard-grid">
        {/* Inventory Metrics Section */}
        <section className="metrics-section">
          <h2>{t('dashboard.overview')}</h2>
          {inventoryMetrics && (
            <div className="metrics-cards">
              <div className="metric-card">
                <div className="metric-value">{inventoryMetrics.totalRolls}</div>
                <div className="metric-label">{t('dashboard.totalRolls')}</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{inventoryMetrics.totalArea.toFixed(2)}</div>
                <div className="metric-label">{t('dashboard.totalArea')}</div>
              </div>

              <div className="material-breakdown">
                <h3>{t('inventory.material')}</h3>
                <div className="material-items">
                  {inventoryMetrics.byMaterial.map(material => (
                    <div key={material.material} className="material-item">
                      <span className="material-name">{material.material}</span>
                      <span className="material-count">{material.count} {t('common.list')}</span>
                      <span className="material-area">{material.area.toFixed(2)} m²</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Waste Metrics Section */}
        <section className="metrics-section">
          <h2>{t('navigation.waste')}</h2>
          {wasteMetrics && (
            <div className="metrics-cards">
              <div className="metric-card">
                <div className="metric-value">{wasteMetrics.totalWaste}</div>
                <div className="metric-label">{t('navigation.waste')}</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{wasteMetrics.reuseEfficiency.toFixed(1)}%</div>
                <div className="metric-label">{t('inventory.totalMaterial')}</div>
              </div>

              <div className="waste-status">
                <h3>{t('users.status')}</h3>
                <div className="status-items">
                  {wasteMetrics.byStatus.map(status => (
                    <div key={status.status} className="status-item">
                      <span className="status-name">{status.status}</span>
                      <span className="status-count">{status.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Recent Rolls Section */}
      <section className="recent-section">
        <h2>{t('dashboard.recentRolls')}</h2>
        {recentRolls.length > 0 ? (
          <div className="rolls-table">
            <table>
              <thead>
                <tr>
                  <th>{t('inventory.material')}</th>
                  <th>{t('rolls.width')}</th>
                  <th>{t('rolls.length')}</th>
                  <th>{t('rolls.area')}</th>
                  <th>{t('users.status')}</th>
                  <th>{t('movements.date')}</th>
                </tr>
              </thead>
              <tbody>
                {recentRolls.map(roll => (
                  <tr key={roll.id}>
                    <td><span className="badge">{roll.materialType}</span></td>
                    <td>{roll.widthMm}</td>
                    <td>{roll.lengthM.toFixed(2)}</td>
                    <td>{roll.areaM2.toFixed(2)}</td>
                    <td><span className={`status-badge status-${roll.status.toLowerCase()}`}>{roll.status}</span></td>
                    <td>{formatDate(roll.receivedDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-state">{t('messages.noDataAvailable')}</p>
        )}
      </section>
    </div>
  );
}

export default Dashboard;
