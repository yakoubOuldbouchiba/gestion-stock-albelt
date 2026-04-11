import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Tag } from 'primereact/tag';
import { formatDate } from '../../utils/date';
import { getRollChuteSummary } from '@utils/rollChuteLabel';
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
      <div className="albel-compact-list">
        {wasteForItem.map((waste: any) => (
          <div key={waste.id} className="albel-compact-item">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                flexWrap: 'wrap',
              }}
            >
              <Tag value={waste.wasteType} severity={waste.wasteType === 'DECHET' ? 'warning' : 'success'} />
              {(() => {
                const summary = getRollChuteSummary(waste);
                return (
                  <span>
                    Ref: {summary.reference} | Plis: {summary.nbPlis} | Thk: {summary.thickness} | Color: {summary.color}
                  </span>
                );
              })()}
              {waste.weightKg ? <span>{waste.weightKg}kg</span> : null}
              <span>{formatDate(waste.createdAt)}</span>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);
