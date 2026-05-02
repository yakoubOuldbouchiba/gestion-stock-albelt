import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import type { CommandeItem, OptimizationComparison } from '../../types';
import { useI18n } from '@hooks/useI18n';
import { downloadSvgLayout, printOptimizationSimple } from '../../utils/svgPrinter';
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
  normalizeOptimizationSvg: _normalizeOptimizationSvg,
  buildOptimizationSvgSlices: _buildOptimizationSvgSlices,
}: OptimizationSectionProps) {
  const { t } = useI18n();

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
    const svgContent = variant === 'actual' 
      ? optimizationComparison?.actualSvg 
      : optimizationComparison?.suggested?.svg;

    const handlePrintSvgOnly = () => {
      if (!svgContent) {
        alert(t('messages.noDataAvailable'));
        return;
      }
      // Use backend simple print endpoint for cleaner, minimal whitespace output
      printOptimizationSimple(item.id, variant, 'en');
    };

    const handleDownloadSvg = () => {
      if (!svgContent) {
        alert(t('messages.noDataAvailable'));
        return;
      }
      downloadSvgLayout(
        `roll-layout-${variant}-${Date.now()}.svg`,
        svgContent
      );
    };

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
                tooltip="Print SVG Layout (focused)"
                tooltipOptions={{ position: 'left' }}
                onClick={handlePrintSvgOnly}
                disabled={!svgContent}
              />
              <Button
                icon="pi pi-download"
                text
                size="small"
                tooltip="Download SVG File"
                tooltipOptions={{ position: 'left' }}
                onClick={handleDownloadSvg}
                disabled={!svgContent}
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
