import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '@hooks/useI18n';
import type { CuttingOperation, MaterialType } from '../types/index';
import { AnalyticsService } from '@services/analyticsService';
import { RollService } from '@services/rollService';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { TabView, TabPanel } from 'primereact/tabview';
import { Tag } from 'primereact/tag';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import { InputText } from 'primereact/inputtext';

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

  const [totalOperations, setTotalOperations] = useState(0);
  const [highEfficiencyOps, setHighEfficiencyOps] = useState<CuttingOperation[]>([]);
  const [wasteOps, setWasteOps] = useState<CuttingOperation[]>([]);

  const [operatorMetrics, setOperatorMetrics] = useState<OperatorMetric[]>([]);

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

  const [materialStats, setMaterialStats] = useState<MaterialStats[]>([
    { material: 'PU', count: 0, area: 0 },
    { material: 'PVC', count: 0, area: 0 },
    { material: 'CAOUTCHOUC', count: 0, area: 0 },
  ]);

  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateRangeOps, setDateRangeOps] = useState<CuttingOperation[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
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

      const [availableRes, usedRes, scrapRes, wasteAreaRes] = await Promise.all([
        AnalyticsService.getWasteCountByStatus('AVAILABLE'),
        AnalyticsService.getWasteCountByStatus('USED_IN_ORDER'),
        AnalyticsService.getWasteCountByStatus('SCRAP'),
        AnalyticsService.getTotalWasteAreaByMaterial(),
      ]);

      if (availableRes.success) {
        setWasteStats((prev) => ({ ...prev, available: availableRes.data || 0 }));
      }
      if (usedRes.success) {
        setWasteStats((prev) => ({ ...prev, used: usedRes.data || 0 }));
      }
      if (scrapRes.success) {
        setWasteStats((prev) => {
          const scrapCount = scrapRes.data || 0;
          const total = (availableRes.data || 0) + (usedRes.data || 0) + scrapCount;
          return { ...prev, scrap: scrapCount, total };
        });
      }
      if (wasteAreaRes.success && wasteAreaRes.data) {
        setWasteAreaByMaterial(wasteAreaRes.data);
        const totalArea = Object.values(wasteAreaRes.data).reduce((sum, area) => sum + area, 0);
        setWasteStats((prev) => ({ ...prev, totalWasteArea: totalArea }));
      }

      const allRolls = await RollService.getAll();
      if (allRolls.success && allRolls.data) {
        const stats = {
          PU: { count: 0, area: 0 },
          PVC: { count: 0, area: 0 },
          CAOUTCHOUC: { count: 0, area: 0 },
        };

        allRolls.data.forEach((roll) => {
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

      const dateRes = await AnalyticsService.getOperationsByDateRange(startDate, endDate);
      if (dateRes.success && dateRes.data) {
        setDateRangeOps(dateRes.data);
      }
    } catch (err) {
      setError(t('messages.failedToLoad'));
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
    const csv = [Object.keys(data[0] || {}).join(','), ...data.map((row) => Object.values(row).join(','))].join('\n');
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

  const opsByOperator = useMemo(() => {
    const map = new Map<string, number>();
    highEfficiencyOps.forEach((op) => {
      if (!op.operatorId) return;
      map.set(op.operatorId, (map.get(op.operatorId) || 0) + 1);
    });
    return map;
  }, [highEfficiencyOps]);

  const performanceBody = (metric: OperatorMetric) => {
    if (metric.avgUtilization >= 75) {
      return <Tag value={t('reports.high')} severity="success" />;
    }
    if (metric.avgUtilization >= 50) {
      return <Tag value={t('reports.medium')} severity="info" />;
    }
    return <Tag value={t('reports.low')} severity="warning" />;
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>{t('reports.analyticsTitle')}</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button icon="pi pi-refresh" label={t('common.refresh')} onClick={loadAnalytics} />
          <Button
            icon="pi pi-download"
            label={t('common.export')}
            severity="secondary"
            onClick={() => exportToCSV([{ data: 'exported' }], 'report.csv')}
          />
        </div>
      </div>

      {error && <Message severity="error" text={error} />}

      <TabView>
        <TabPanel header={t('reports.overview')}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <Card title={t('reports.totalOperations')}>
                <div style={{ fontSize: '1.5rem' }}>{totalOperations}</div>
              </Card>
              <Card title={t('reports.highEfficiency')}>
                <div style={{ fontSize: '1.5rem' }}>{highEfficiencyOps.length}</div>
                <small>{getEfficiencyPercentage()}% {t('reports.ofTotal')}</small>
              </Card>
              <Card title={t('reports.significantWaste')}>
                <div style={{ fontSize: '1.5rem' }}>{wasteOps.length}</div>
                <small>{getWastePercentage()}% {t('reports.ofTotal')}</small>
              </Card>
              <Card title={t('reports.wasteReused')}>
                <div style={{ fontSize: '1.5rem' }}>{wasteStats.used}</div>
                <small>{wasteStats.total ? Math.round((wasteStats.used / wasteStats.total) * 100) : 0}%</small>
              </Card>
            </div>

            <Card title={t('reports.wasteSummary')}>
              <DataTable
                value={[
                  { label: t('reports.availableForReuse'), value: wasteStats.available },
                  { label: t('reports.scrapDiscarded'), value: wasteStats.scrap },
                  { label: t('reports.totalWasteArea'), value: `${wasteStats.totalWasteArea.toFixed(2)} m²` },
                ]}
                size="small"
              >
                <Column field="label" header={t('common.name')} />
                <Column field="value" header={t('common.value')} />
              </DataTable>
            </Card>

            <Card title={t('reports.materialDistribution')}>
              <DataTable value={materialStats} size="small" emptyMessage={t('messages.noDataAvailable')}>
                <Column field="material" header={t('reports.material')} />
                <Column field="count" header={t('reports.quantityPieces')} />
                <Column header={t('reports.totalAreaM2')} body={(row: MaterialStats) => row.area.toFixed(2)} />
              </DataTable>
            </Card>
          </div>
        </TabPanel>

        <TabPanel header={t('reports.efficiencyAnalysis')}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <Card title={t('reports.operatorPerformance')}>
              {operatorMetrics.length > 0 ? (
                <DataTable value={operatorMetrics} size="small" emptyMessage={t('messages.noDataAvailable')}>
                  <Column field="operatorName" header={t('reports.operator')} />
                  <Column header={t('reports.avgUtilization')} body={(row: OperatorMetric) => `${row.avgUtilization.toFixed(1)}%`} />
                  <Column header={t('reports.performanceLevel')} body={performanceBody} />
                  <Column
                    header={t('reports.operations')}
                    body={(row: OperatorMetric) => opsByOperator.get(row.operatorId) || 0}
                  />
                </DataTable>
              ) : (
                <Message severity="info" text={t('reports.noOperatorData')} />
              )}
            </Card>

            <Card title={t('reports.highEfficiencyOps')}>
              {highEfficiencyOps.length > 0 ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>
                    {highEfficiencyOps.length} {t('reports.operationsAchievedEfficiency')}
                  </span>
                  <Button
                    icon="pi pi-download"
                    label={t('reports.exportDetails')}
                    severity="secondary"
                    onClick={() => exportToCSV(highEfficiencyOps, 'high-efficiency-ops.csv')}
                  />
                </div>
              ) : (
                <Message severity="info" text={t('reports.noHighEfficiencyOps')} />
              )}
            </Card>
          </div>
        </TabPanel>

        <TabPanel header={t('reports.wasteManagement')}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <Card title={t('reports.wasteAreaByMaterial')}>
              <DataTable
                value={Object.entries(wasteAreaByMaterial).map(([material, area]) => ({ material, area }))}
                size="small"
              >
                <Column field="material" header={t('reports.material')} />
                <Column header={t('reports.totalWasteArea')} body={(row) => row.area.toFixed(2)} />
              </DataTable>
            </Card>

            <Card title={t('reports.wasteStatusDistribution')}>
              <DataTable
                value={[
                  { status: t('reports.availableForReuse'), count: wasteStats.available },
                  { status: t('reports.successfullyReused'), count: wasteStats.used },
                  { status: t('reports.scrapDiscarded'), count: wasteStats.scrap },
                ]}
                size="small"
              >
                <Column field="status" header={t('common.status')} />
                <Column field="count" header={t('common.list')} />
              </DataTable>
            </Card>

            <Card title={t('reports.significantWasteOps')}>
              {wasteOps.length > 0 ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>
                    {wasteOps.length} {t('reports.operationsSignificantWaste')}
                  </span>
                  <Button
                    icon="pi pi-download"
                    label={t('reports.exportDetails')}
                    severity="secondary"
                    onClick={() => exportToCSV(wasteOps, 'significant-waste-ops.csv')}
                  />
                </div>
              ) : (
                <Message severity="info" text={t('reports.noWasteOpsFound')} />
              )}
            </Card>
          </div>
        </TabPanel>

        <TabPanel header={t('reports.inventoryStatus')}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <Card title={t('reports.inventoryByMaterial')}>
              <DataTable value={materialStats} size="small">
                <Column header={t('reports.material')} body={(row: MaterialStats) => <Tag value={row.material} />} />
                <Column field="count" header={t('reports.quantityPieces')} />
                <Column header={t('reports.totalAreaM2')} body={(row: MaterialStats) => row.area.toFixed(2)} />
                <Column
                  header={t('reports.avgAreaPiece')}
                  body={(row: MaterialStats) => (row.count > 0 ? (row.area / row.count).toFixed(2) : '0.00')}
                />
              </DataTable>
            </Card>

            <Card title={t('reports.operationsByDateRange')}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
                <div style={{ display: 'grid', gap: '0.25rem' }}>
                  <label htmlFor="start-date">{t('reports.from')}</label>
                  <InputText
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div style={{ display: 'grid', gap: '0.25rem' }}>
                  <label htmlFor="end-date">{t('reports.to')}</label>
                  <InputText
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <Button label={t('reports.query')} onClick={handleDateRangeChange} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                <span>
                  {t('reports.found')} <strong>{dateRangeOps.length}</strong> {t('reports.operationsDateRange')}
                </span>
                {dateRangeOps.length > 0 && (
                  <Button
                    icon="pi pi-download"
                    label={t('reports.exportResults')}
                    severity="secondary"
                    onClick={() => exportToCSV(dateRangeOps, 'date-range-operations.csv')}
                  />
                )}
              </div>
            </Card>
          </div>
        </TabPanel>
      </TabView>
    </div>
  );
}

export default ReportsPage;