import { useEffect, useState } from 'react';
import type { InventoryMetrics, WasteMetrics, Roll } from '../types/index';
import { RollService } from '@services/rollService';
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
      const response = await RollService.getAll();

      if (response.success && response.data) {
        const rolls = Array.isArray(response.data)
          ? response.data
          : response.data.items ?? (response.data as any).content ?? [];
        setRecentRolls(rolls.slice(0, 5));

        const totalRolls = rolls.length;
        const totalArea = rolls.reduce((sum, roll) => sum + roll.areaM2, 0);

        const byMaterial = [
          { material: 'PU' as const, count: 0, area: 0 },
          { material: 'PVC' as const, count: 0, area: 0 },
          { material: 'CAOUTCHOUC' as const, count: 0, area: 0 },
        ];

        rolls.forEach((roll) => {
          const material = byMaterial.find((m) => m.material === roll.materialType);
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

        setWasteMetrics({
          totalWaste: 0,
          totalArea: 0,
          reuseEfficiency: 0,
          byStatus: [
            { status: 'AVAILABLE', count: 0, area: 0 },
            { status: 'OPENED', count: 0, area: 0 },
            { status: 'EXHAUSTED', count: 0, area: 0 },
            { status: 'ARCHIVED', count: 0, area: 0 },
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
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>{t('dashboard.title')}</h1>
        <Button icon="pi pi-refresh" label={t('common.refresh')} onClick={loadDashboardData} />
      </div>

      {error && <Message severity="error" text={error} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        <Card title={t('dashboard.overview')}>
          {inventoryMetrics && (
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                <Card title={t('dashboard.totalRolls')}>
                  <div style={{ fontSize: '1.5rem' }}>{inventoryMetrics.totalRolls}</div>
                </Card>
                <Card title={t('dashboard.totalArea')}>
                  <div style={{ fontSize: '1.5rem' }}>{inventoryMetrics.totalArea.toFixed(2)}</div>
                </Card>
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
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                <Card title={t('navigation.waste')}>
                  <div style={{ fontSize: '1.5rem' }}>{wasteMetrics.totalWaste}</div>
                </Card>
                <Card title={t('waste.reuseEfficiency')}>
                  <div style={{ fontSize: '1.5rem' }}>{wasteMetrics.reuseEfficiency.toFixed(1)}%</div>
                </Card>
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