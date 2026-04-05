import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';
import type { Translate } from './commandeTypes';

type StatusUpdateCardProps = {
  selectedStatus: string;
  statusOptions: { label: string; value: string }[];
  updating: boolean;
  currentStatus: string;
  onStatusChange: (nextStatus: string) => void;
  onUpdate: () => void;
  t: Translate;
};

export const StatusUpdateCard = ({
  selectedStatus,
  statusOptions,
  updating,
  currentStatus,
  onStatusChange,
  onUpdate,
  t,
}: StatusUpdateCardProps) => (
  <Card title={t('commandes.updateOrderStatus')} style={{ marginBottom: '1rem' }}>
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
      <Dropdown
        value={selectedStatus}
        options={statusOptions}
        onChange={(e) => onStatusChange(e.value)}
        placeholder={t('commandes.updateStatus')}
        style={{ minWidth: '220px' }}
      />
      <Button
        label={updating ? t('commandes.updating') : t('commandes.updateStatus')}
        onClick={onUpdate}
        disabled={updating || selectedStatus === currentStatus}
        loading={updating}
      />
    </div>
  </Card>
);
