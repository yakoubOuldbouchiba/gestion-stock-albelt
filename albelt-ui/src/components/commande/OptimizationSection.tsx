import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import type { CommandeItem, OptimizationComparison } from '../../types';
import { useI18n } from '@hooks/useI18n';

interface OptimizationSectionProps {
  item: CommandeItem;
  optimizationComparison: OptimizationComparison | null;
  optimizationLoading: boolean;
  optimizationError: string | null;
  isBusy: boolean;
  isCommandeLocked: boolean;
  onRegenerate: (itemId: string) => void;
  onEnlarge: (title: string, svg: string) => void;
  onPrint: (variant: 'actual' | 'suggested') => void;
  formatMetricValue: (value?: number, digits?: number) => string;
  normalizeOptimizationSvg: (rawSvg: string) => string;
  buildOptimizationSvgSlices: (rawSvg: string) => string[] | null;
}

export function OptimizationSection({
  item,
  optimizationComparison,
  optimizationLoading,
  optimizationError,
  isBusy,
  isCommandeLocked,
  onRegenerate,
  onEnlarge,
  onPrint,
  formatMetricValue,
  normalizeOptimizationSvg,
  buildOptimizationSvgSlices,
}: OptimizationSectionProps) {
  const { t } = useI18n();

  const actual = optimizationComparison?.actualMetrics;
  const suggested = optimizationComparison?.suggested?.metrics;
  const actualConforme = item.totalItemsConforme ?? 0;
  const actualNonConforme = item.totalItemsNonConforme ?? 0;

  const renderSvgPanel = (
    title: string,
    variant: 'actual' | 'suggested',
    svg?: string | null,
    emptyMessage?: string
  ) => {
    const svgSlices = svg ? buildOptimizationSvgSlices(svg) : null;
    const isSliced = Array.isArray(svgSlices) && svgSlices.length > 1;
    return (
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{title}</span>
            {svg && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Button
                  icon="pi pi-search-plus"
                  text
                  size="small"
                  tooltip={t('common.enlarge') || 'Enlarge'}
                  tooltipOptions={{ position: 'left' }}
                  onClick={() => onEnlarge(title, svg)}
                />
                <Button
                  icon="pi pi-print"
                  text
                  size="small"
                  tooltip={t('common.print') || 'Print'}
                  tooltipOptions={{ position: 'left' }}
                  onClick={() => onPrint(variant)}
                />
              </div>
            )}
          </div>
        }
        className="albel-svg-card"
        style={{ minHeight: '280px' }}
      >
        {svg ? (
          <div
            className={`albel-svg-viewer${isSliced ? ' albel-svg-viewer--sliced' : ''}`}
            style={{
              border: '1px solid var(--surface-border)',
              borderRadius: '8px',
              backgroundColor: 'var(--surface-card)',
              padding: '0.5rem',
            }}
          >
            {isSliced ? (
              <div className="albel-svg-slices">
                {svgSlices!.map((slice, idx) => (
                  <div
                    key={`${variant}-slice-${idx}`}
                    className="albel-svg-slice"
                    dangerouslySetInnerHTML={{ __html: slice }}
                  />
                ))}
              </div>
            ) : (
              <div dangerouslySetInnerHTML={{ __html: normalizeOptimizationSvg(svg) }} />
            )}
          </div>
        ) : (
          <Message severity="info" text={emptyMessage ?? t('messages.noDataAvailable')} />
        )}
      </Card>
    );
  };

  return (
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
        <div style={{ fontWeight: 600 }}>{t('commandes.optimizationComparison')}</div>
        <Button
          label={t('commandes.regenerateSuggestion')}
          icon="pi pi-refresh"
          severity="secondary"
          onClick={() => onRegenerate(item.id)}
          disabled={isBusy || isCommandeLocked || optimizationLoading}
          loading={optimizationLoading}
        />
      </div>

      {optimizationError && (
        <Message severity="error" text={optimizationError} style={{ marginBottom: '0.5rem' }} />
      )}

      {optimizationLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
          <ProgressSpinner />
        </div>
      )}

      {!optimizationLoading && !optimizationComparison && (
        <Message severity="info" text={t('commandes.noOptimizationSuggestion')} />
      )}

      {!optimizationLoading && optimizationComparison && (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <Card>
            <div className="albel-compare-grid">
              <div>
                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{t('commandes.metric')}</div>
                <div>{t('commandes.usedAreaM2')}</div>
                <div>{t('commandes.wasteAreaM2')}</div>
                <div>{t('commandes.utilizationPct')}</div>
                <div>{t('commandes.sources')}</div>
                <div>{t('commandes.pieces')}</div>
                <div>{t('commandes.conformePieces')}</div>
                <div>{t('commandes.nonConformePieces')}</div>
              </div>
              <div>
                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{t('commandes.actual')}</div>
                <div>{formatMetricValue(actual?.usedAreaM2)}</div>
                <div>{formatMetricValue(actual?.wasteAreaM2)}</div>
                <div>{formatMetricValue(actual?.utilizationPct)}</div>
                <div>{actual?.sourceCount ?? '-'}</div>
                <div>
                  {actual?.placedPieces ?? '-'}/{actual?.totalPieces ?? '-'}
                </div>
                <div>{actualConforme}</div>
                <div>{actualNonConforme}</div>
              </div>
              <div>
                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{t('commandes.suggested')}</div>
                <div>{formatMetricValue(suggested?.usedAreaM2)}</div>
                <div>{formatMetricValue(suggested?.wasteAreaM2)}</div>
                <div>{formatMetricValue(suggested?.utilizationPct)}</div>
                <div>{suggested?.sourceCount ?? '-'}</div>
                <div>
                  {suggested?.placedPieces ?? '-'}/{suggested?.totalPieces ?? '-'}
                </div>
                <div>-</div>
                <div>-</div>
              </div>
            </div>

            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div>
                {t('commandes.wasteSavedM2')}: {formatMetricValue(optimizationComparison.wasteSavedM2)}
              </div>
              <div>
                {t('commandes.utilizationGainPct')}:{' '}
                {formatMetricValue(optimizationComparison.utilizationGainPct)}
              </div>
            </div>
          </Card>

          <div className="albel-grid albel-grid--min280" style={{ gap: '0.75rem' }}>
            {renderSvgPanel(
              t('commandes.actualLayout'),
              'actual',
              optimizationComparison.actualSvg,
              t('commandes.noActualSvg')
            )}
            {renderSvgPanel(
              t('commandes.suggestedLayout'),
              'suggested',
              optimizationComparison.suggested?.svg,
              t('commandes.noSuggestedSvg')
            )}
          </div>
        </div>
      )}
    </div>
  );
}
