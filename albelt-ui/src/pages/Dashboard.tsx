import { useEffect, useState } from 'react';
import type { InventoryMetrics, WasteMetrics, Roll } from '../types/index';
import { DashboardService } from '@services/dashboardService';
import { useI18n } from '@hooks/useI18n';
import { formatDate } from '../utils/date';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';

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
      const response = await DashboardService.getStats();

      if (response.success && response.data) {
        setInventoryMetrics(response.data.inventoryMetrics as InventoryMetrics);
        setWasteMetrics(response.data.wasteMetrics as WasteMetrics);
        setRecentRolls(response.data.recentRolls || []);
      } else {
        setError(response.message || t('messages.failedToLoad'));
      }
    } catch (err) {
      setError(t('messages.failedToLoad'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const statusSeverity = (status?: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'success';
      case 'OPENED':
        return 'warning';
      case 'EXHAUSTED':
        return 'secondary';
      case 'ARCHIVED':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <div className="albel-dashboard">
      <div className="albel-dashboard__header">
        <h1 className="albel-dashboard__title">{t('dashboard.title')}</h1>
        <Button icon="pi pi-refresh" label={t('common.refresh')} onClick={loadDashboardData} />
      </div>

      {error && <Message severity="error" text={error} />}

      <div className="albel-dashboard__sections">
        <Card title={t('dashboard.overview')}>
          {inventoryMetrics && (
            <div className="albel-dashboard__sectionBody">
              <div className="albel-dashboard__stats">
                <div className="albel-stat">
                  <div className="albel-stat__label">{t('dashboard.totalRolls')}</div>
                  <div className="albel-stat__value">{inventoryMetrics.totalRolls}</div>
                </div>
                <div className="albel-stat">
                  <div className="albel-stat__label">{t('dashboard.totalArea')}</div>
                  <div className="albel-stat__value">{inventoryMetrics.totalArea.toFixed(2)}</div>
                </div>
              </div>

              <DataTable value={inventoryMetrics.byMaterial} size="small" emptyMessage={t('messages.noDataAvailable')}>
                <Column field="material" header={t('inventory.material')} />
                <Column field="count" header={t('common.list')} />
                <Column header={t('rolls.area')} body={(row) => row.area.toFixed(2)} />
              </DataTable>
            </div>
          )}
        </Card>

        <Card title={t('navigation.waste')}>
          {wasteMetrics && (
            <div className="albel-dashboard__sectionBody">
              <div className="albel-dashboard__stats">
                <div className="albel-stat">
                  <div className="albel-stat__label">{t('rollDetail.totalWaste')}</div>
                  <div className="albel-stat__value">{wasteMetrics.totalWaste}</div>
                </div>
                <div className="albel-stat">
                  <div className="albel-stat__label">{t('waste.reuseEfficiency')}</div>
                  <div className="albel-stat__value">{wasteMetrics.reuseEfficiency.toFixed(1)}%</div>
                </div>
              </div>

              <DataTable value={wasteMetrics.byStatus} size="small" emptyMessage={t('messages.noDataAvailable')}>
                <Column field="status" header={t('users.status')} />
                <Column field="count" header={t('common.list')} />
              </DataTable>
            </div>
          )}
        </Card>
      </div>

      <Card title={t('dashboard.recentRolls')}>
        {recentRolls.length > 0 ? (
          <DataTable value={recentRolls} dataKey="id" size="small">
            <Column
              header={t('inventory.material')}
              body={(roll: Roll) => <Tag value={roll.materialType} />}
            />
            <Column field="widthMm" header={t('rolls.width')} />
            <Column header={t('rolls.length')} body={(roll: Roll) => roll.lengthM.toFixed(2)} />
            <Column header={t('rolls.area')} body={(roll: Roll) => roll.areaM2.toFixed(2)} />
            <Column
              header={t('users.status')}
              body={(roll: Roll) => <Tag value={roll.status} severity={statusSeverity(roll.status)} />}
            />
            <Column header={t('movements.date')} body={(roll: Roll) => formatDate(roll.receivedDate)} />
          </DataTable>
        ) : (
          <Message severity="info" text={t('messages.noDataAvailable')} />
        )}
      </Card>
    </div>
  );
}

export default Dashboard;