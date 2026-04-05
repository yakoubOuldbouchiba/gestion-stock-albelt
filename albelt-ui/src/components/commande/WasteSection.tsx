import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Message } from 'primereact/message';
import { Tag } from 'primereact/tag';
import { formatDate } from '../../utils/date';
import type { Translate } from './commandeTypes';

type WasteSectionProps = {
  wasteForItem: any[];
  onCreateChute: () => void;
  isBusy: boolean;
  t: Translate;
};

export const WasteSection = ({ wasteForItem, onCreateChute, isBusy, t }: WasteSectionProps) => (
  <div style={{ marginTop: '0.75rem' }}>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        flexWrap: 'wrap',
        marginBottom: '0.5rem',
      }}
    >
      <span style={{ fontWeight: 600 }}>{t('commandes.wasteCreated')}</span>
      <Button
        label={t('inventory.createChute')}
        icon="pi pi-plus-circle"
        severity="secondary"
        onClick={onCreateChute}
        disabled={isBusy}
      />
    </div>
    {wasteForItem.length === 0 ? (
      <Message severity="info" text={t('commandes.noWasteRecorded')} />
    ) : (
      <div style={{ display: 'grid', gap: '0.5rem' }}>
        {wasteForItem.map((waste: any) => (
          <Card key={waste.id} style={{ padding: '0.5rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                flexWrap: 'wrap',
              }}
            >
              <Tag value={waste.wasteType} severity={waste.wasteType === 'DECHET' ? 'warning' : 'success'} />
              <span>
                {waste.lengthM}m x {waste.widthMm}mm ({waste.areaM2?.toFixed(2)}m2)
              </span>
              {waste.weightKg ? <span>{waste.weightKg}kg</span> : null}
              <span>{formatDate(waste.createdAt)}</span>
            </div>
          </Card>
        ))}
      </div>
    )}
  </div>
);
