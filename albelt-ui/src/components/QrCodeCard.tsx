import { Card } from 'primereact/card';
import { Button } from 'primereact/button';

type QrCodeCardProps = {
  label: string;
  qrCode?: string | null;
  fallbackText?: string;
  onRegenerate?: () => void | Promise<void>;
  regenerating?: boolean;
  regenerateLabel?: string;
};

const isImageDataUrl = (value?: string | null) =>
  Boolean(value && value.startsWith('data:image/'));

export function QrCodeCard({
  label,
  qrCode,
  fallbackText = 'N/A',
  onRegenerate,
  regenerating = false,
  regenerateLabel = 'Regenerate QR',
}: QrCodeCardProps) {
  return (
    <Card title={label}>
      {isImageDataUrl(qrCode) ? (
        <div style={{ display: 'grid', gap: '0.75rem', justifyItems: 'start' }}>
          <img
            src={qrCode!}
            alt={label}
            style={{
              width: '220px',
              maxWidth: '100%',
              aspectRatio: '1 / 1',
              objectFit: 'contain',
              border: '1px solid var(--surface-border)',
              borderRadius: '12px',
              padding: '0.75rem',
              background: '#ffffff',
            }}
          />
          <a href={qrCode!} download="qr-code.png" style={{ textDecoration: 'none' }}>
            Download QR code
          </a>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <div>
            <strong>{label}:</strong> {qrCode || fallbackText}
          </div>
          {onRegenerate ? (
            <Button
              label={regenerateLabel}
              icon="pi pi-refresh"
              onClick={() => void onRegenerate()}
              loading={regenerating}
              style={{ width: 'fit-content' }}
            />
          ) : null}
        </div>
      )}
    </Card>
  );
}

export default QrCodeCard;
