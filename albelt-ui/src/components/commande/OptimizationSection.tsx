import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import type { CommandeItem, OptimizationComparison } from '../../types';
import { useI18n } from '@hooks/useI18n';
import './OptimizationSection.css';
import { IndustrialRollVisualizer } from '../detail/IndustrialRollVisualizer';

interface OptimizationSectionProps {
  item: CommandeItem;
  optimizationComparison: OptimizationComparison | null;
  optimizationLoading: boolean;
  optimizationError: string | null;
  optimizationMode: 'load' | 'regenerate';
  isBusy: boolean;
  isCommandeLocked: boolean;
  onRegenerate: (itemId: string) => void;
  onAdoptPlan: (itemId: string, suggestionId: string) => void;
  onEnlarge: (title: string, svg: string) => void;
  onPrint: (variant: 'actual' | 'suggested') => void;
  onPrintTiled: (svg: string, variant: 'actual' | 'suggested') => void;
  formatMetricValue: (value?: number, digits?: number) => string;
  normalizeOptimizationSvg: (rawSvg: string) => string;
  buildOptimizationSvgSlices: (rawSvg: string) => { html: string; label: string }[] | null;
}

export function OptimizationSection({
  item,
  optimizationComparison,
  optimizationLoading,
  optimizationError,
  optimizationMode,
  isBusy,
  isCommandeLocked,
  onRegenerate,
  onAdoptPlan,
  onEnlarge: _onEnlarge,
  onPrint,
  onPrintTiled,
  //formatMetricValue,
  normalizeOptimizationSvg: _normalizeOptimizationSvg,
  buildOptimizationSvgSlices: _buildOptimizationSvgSlices,
}: OptimizationSectionProps) {
  const { t } = useI18n();

  // const actual = optimizationComparison?.actualMetrics;
  // const suggested = optimizationComparison?.suggested?.metrics;
  // const actualConforme = item.totalItemsConforme ?? 0;
  // const actualNonConforme = item.totalItemsNonConforme ?? 0;
  // const actualSourceMix = (optimizationComparison?.actualSources ?? []).reduce(
  //   (acc, source) => {
  //     if (source.sourceType === 'ROLL') acc.rolls += 1;
  //     if (source.sourceType === 'WASTE_PIECE') acc.chutes += 1;
  //     return acc;
  //   },
  //   { rolls: 0, chutes: 0 }
  // );
  // const suggestedSourceMix = (optimizationComparison?.suggested?.sources ?? []).reduce(
  //   (acc, source) => {
  //     if (source.sourceType === 'ROLL') acc.rolls += 1;
  //     if (source.sourceType === 'WASTE_PIECE') acc.chutes += 1;
  //     return acc;
  //   },
  //   { rolls: 0, chutes: 0 }
  // );
  // const rollsDelta =
  //   actual?.sourceCount != null && suggested?.sourceCount != null
  //     ? suggested.sourceCount - actual.sourceCount
  //     : null;

  const renderPlacementVisualizers = (
    variant: 'actual' | 'suggested'
  ) => {
    const sources = variant === 'actual' ? optimizationComparison?.actualSources : optimizationComparison?.suggested?.sources;
    const allPlacements = variant === 'actual' ? optimizationComparison?.actualPlacements : optimizationComparison?.suggested?.placements;

    if (!sources || sources.length === 0) {
      return <Message severity="info" text={t('messages.noDataAvailable')} />;
    }

    return (
      <div className="optimization-visualizers-list">
        {sources.map((source, idx) => {
          const sourcePlacements = (allPlacements ?? []).filter(p => p.sourceId === source.sourceId);
          // Convert lengthM to mm if needed
          const lengthMm = source.lengthM ? source.lengthM * 1000 : 0;

          // Always use the raw SVG for the current variant
          const rawSvg = variant === 'actual'
            ? optimizationComparison?.actualSvg
            : optimizationComparison?.suggested?.svg;

          return (
            <div key={`${variant}-source-vis-${idx}`} className="source-visualizer-block">
              <div className="source-vis-header">
                <span className="vis-source-label">{t(`inventory.${source.sourceType.toLowerCase()}`)} #{idx + 1}</span>
                <span className="vis-source-ref">
                  {source.lotId ? `Lot #${source.lotId}` : source.reference || 'N/A'}
                </span>
              </div>
              <div style={{ height: '500px' }}>
                <IndustrialRollVisualizer
                  widthMm={source.widthMm ?? 0}
                  lengthMm={lengthMm}
                  placements={sourcePlacements}
                  baseColor={source.colorHexCode || (source.sourceType === 'ROLL' ? '#e2e8f0' : '#fef3c7')}
                  onEnlarge={_onEnlarge}
                  svgString={rawSvg || ''}
                  title={
                    `${t(`inventory.${source.sourceType.toLowerCase()}`)} #${idx + 1} - ${source.lotId ? `Lot #${source.lotId}` : source.reference || 'N/A'}`
                  }
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderSvgPanel = (
    title: string,
    variant: 'actual' | 'suggested'
  ) => {
    return (
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{title}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Button
                icon="pi pi-print"
                text
                size="small"
                tooltip={t('common.print') || 'Print'}
                tooltipOptions={{ position: 'left' }}
                onClick={() => onPrint(variant)}
              />
              <Button
                icon="pi pi-th-large"
                text
                size="small"
                tooltip={t('commandes.tiledPrint') || 'Tiled Print'}
                tooltipOptions={{ position: 'left' }}
                onClick={() => {
                  let svgString = '';
                  if (variant === 'suggested') {
                    console.log('DEBUG suggested:', optimizationComparison?.suggested);
                  }
                  const rawSvg = variant === 'actual'
                    ? optimizationComparison?.actualSvg
                    : optimizationComparison?.suggested?.svg;
                  if (_buildOptimizationSvgSlices && rawSvg) {
                    const slices = _buildOptimizationSvgSlices(rawSvg);
                    if (slices && slices.length > 0) {
                      svgString = slices.map(s => s.html).join('\n');
                    } else {
                      svgString = rawSvg; // fallback to raw SVG if no slices
                    }
                  } else if (rawSvg) {
                    svgString = rawSvg;
                  }
                  onPrintTiled(svgString, variant);
                }}
              />
              {/* Enlarge button for SVG panel */}
              <Button
                icon="pi pi-search-plus"
                text
                size="small"
                tooltip={t('common.enlarge') || 'Enlarge'}
                tooltipOptions={{ position: 'left' }}
                onClick={() => {
                  const rawSvg = variant === 'actual'
                    ? optimizationComparison?.actualSvg
                    : optimizationComparison?.suggested?.svg;
                  console.log('ENLARGE BUTTON DEBUG', { variant, title, rawSvg, rawSvgLength: rawSvg?.length, rawSvgStart: rawSvg?.slice(0, 200) });
                  _onEnlarge(
                    title,
                    rawSvg || ''
                  );
                }}
              />
            </div>
          </div>
        }
        className="albel-svg-card"
        style={{ minHeight: '400px' }}
      >
        {renderPlacementVisualizers(variant)}
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
        <div>
          <div style={{ fontWeight: 600 }}>{t('commandes.suggestedCutPlan')}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-color-secondary)' }}>
            {t('commandes.suggestionReuseHint')}
          </div>
        </div>
        <Button
          label={t('commandes.recalculateSuggestion')}
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
          <div style={{ display: 'grid', justifyItems: 'center', gap: '0.5rem' }}>
            <ProgressSpinner />
            <small style={{ color: 'var(--text-color-secondary)' }}>
              {optimizationMode === 'regenerate'
                ? t('commandes.recalculatingSuggestion')
                : t('commandes.loadingSuggestion')}
            </small>
          </div>
        </div>
      )}

      {!optimizationLoading && !optimizationComparison && (
        <Message severity="info" text={t('commandes.noOptimizationSuggestion')} />
      )}

      {!optimizationLoading && optimizationComparison && (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <Message severity="info" text={t('commandes.sourcePriorityHint')} />

          {/* <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: '0.75rem',
            }}
          >
            <Card>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-color-secondary)' }}>{t('commandes.wasteSavedM2')}</div>
              <div style={{ marginTop: '0.25rem', fontSize: '1.35rem', fontWeight: 700 }}>
                {formatMetricValue(optimizationComparison.wasteSavedM2)}
              </div>
            </Card>
            <Card>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-color-secondary)' }}>{t('commandes.utilizationGainPct')}</div>
              <div style={{ marginTop: '0.25rem', fontSize: '1.35rem', fontWeight: 700 }}>
                {formatMetricValue(optimizationComparison.utilizationGainPct)}
              </div>
            </Card>
            <Card>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-color-secondary)' }}>{t('commandes.rollsUsedDelta')}</div>
              <div style={{ marginTop: '0.25rem', fontSize: '1.35rem', fontWeight: 700 }}>
                {rollsDelta == null ? '-' : `${rollsDelta > 0 ? '+' : ''}${rollsDelta}`}
              </div>
            </Card>
          </div> */}

          {/* <Card>
            <div className="albel-compare-grid">
              <div>
                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{t('commandes.metric')}</div>
                <div>{t('commandes.usedAreaM2')}</div>
                <div>{t('commandes.wasteAreaM2')}</div>
                <div>{t('commandes.utilizationPct')}</div>
                <div>{t('commandes.sources')}</div>
                <div>{t('commandes.pieces')}</div>
                <div>{t('commandes.sourceMix')}</div>
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
                <div>{`${actualSourceMix.chutes} ${t('commandes.chutesLabel')} / ${actualSourceMix.rolls} ${t('commandes.rollsLabel')}`}</div>
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
                <div>{`${suggestedSourceMix.chutes} ${t('commandes.chutesLabel')} / ${suggestedSourceMix.rolls} ${t('commandes.rollsLabel')}`}</div>
                <div>-</div>
                <div>-</div>
              </div>
            </div>
          </Card> */}

          <div className="albel-grid albel-grid--min280" style={{ gap: '0.75rem' }}>
            {renderSvgPanel(
              t('commandes.actualLayout'),
              'actual'
            )}
            {renderSvgPanel(
              t('commandes.suggestedLayout'),
              'suggested'
            )}
          </div>


          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
            <Button
              label={t('commandes.adoptSuggestedPlan') || 'Adopt Suggested Plan'}
              icon="pi pi-check-circle"
              severity="success"
              className="adopt-plan-btn"
              disabled={isBusy || isCommandeLocked || !optimizationComparison.suggested?.placements?.length}
              onClick={() => {
                const suggestionId = optimizationComparison.suggested?.suggestionId;
                if (suggestionId) onAdoptPlan(item.id, suggestionId);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
