import { useEffect, useState } from 'react';
import { FileText, BarChart2, AlertCircle, Zap, TrendingUp, Recycle } from 'lucide-react';
import { useI18n } from '@hooks/useI18n';
import type { CuttingOperation, MaterialType } from '../types/index';
import { AnalyticsService } from '@services/analyticsService';
import { RollService } from '@services/rollService';
import '../styles/ReportsPage.css';

interface OperatorMetric {
  operatorId: string;
  operatorName: string;
  avgUtilization: number;
}

interface MaterialStats {
  material: MaterialType;
  count: number;
  area: number;
}

export function ReportsPage() {
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Overview Stats
  const [totalOperations, setTotalOperations] = useState(0);
  const [highEfficiencyOps, setHighEfficiencyOps] = useState<CuttingOperation[]>([]);
  const [wasteOps, setWasteOps] = useState<CuttingOperation[]>([]);

  // Operator Performance
  const [operatorMetrics, setOperatorMetrics] = useState<OperatorMetric[]>([]);

  // Waste Analytics
  const [wasteStats, setWasteStats] = useState({
    available: 0,
    used: 0,
    scrap: 0,
    total: 0,
    totalWasteArea: 0,
  });
  const [wasteAreaByMaterial, setWasteAreaByMaterial] = useState<Record<MaterialType, number>>({
    PU: 0,
    PVC: 0,
    CAOUTCHOUC: 0,
  });

  // Material Inventory
  const [materialStats, setMaterialStats] = useState<MaterialStats[]>([
    { material: 'PU', count: 0, area: 0 },
    { material: 'PVC', count: 0, area: 0 },
    { material: 'CAOUTCHOUC', count: 0, area: 0 },
  ]);

  // Date Range Filter
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateRangeOps, setDateRangeOps] = useState<CuttingOperation[]>([]);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'efficiency' | 'waste' | 'inventory'>('overview');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Load overview metrics
      const [totalCountRes, highEffRes, wasteRes, operatorRes] = await Promise.all([
        AnalyticsService.getTotalOperationsCount(),
        AnalyticsService.getHighEfficiencyOperations(0, 100),
        AnalyticsService.getSignificantWasteOperations(0, 100),
        AnalyticsService.getOperatorPerformance(),
      ]);

      if (totalCountRes.success) setTotalOperations(totalCountRes.data || 0);
      if (highEffRes.success && highEffRes.data) setHighEfficiencyOps(highEffRes.data);
      if (wasteRes.success && wasteRes.data) setWasteOps(wasteRes.data);
      if (operatorRes.success && operatorRes.data) setOperatorMetrics(operatorRes.data);

      // Load waste statistics
      const [availableRes, usedRes, scrapRes, wasteAreaRes] = await Promise.all([
        AnalyticsService.getWasteCountByStatus('AVAILABLE'),
        AnalyticsService.getWasteCountByStatus('USED_IN_ORDER'),
        AnalyticsService.getWasteCountByStatus('SCRAP'),
        AnalyticsService.getTotalWasteAreaByMaterial(),
      ]);

      if (availableRes.success) {
        setWasteStats(prev => ({ ...prev, available: availableRes.data || 0 }));
      }
      if (usedRes.success) {
        setWasteStats(prev => ({ ...prev, used: usedRes.data || 0 }));
      }
      if (scrapRes.success) {
        setWasteStats(prev => {
          const scrapCount = scrapRes.data || 0;
          const total = (availableRes.data || 0) + (usedRes.data || 0) + scrapCount;
          return { ...prev, scrap: scrapCount, total };
        });
      }
      if (wasteAreaRes.success && wasteAreaRes.data) {
        setWasteAreaByMaterial(wasteAreaRes.data);
        const totalArea = Object.values(wasteAreaRes.data).reduce((sum, area) => sum + area, 0);
        setWasteStats(prev => ({ ...prev, totalWasteArea: totalArea }));
      }

      // Load material inventory stats
      const allRolls = await RollService.getAll();
      if (allRolls.success && allRolls.data) {
        const stats = {
          PU: { count: 0, area: 0 },
          PVC: { count: 0, area: 0 },
          CAOUTCHOUC: { count: 0, area: 0 },
        };

        allRolls.data.forEach(roll => {
          if (!(roll.materialType in stats)) return;
          stats[roll.materialType as MaterialType].count++;
          stats[roll.materialType as MaterialType].area += roll.areaM2;
        });

        setMaterialStats(
          Object.entries(stats).map(([material, data]) => ({
            material: material as MaterialType,
            ...data,
          }))
        );
      }

      // Load date range operations
      const dateRes = await AnalyticsService.getOperationsByDateRange(startDate, endDate);
      if (dateRes.success && dateRes.data) {
        setDateRangeOps(dateRes.data);
      }
    } catch (err) {
      setError('Failed to load analytics data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateRangeChange = async () => {
    try {
      const res = await AnalyticsService.getOperationsByDateRange(startDate, endDate);
      if (res.success && res.data) {
        setDateRangeOps(res.data);
      }
    } catch (err) {
      setError(t('messages.failedToLoad'));
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    const csv = [Object.keys(data[0] || {}).join(','), ...data.map(row => Object.values(row).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getEfficiencyPercentage = (): number => {
    return totalOperations > 0 ? Math.round((highEfficiencyOps.length / totalOperations) * 100) : 0;
  };

  const getWastePercentage = (): number => {
    return totalOperations > 0 ? Math.round((wasteOps.length / totalOperations) * 100) : 0;
  };

  if (isLoading) {
    return <div className="page-loading">{t('messages.loading')}</div>;
  }

  return (
    <div className="reports-page">
      <div className="page-header">
        <h1>{t('reports.analyticsTitle')}</h1>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={loadAnalytics}>
            ↻ {t('common.refresh')}
          </button>
          <button className="btn btn-secondary" onClick={() => exportToCSV([{ data: 'exported' }], 'report.csv')}>
            ⬇ {t('common.export')}
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          {t('reports.overview')}
        </button>
        <button
          className={`tab-btn ${activeTab === 'efficiency' ? 'active' : ''}`}
          onClick={() => setActiveTab('efficiency')}
        >
          {t('reports.efficiencyAnalysis')}
        </button>
        <button
          className={`tab-btn ${activeTab === 'waste' ? 'active' : ''}`}
          onClick={() => setActiveTab('waste')}
        >
          {t('reports.wasteManagement')}
        </button>
        <button
          className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          {t('reports.inventoryStatus')}
        </button>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="tab-content overview-tab">
          {/* Key Metrics */}
          <div className="metrics-grid">
            <div className="metric-card metric-primary">
              <FileText size={24} className="metric-icon" />
              <div className="metric-content">
                <div className="metric-label">{t('reports.totalOperations')}</div>
                <div className="metric-value">{totalOperations}</div>
              </div>
            </div>

            <div className="metric-card metric-success">
              <Zap size={24} className="metric-icon" />
              <div className="metric-content">
                <div className="metric-label">{t('reports.highEfficiency')}</div>
                <div className="metric-value">{highEfficiencyOps.length}</div>
                <div className="metric-subtext">{getEfficiencyPercentage()}% {t('reports.ofTotal')}</div>
              </div>
            </div>

            <div className="metric-card metric-warning">
              <TrendingUp size={24} className="metric-icon" />
              <div className="metric-content">
                <div className="metric-label">{t('reports.significantWaste')}</div>
                <div className="metric-value">{wasteOps.length}</div>
                <div className="metric-subtext">{getWastePercentage()}% {t('reports.ofTotal')}</div>
              </div>
            </div>

            <div className="metric-card metric-info">
              <Recycle size={24} className="metric-icon" />
              <div className="metric-content">
                <div className="metric-label">{t('reports.wasteReused')}</div>
                <div className="metric-value">{wasteStats.used}</div>
                <div className="metric-subtext">{wasteStats.total ? Math.round((wasteStats.used / wasteStats.total) * 100) : 0}%</div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="quick-stats">
            <div className="stat-section">
              <h3>{t('reports.wasteSummary')}</h3>
              <div className="stat-rows">
                <div className="stat-row">
                  <span className="stat-name">{t('reports.availableForReuse')}:</span>
                  <span className="stat-value">{wasteStats.available} {t('reports.pieces')}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-name">{t('reports.totalWasteArea')}:</span>
                  <span className="stat-value">{wasteStats.totalWasteArea?.toFixed(2) || '0.00'} m²</span>
                </div>
                <div className="stat-row">
                  <span className="stat-name">{t('reports.scrapDiscarded')}:</span>
                  <span className="stat-value">{wasteStats.scrap} {t('reports.pieces')}</span>
                </div>
              </div>
            </div>

            <div className="stat-section">
              <h3>{t('reports.materialDistribution')}</h3>
              <div className="material-bars">
                {materialStats.map(m => (
                  <div key={m.material} className="material-bar">
                    <div className="bar-label">{m.material}</div>
                    <div className="bar-container">
                      <div className="bar-fill" style={{ width: `${Math.min((m.count / Math.max(...materialStats.map(x => x.count), 1)) * 100, 100)}%` }}></div>
                    </div>
                    <div className="bar-value">{m.count} pieces</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EFFICIENCY ANALYSIS TAB */}
      {activeTab === 'efficiency' && (
        <div className="tab-content efficiency-tab">
          {/* Operator Performance */}
          <div className="section-card">
            <h2>{t('reports.operatorPerformance')}</h2>
            {operatorMetrics.length > 0 ? (
              <div className="performance-table">
                <table>
                  <thead>
                    <tr>
                      <th>{t('reports.operator')}</th>
                      <th>{t('reports.avgUtilization')}</th>
                      <th>{t('reports.performanceLevel')}</th>
                      <th>{t('reports.operations')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {operatorMetrics.map((metric, idx) => (
                      <tr key={idx}>
                        <td className="operator-name">{metric.operatorName}</td>
                        <td>
                          <div className="utilization-bar">
                            <div
                              className="bar-fill"
                              style={{ width: `${metric.avgUtilization}%` }}
                            ></div>
                            <span className="bar-label">{metric.avgUtilization.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td>
                          {metric.avgUtilization >= 75 ? (
                            <span className="badge badge-success"><Zap size={14} className="badge-icon" /> {t('reports.high')}</span>
                          ) : metric.avgUtilization >= 50 ? (
                            <span className="badge badge-info"><BarChart2 size={14} className="badge-icon" /> {t('reports.medium')}</span>
                          ) : (
                            <span className="badge badge-warning"><AlertCircle size={14} className="badge-icon" /> {t('reports.low')}</span>
                          )}
                        </td>
                        <td>
                          <strong>{highEfficiencyOps.filter(op => op.operatorId === metric.operatorId).length}</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="empty-state">{t('reports.noOperatorData')}</p>
            )}
          </div>

          {/* High Efficiency Operations */}
          <div className="section-card">
            <h2>{t('reports.highEfficiencyOps')}</h2>
            {highEfficiencyOps.length > 0 ? (
              <div className="operations-summary">
                <p className="summary-text">
                  {highEfficiencyOps.length} {t('reports.operationsAchievedEfficiency')}
                </p>
                <button className="btn btn-secondary" onClick={() => exportToCSV(highEfficiencyOps, 'high-efficiency-ops.csv')}>
                  {t('reports.exportDetails')}
                </button>
              </div>
            ) : (
              <p className="empty-state">{t('reports.noHighEfficiencyOps')}</p>
            )}
          </div>
        </div>
      )}

      {/* WASTE MANAGEMENT TAB */}
      {activeTab === 'waste' && (
        <div className="tab-content waste-tab">
          {/* Waste Area by Material */}
          <div className="section-card">
            <h2>{t('reports.wasteAreaByMaterial')}</h2>
            <div className="waste-materials">
              {Object.entries(wasteAreaByMaterial).map(([material, area]) => (
                <div key={material} className="waste-material-card">
                  <div className="material-name">{material}</div>
                  <div className="material-area">{area.toFixed(2)}</div>
                  <div className="material-unit">m²</div>
                </div>
              ))}
            </div>
          </div>

          {/* Waste Status Summary */}
          <div className="section-card">
            <h2>{t('reports.wasteStatusDistribution')}</h2>
            <div className="waste-status-grid">
              <div className="waste-status-card available">
                <div className="status-label">{t('reports.availableForReuse')}</div>
                <div className="status-count">{wasteStats.available}</div>
              </div>
              <div className="waste-status-card used">
                <div className="status-label">{t('reports.successfullyReused')}</div>
                <div className="status-count">{wasteStats.used}</div>
              </div>
              <div className="waste-status-card scrap">
                <div className="status-label">{t('reports.scrapDiscarded')}</div>
                <div className="status-count">{wasteStats.scrap}</div>
                <div className="status-label">{t('reports.scrapped')}</div>
              </div>
            </div>
          </div>

          {/* Significant Waste Operations */}
          <div className="section-card">
            <h2>{t('reports.significantWasteOps')}</h2>
            {wasteOps.length > 0 ? (
              <div className="operations-summary">
                <p className="summary-text">
                  {wasteOps.length} {t('reports.operationsSignificantWaste')}
                </p>
                <button className="btn btn-secondary" onClick={() => exportToCSV(wasteOps, 'significant-waste-ops.csv')}>
                  {t('reports.exportDetails')}
                </button>
              </div>
            ) : (
              <p className="empty-state">{t('reports.noWasteOpsFound')}</p>
            )}
          </div>
        </div>
      )}

      {/* INVENTORY STATUS TAB */}
      {activeTab === 'inventory' && (
        <div className="tab-content inventory-tab">
          {/* Material Inventory */}
          <div className="section-card">
            <h2>{t('reports.inventoryByMaterial')}</h2>
            <div className="inventory-table">
              <table>
                <thead>
                  <tr>
                    <th>{t('reports.material')}</th>
                    <th>{t('reports.quantityPieces')}</th>
                    <th>{t('reports.totalAreaM2')}</th>
                    <th>{t('reports.avgAreaPiece')}</th>
                  </tr>
                </thead>
                <tbody>
                  {materialStats.map(m => (
                    <tr key={m.material}>
                      <td>
                        <span className={`material-badge ${m.material.toLowerCase()}`}>{m.material}</span>
                      </td>
                      <td className="quantity">{m.count}</td>
                      <td className="area">{m.area.toFixed(2)}</td>
                      <td className="avg-area">{m.count > 0 ? (m.area / m.count).toFixed(2) : '0.00'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Date Range Query */}
          <div className="section-card">
            <h2>{t('reports.operationsByDateRange')}</h2>
            <div className="date-filter">
              <div className="filter-group">
                <label htmlFor="start-date">{t('reports.from')}:</label>
                <input
                  type="date"
                  id="start-date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="filter-group">
                <label htmlFor="end-date">{t('reports.to')}:</label>
                <input
                  type="date"
                  id="end-date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <button className="btn btn-primary" onClick={handleDateRangeChange}>
                {t('reports.query')}
              </button>
            </div>
            <div className="date-results">
              <p className="result-count">
                {t('reports.found')} <strong>{dateRangeOps.length}</strong> {t('reports.operationsDateRange')}
              </p>
              {dateRangeOps.length > 0 && (
                <button
                  className="btn btn-secondary"
                  onClick={() => exportToCSV(dateRangeOps, 'date-range-operations.csv')}
                >
                  {t('reports.exportResults')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
