import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Toast } from 'primereact/toast';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { Card } from 'primereact/card';
import { TabView, TabPanel } from 'primereact/tabview';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';

import { CommandeService } from '../services/commandeService';
import { PlacedRectangleService } from '../services/placedRectangleService';

import { useI18n } from '@hooks/useI18n';
import { formatRollChuteLabel } from '@utils/rollChuteLabel';

import { OrderHeaderCard } from '../components/commande/OrderHeaderCard';
import { OrderInfoCard } from '../components/commande/OrderInfoCard';
import { StatusUpdateCard } from '../components/commande/StatusUpdateCard';
import { ProductionSection } from '../components/commande/ProductionSection';
import { WasteSection } from '../components/commande/WasteSection';
import { ChuteDialog } from '../components/commande/ChuteDialog';
import { PlacementDialog } from '../components/commande/PlacementDialog';
import { PlacementPreviewDialog } from '../components/commande/PlacementPreviewDialog';
import { ProductionDialog } from '../components/commande/ProductionDialog';
import { ItemSidebar } from '../components/commande/ItemSidebar';
import { ItemDetailHeader } from '../components/commande/ItemDetailHeader';
import { OptimizationSection } from '../components/commande/OptimizationSection';
import { PlacementsSection } from '../components/commande/PlacementsSection';

import { useCommandeDetail } from './hooks/useCommandeDetail';
import { useItemManager } from './hooks/useItemManager';
import { usePlacementActions } from './hooks/usePlacementActions';
import { useProductionActions } from './hooks/useProductionActions';
import { useWasteActions } from './hooks/useWasteActions';
import { getArticleId } from '../utils/article';

import type {
  CommandeItem,
  PlacedRectangle,
  Roll,
} from '../types';
import type { StatusSeverity } from '../components/commande/commandeTypes';
import './CommandeDetailPage.css';

export function CommandeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useI18n();
  const toastRef = useRef<Toast>(null);

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [activeItemDetailTabIndex, setActiveItemDetailTabIndex] = useState(0);
  const [svgZoomPreview, setSvgZoomPreview] = useState<{ title: string; svg: string } | null>(null);

  const [showPlacementModal, setShowPlacementModal] = useState(false);
  const [placementTargetItem, setPlacementTargetItem] = useState<CommandeItem | null>(null);
  const [showPlacementPreview, setShowPlacementPreview] = useState(false);
  const [previewPlacement, setPreviewPlacement] = useState<PlacedRectangle | null>(null);

  const [showProductionModal, setShowProductionModal] = useState(false);
  const [productionTargetItem, setProductionTargetItem] = useState<CommandeItem | null>(null);

  const [showChuteForm, setShowChuteForm] = useState(false);
  const [chuteTargetItem, setChuteTargetItem] = useState<CommandeItem | null>(null);
  const [parentWastePieces, setParentWastePieces] = useState<any[]>([]);
  const [parentWastePiecesLoading, setParentWastePiecesLoading] = useState(false);
  const [chutePlacements, setChutePlacements] = useState<PlacedRectangle[]>([]);
  const [chutePlacementsLoading, setChutePlacementsLoading] = useState(false);

  const {
    commande,
    loading,
    error,
    updating,
    deletingOrder,
    altierScores,
    altierScoresLoading,
    altierSaving,
    selectedAltierId,
    setSelectedAltierId,
    selectedStatus,
    handleAltierSave,
    handleStatusUpdate,
    handleDeleteItem,
    handleItemStatusUpdate,
    handleDeleteOrder,
    setCommande,
  } = useCommandeDetail(id);

  const isCommandeLocked = useMemo(() => {
    const normalized = (commande?.status ?? '').trim().toUpperCase();
    return normalized === 'COMPLETED' || normalized === 'CANCELLED';
  }, [commande?.status]);

  const showToast = useCallback((severity: 'success' | 'error' | 'warn', summary: string, detail: string) => {
    toastRef.current?.show({ severity, summary, detail, life: 3000 });
  }, []);

  const showSuccess = useCallback((detail: string) => showToast('success', t('common.success'), detail), [showToast, t]);
  const showError = useCallback((detail: string) => showToast('error', t('common.error'), detail), [showToast, t]);
  const showWarning = useCallback((detail: string) => showToast('warn', t('common.warning'), detail), [showToast, t]);

  const {
    wasteForItem,
    availableWasteByArticle,
    productionForItem,
    placementsForItem,
    optimizationComparison,
    optimizationLoading,
    optimizationError,
    optimizationMode,
    rollsByArticle,
    loadWasteForItem,
    loadProductionForItem,
    loadPlacementsForItem,
    loadOptimizationForItem,
    ensureWasteForArticle,
    ensureRollsForArticle,
  } = useItemManager(selectedItemId);

  const {
    creatingPlacement,
    editingPlacementId,
    placementForm,
    setPlacementForm,
    resetPlacementForm,
    handleCreatePlacement,
    handleDeletePlacement,
    setEditingPlacementId,
  } = usePlacementActions(
    id,
    setCommande,
    loadPlacementsForItem,
    loadProductionForItem,
    loadOptimizationForItem,
    showSuccess,
    showError,
    showWarning,
    isCommandeLocked
  );

  const {
    creatingProduction,
    productionForm,
    setProductionForm,
    handleCreateProductionItem,
    handleDeleteProductionItem,
  } = useProductionActions(
    id,
    setCommande,
    loadProductionForItem,
    loadOptimizationForItem,
    showSuccess,
    showError,
    showWarning,
    isCommandeLocked
  );

  const {
    creatingChute,
    chuteSourceType,
    setChuteSourceType,
    chuteRollId,
    setChuteRollId,
    parentWastePieceId,
    setParentWastePieceId,
    chutePlacementId,
    setChutePlacementId,
    chuteDimensions,
    setChuteDimensions,
    resetChuteForm,
    handleCreateChute,
  } = useWasteActions(
    loadWasteForItem,
    showSuccess,
    showError,
    showWarning,
    isCommandeLocked
  );

  useEffect(() => {
    const items = commande?.items ?? [];
    if (items.length === 0) {
      setSelectedItemId(null);
      return;
    }
    if (!selectedItemId || !items.some((item) => item.id === selectedItemId)) {
      setSelectedItemId(items[0].id);
    }
  }, [commande?.items, selectedItemId]);

  useEffect(() => {
    const articleId = getArticleId(chuteTargetItem);
    if (showChuteForm && articleId && chuteSourceType === 'WASTE_PIECE') {
      const fetchWaste = async () => {
        setParentWastePiecesLoading(true);
        try {
          await ensureWasteForArticle(articleId);
          setParentWastePieces(availableWasteByArticle[articleId] || []);
        } catch (err) {
          console.error('Error fetching parent waste pieces:', err);
        } finally {
          setParentWastePiecesLoading(false);
        }
      };
      fetchWaste();
    }
  }, [showChuteForm, chuteTargetItem, chuteSourceType, ensureWasteForArticle, availableWasteByArticle]);

  useEffect(() => {
    const sourceId = chuteSourceType === 'ROLL' ? chuteRollId : parentWastePieceId;
    if (showChuteForm && sourceId) {
      const fetchPlacements = async () => {
        setChutePlacementsLoading(true);
        try {
          const res = chuteSourceType === 'ROLL'
            ? await PlacedRectangleService.getByRoll(sourceId)
            : await PlacedRectangleService.getByWastePiece(sourceId);
          setChutePlacements(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
          console.error('Error fetching placements:', err);
        } finally {
          setChutePlacementsLoading(false);
        }
      };
      fetchPlacements();
    }
  }, [showChuteForm, chuteSourceType, chuteRollId, parentWastePieceId]);

  const isBusy = updating || creatingProduction || creatingChute || creatingPlacement || deletingOrder;

  const getStatusSeverity = (status: string): StatusSeverity => {
    const severities: Record<string, StatusSeverity> = {
      PENDING: 'warning',
      ENCOURS: 'info',
      COMPLETED: 'success',
      CANCELLED: 'danger',
      ON_HOLD: 'secondary',
      IN_PROGRESS: 'info',
    };
    return severities[status] || 'secondary';
  };

  const getContrastTextColor = (hexColor?: string) => {
    if (!hexColor) return 'inherit';
    const normalized = hexColor.replace('#', '').trim();
    if (normalized.length !== 3 && normalized.length !== 6) return 'inherit';
    const fullHex = normalized.length === 3 ? normalized.split('').map(c => c + c).join('') : normalized;
    const r = parseInt(fullHex.slice(0, 2), 16) / 255;
    const g = parseInt(fullHex.slice(2, 4), 16) / 255;
    const b = parseInt(fullHex.slice(4, 6), 16) / 255;
    const luminance = (0.299 * r) + (0.587 * g) + (0.114 * b);
    return luminance > 0.6 ? '#000000' : '#ffffff';
  };

  const getItemDisplayLabel = (item: CommandeItem) => {
    const parts = [item.lineNumber ? `Line ${item.lineNumber}` : null, item.reference].filter(Boolean);
    return parts.length > 0 ? parts.join(' • ') : item.materialType;
  };

  const getItemProgress = (item: CommandeItem) => {
    const conforme = item.totalItemsConforme ?? 0;
    const nonConforme = item.totalItemsNonConforme ?? 0;
    const produced = conforme + nonConforme;
    return {
      conforme,
      nonConforme,
      produced,
      remaining: Math.max(0, item.quantite - produced),
      over: Math.max(0, produced - item.quantite),
    };
  };

  const summarizeOptimizationSources = (sources?: any[]) => {
    return (sources ?? []).reduce((acc, s) => {
      if (s.sourceType === 'ROLL') acc.rolls++;
      else if (s.sourceType === 'WASTE_PIECE') acc.chutes++;
      return acc;
    }, { rolls: 0, chutes: 0 });
  };

  const filteredItems = useMemo(() => {
    const query = itemSearchQuery.trim().toLowerCase();
    const items = commande?.items ?? [];
    if (!query) return items;
    return items.filter(item => [item.lineNumber ? `line ${item.lineNumber}` : '', item.reference, item.materialType, item.colorName, item.typeMouvement].join(' ').toLowerCase().includes(query));
  }, [commande?.items, itemSearchQuery]);

  const selectedItem = useMemo(() => commande?.items.find(i => i.id === selectedItemId) ?? null, [commande?.items, selectedItemId]);
  const orderTotals = useMemo(() => {
    return (commande?.items ?? []).reduce((acc, item) => {
      const prog = getItemProgress(item);
      acc.lines++;
      acc.ordered += item.quantite;
      acc.produced += prog.produced;
      acc.remaining += prog.remaining;
      return acc;
    }, { lines: 0, ordered: 0, produced: 0, remaining: 0 });
  }, [commande?.items]);

  const selectedItemProgress = selectedItem ? getItemProgress(selectedItem) : null;
  const selectedActualSources = summarizeOptimizationSources(optimizationComparison?.actualSources);
  const selectedSuggestedSources = summarizeOptimizationSources(optimizationComparison?.suggested?.sources);

  const formatSourceLabel = (source: any, fallbackRef?: string) => {
    if (!source) return fallbackRef ?? t('commandes.notAvailable');
    return formatRollChuteLabel({
      reference: source.reference ?? fallbackRef,
      nbPlis: source.nbPlis,
      thicknessMm: source.thicknessMm,
      colorName: source.colorName,
      colorHexCode: source.colorHexCode,
    });
  };

  const getProductionWarnings = (item: CommandeItem, placement: PlacedRectangle | undefined, pieceLength: number, pieceWidth: number) => {
    const warnings: string[] = [];
    const source = placement?.roll ?? placement?.wastePiece ?? null;
    if (placement?.widthMm && pieceWidth > placement.widthMm) warnings.push(t('inventory.placementDimensionsExceeded'));
    if (placement?.heightMm && pieceLength * 1000 > placement.heightMm) warnings.push(t('inventory.placementDimensionsExceeded'));
    if (source?.materialType && source.materialType !== item.materialType) warnings.push(t('commandes.productionMismatchMaterial', { expected: item.materialType, actual: source.materialType }));
    if (source?.nbPlis != null && source.nbPlis !== item.nbPlis) warnings.push(t('commandes.productionMismatchPlies', { expected: item.nbPlis, actual: source.nbPlis }));
    if (source?.thicknessMm != null && item.thicknessMm != null && source.thicknessMm !== item.thicknessMm) warnings.push(t('commandes.productionMismatchThickness', { expected: item.thicknessMm, actual: source.thicknessMm }));
    if (item.largeurMm != null && pieceWidth !== item.largeurMm) warnings.push(t('commandes.productionMismatchWidth', { expected: item.largeurMm, actual: pieceWidth }));

    const itemLength = item.longueurM;
    const tolerance = item.longueurToleranceM ?? 0;
    if (itemLength != null && (pieceLength < itemLength - tolerance || pieceLength > itemLength + tolerance)) {
      warnings.push(t('commandes.productionMismatchLength', { expected: itemLength, actual: pieceLength, tolerance }));
    }
    return warnings;
  };

  const handleOpenPlacementModal = (item: CommandeItem) => {
    if (isCommandeLocked) return showWarning(t('commandes.editLocked'));
    setPlacementTargetItem(item);
    setEditingPlacementId(null);
    resetPlacementForm();
    ensureWasteForArticle(getArticleId(item));
    ensureRollsForArticle(getArticleId(item));
    setShowPlacementModal(true);
  };

  const handleOpenEditPlacementModal = (item: CommandeItem, placement: PlacedRectangle) => {
    if (isCommandeLocked) return showWarning(t('commandes.editLocked'));
    setPlacementTargetItem(item);
    setEditingPlacementId(placement.id);
    setPlacementForm({
      sourceType: placement.rollId ? 'ROLL' : 'WASTE_PIECE',
      sourceId: placement.rollId ?? placement.wastePieceId ?? '',
      xMm: String(placement.xMm),
      yMm: String(placement.yMm),
      widthMm: String(placement.widthMm),
      heightMm: String(placement.heightMm),
    });
    ensureWasteForArticle(getArticleId(item));
    ensureRollsForArticle(getArticleId(item));
    setShowPlacementModal(true);
  };

  const handleOpenProductionModal = (item: CommandeItem, placementId: string) => {
    if (isCommandeLocked) return showWarning(t('commandes.editLocked'));
    setProductionTargetItem(item);
    setProductionForm({ placedRectangleId: placementId, pieceLengthM: '', pieceWidthMm: '', quantity: '', notes: '' });
    setShowProductionModal(true);
  };

  const handleOpenChuteModal = (item: CommandeItem) => {
    if (isCommandeLocked) return showWarning(t('commandes.editLocked'));
    setChuteTargetItem(item);
    resetChuteForm();
    ensureRollsForArticle(getArticleId(item));
    setShowChuteForm(true);
  };

  const printServerGeneratedLayout = async (variant: 'actual' | 'suggested') => {
    if (!selectedItemId) return;
    try {
      const blob = await CommandeService.printOptimization(selectedItemId, variant, i18n.language || 'fr');
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank') || (window.location.href = url);
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      showError(t('messages.operationFailed'));
    }
  };

  const buildRollOptions = (rolls: Roll[]) => rolls.map(r => ({
    label: formatRollChuteLabel({ reference: r.reference ?? (r as any).referenceRouleau ?? 'N/A', nbPlis: r.nbPlis, thicknessMm: r.thicknessMm, colorName: r.colorName, colorHexCode: r.colorHexCode }),
    value: r.id,
    colorHexCode: r.colorHexCode,
    colorName: r.colorName,
  }));

  const normalizeOptimizationSvg = (rawSvg: string) => {
    if (!rawSvg) return '';

    let extraStyles = '';
    try {
      const vbMatch = rawSvg.match(/viewBox=["']([^"']+)["']/);
      if (vbMatch) {
        const parts = vbMatch[1].split(/[\s,]+/).map(Number);
        const vbW = parts[2];
        if (vbW > 0) {
          const fontSize = Math.max(12, Math.round(vbW / 80));
          const strokeWidth = Math.max(0.5, fontSize / 12);
          extraStyles = `
            text { 
              font-size: ${fontSize}px !important; 
              font-weight: 700 !important;
              fill: #000 !important;
              paint-order: stroke !important;
              stroke: rgba(255,255,255,0.9) !important;
              stroke-width: ${strokeWidth}px !important;
            }
            rect {
              stroke-width: ${strokeWidth}px !important;
            }
          `;
        }
      }
    } catch (e) {
      console.error('Error parsing SVG for dynamic styles:', e);
    }

    return rawSvg.replace(/<svg([^>]*?)>/, (_, attrs) => {
      const cleaned = attrs.replace(/\s*(width|height|preserveAspectRatio|class)="[^"]*"/g, '');
      return `<svg${cleaned} class="albel-generated-svg" preserveAspectRatio="xMinYMid meet"><style>${extraStyles}</style>`;
    });
  };

  const buildOptimizationSvgSlices = (rawSvg: string, maxAspectRatio = 5) => {
    if (!rawSvg) return null;
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(rawSvg, 'image/svg+xml');
      const svgEl = doc.querySelector('svg');
      if (!svgEl) return null;

      const viewBox = svgEl.getAttribute('viewBox');
      if (!viewBox) return null;

      const [minX, minY, vbW, vbH] = viewBox.split(/[\s,]+/).map(Number);
      if (vbW <= 0 || vbH <= 0 || Number.isNaN(vbW)) return null;

      const ratio = vbW / vbH;
      if (ratio <= maxAspectRatio) return null;

      const count = Math.min(Math.ceil(ratio / maxAspectRatio), 12);
      const sliceW = vbW / count;

      const slices: { html: string; label: string }[] = [];
      const innerSvg = svgEl.innerHTML;

      for (let i = 0; i < count; i++) {
        const startX = minX + i * sliceW;
        const sliceViewBox = `${startX} ${minY} ${sliceW} ${vbH}`;
        const sliceSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${sliceViewBox}">${innerSvg}</svg>`;

        const startM = (startX / 1000).toFixed(1);
        const endM = ((startX + sliceW) / 1000).toFixed(1);

        slices.push({
          html: normalizeOptimizationSvg(sliceSvg),
          label: `${startM}m — ${endM}m`
        });
      }
      return slices;
    } catch (err) {
      console.error('Error slicing SVG:', err);
      return null;
    }
  };

  if (loading) return <div className="commande-detail-page commande-detail-page--loading"><ProgressSpinner /></div>;
  if (!commande) return <div className="commande-detail-page"><Message severity="warn" text={t('commandes.notFound')} /><Button label={t('commandes.backToOrders')} onClick={() => navigate('/commandes')} /></div>;

  return (
    <div className="commande-detail-page">
      <ConfirmDialog />

      <div className="commande-detail-shell">
        <OrderHeaderCard
          commande={commande}
          isBusy={isBusy}
          deletingOrder={deletingOrder}
          getStatusSeverity={getStatusSeverity}
          onEdit={() => navigate(`/commandes/${id}/edit`)}
          onDelete={handleDeleteOrder}
          onReturn={() => navigate(`/commandes/${id}/returns`)}
          onBack={() => navigate('/commandes')}
          t={t}
        />

        <div >
          <div className="commande-detail-overview__side">
            <OrderInfoCard commande={commande} t={t} />
            <div className="commande-detail-summary-grid">
              {[
                { label: 'orderLines', val: orderTotals.lines },
                { label: 'piecesOrdered', val: orderTotals.ordered },
                { label: 'produced', val: orderTotals.produced },
                { label: 'stillToCut', val: orderTotals.remaining }
              ].map(card => (
                <div key={card.label} className="commande-detail-summary-card">
                  <span className="commande-detail-summary-card__label">{t(`commandes.${card.label}`)}</span>
                  <strong>{card.val}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="commande-detail-overview">
          <div className="commande-detail-overview__side">
            <Card title={t('rollDetail.workshop')}>
              <div className="commande-detail-form-stack">
                <select
                  value={selectedAltierId ?? ''}
                  onChange={e => setSelectedAltierId(e.target.value || null)}
                  disabled={altierScoresLoading || altierSaving || isCommandeLocked}
                  className="p-dropdown p-component p-inputwrapper p-inputwrapper-filled commande-detail-input-full"
                >
                  <option value="">{t('inventory.selectWorkshop')}</option>
                  {altierScores.map(s => (
                    <option key={s.altierId} value={s.altierId}>{`${s.altierLibelle} (${Number(s.coveragePct).toFixed(1)}%)`}</option>
                  ))}
                </select>
                <div className="commande-detail-actions-end">
                  <Button label={altierSaving ? t('common.saving') : t('common.save')} icon="pi pi-check" onClick={handleAltierSave} disabled={altierSaving || isCommandeLocked} />
                </div>
              </div>
            </Card>
          </div>

          <StatusUpdateCard
            updating={updating}
            disabled={isCommandeLocked}
            selectedStatus={selectedStatus}
            onStart={() => handleStatusUpdate('ENCOURS')}
            onUndoStart={() => handleStatusUpdate('PENDING')}
            onCancel={() => handleStatusUpdate('CANCELLED')}
            onCompleted={() => handleStatusUpdate('COMPLETED')}
            t={t}
          />
        </div>

        {error && <Message severity="error" text={error} className="mb-4" />}

        <Card className="commande-detail-workspace-card">
          {!commande.items.length ? (
            <Message severity="info" text={t('commandes.noItems')} />
          ) : (
            <div className="commande-detail-workspace">
              <ItemSidebar
                items={commande.items}
                filteredItems={filteredItems}
                selectedItemId={selectedItemId}
                itemSearchQuery={itemSearchQuery}
                setItemSearchQuery={setItemSearchQuery}
                onSelectItem={setSelectedItemId}
                getItemDisplayLabel={getItemDisplayLabel}
                getStatusSeverity={getStatusSeverity}
                getContrastTextColor={getContrastTextColor}
                getItemProgress={getItemProgress}
              />

              <section className="commande-detail-main">
                {selectedItem ? (
                  <>
                    <ItemDetailHeader
                      selectedItem={selectedItem}
                      itemStatusOptions={['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map(s => ({ label: t(`statuses.${s}`), value: s }))}
                      isBusy={isBusy}
                      isCommandeLocked={isCommandeLocked}
                      deletingItemId={null}
                      selectedItemProgress={selectedItemProgress}
                      selectedActualSources={selectedActualSources}
                      selectedSuggestedSources={selectedSuggestedSources}
                      handleItemStatusUpdate={handleItemStatusUpdate}
                      handleDeleteItem={handleDeleteItem}
                      getItemDisplayLabel={getItemDisplayLabel}
                      getContrastTextColor={getContrastTextColor}
                      getStatusSeverity={getStatusSeverity}
                    />

                    <TabView activeIndex={activeItemDetailTabIndex} onTabChange={e => setActiveItemDetailTabIndex(e.index)} className="commande-detail-tabs">
                      <TabPanel header={t('commandes.materialPlan')}>
                        <OptimizationSection
                          item={selectedItem}
                          optimizationComparison={optimizationComparison}
                          optimizationLoading={optimizationLoading}
                          optimizationError={optimizationError}
                          optimizationMode={optimizationMode}
                          isBusy={isBusy}
                          isCommandeLocked={isCommandeLocked}
                          onRegenerate={(itemId) => loadOptimizationForItem(itemId, true)}
                          onAdoptPlan={async (itemId, suggestionId) => {
                            try {
                              await CommandeService.adoptOptimization(itemId, suggestionId);
                              showSuccess(t('commandes.planAdoptedSuccess') || 'Plan adopted successfully');
                              loadPlacementsForItem(itemId);
                              loadOptimizationForItem(itemId);
                            } catch {
                              showError(t('messages.operationFailed'));
                            }
                          }}
                          onEnlarge={(title, svg) => setSvgZoomPreview({ title, svg })}
                          onPrint={printServerGeneratedLayout}
                          onPrintTiled={(svgString, variant) => {
                            if (!svgString) {
                              alert('No SVG to print.');
                              return;
                            }
                            const printWindow = window.open('', '_blank');
                            if (printWindow) {
                              printWindow.document.write(`
                                <html>
                                  <head>
                                    <title>Print SVG (${variant})</title>
                                    <style>
                                      body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; }
                                      svg { width: 100%; height: auto; }
                                    </style>
                                  </head>
                                  <body>
                                    ${svgString}
                                    <script>
                                      window.onload = function() { window.print(); }
                                    <\/script>
                                  </body>
                                </html>
                              `);
                              printWindow.document.close();
                            }
                          }}
                          formatMetricValue={(v, d) => (v != null && !Number.isNaN(v)) ? Number(v).toFixed(d ?? 2) : '-'}
                          normalizeOptimizationSvg={normalizeOptimizationSvg}
                          buildOptimizationSvgSlices={buildOptimizationSvgSlices}
                        />
                      </TabPanel>
                      <TabPanel header={t('commandes.cutAreas')}>
                        <PlacementsSection
                          item={selectedItem}
                          placementsForItem={placementsForItem}
                          productionForItem={productionForItem}
                          isBusy={isBusy}
                          isCommandeLocked={isCommandeLocked}
                          onOpenPlacementModal={handleOpenPlacementModal}
                          onOpenEditPlacementModal={handleOpenEditPlacementModal}
                          onOpenPlacementPreview={p => { setPreviewPlacement(p); setShowPlacementPreview(true); }}
                          onDeletePlacement={handleDeletePlacement}
                          onOpenProductionModal={handleOpenProductionModal}
                          onDeleteProduction={pid => handleDeleteProductionItem(pid, selectedItem.id)}
                          formatSourceLabel={formatSourceLabel}
                        />
                      </TabPanel>
                      <TabPanel header={t('commandes.producedPieces')}>
                        <ProductionSection
                          productionForItem={productionForItem}
                          placementsForItem={placementsForItem}
                          t={t}
                          isBusy={isBusy || isCommandeLocked}
                          onDeleteProduction={pid => handleDeleteProductionItem(pid, selectedItem.id)}
                        />
                      </TabPanel>
                      <TabPanel header={t('commandes.reusableLeftovers')}>
                        <WasteSection
                          wasteForItem={wasteForItem}
                          onCreateChute={() => handleOpenChuteModal(selectedItem)}
                          isBusy={isBusy || isCommandeLocked}
                          t={t}
                        />
                      </TabPanel>
                    </TabView>
                  </>
                ) : (
                  <Message severity="info" text={t('commandes.selectItemToContinue')} />
                )}
              </section>
            </div>
          )}
        </Card>
      </div>

      <ChuteDialog
        showChuteForm={showChuteForm}
        chuteTargetItem={chuteTargetItem}
        onHide={() => setShowChuteForm(false)}
        t={t}
        disabled={isCommandeLocked}
        chuteSourceType={chuteSourceType}
        chuteSourceOptions={[{ label: t('inventory.roll'), value: 'ROLL' }, { label: t('inventory.wastePiece'), value: 'WASTE_PIECE' }]}
        onSourceTypeChange={v => { setChuteSourceType(v as any); resetChuteForm(); }}
        chuteRollId={chuteRollId}
        chuteRollOptions={buildRollOptions(chuteTargetItem ? (rollsByArticle[getArticleId(chuteTargetItem) || ''] || []) : [])}
        onRollChange={setChuteRollId}
        parentWastePieceId={parentWastePieceId}
        chuteParentOptions={parentWastePieces.map(p => ({ label: formatRollChuteLabel({ reference: p.reference ?? p.id.slice(0, 8), nbPlis: p.nbPlis, thicknessMm: p.thicknessMm, colorName: p.colorName, colorHexCode: p.colorHexCode }), value: p.id }))}
        onParentWasteChange={setParentWastePieceId}
        parentWastePiecesLoading={parentWastePiecesLoading}
        chutePlacementId={chutePlacementId}
        chutePlacementOptions={chutePlacements.map(p => ({ label: `Placement ${p.id.slice(0, 8)} • ${p.widthMm}x${p.heightMm}mm • x:${p.xMm} y:${p.yMm}`, value: p.id }))}
        onPlacementChange={setChutePlacementId}
        chutePlacementsLoading={chutePlacementsLoading}
        renderRollOption={opt => opt && (
          <div className="flex align-items-center gap-2">
            <span style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: opt.colorHexCode || 'transparent', border: '1px solid var(--surface-border)' }} />
            <span>{opt.colorName || t('commandes.notAvailable')}</span>
            <span className="text-secondary">•</span>
            <span>{opt.label}</span>
          </div>
        )}
        chuteSource={chuteSourceType === 'ROLL' ? rollsByArticle[getArticleId(chuteTargetItem) || '']?.find(r => r.id === chuteRollId) : parentWastePieces.find(p => p.id === parentWastePieceId)}
        chuteDimensions={chuteDimensions}
        onDimensionChange={(f, v) => {
          const next = { ...chuteDimensions, [f]: parseFloat(v) || 0 };
          setChuteDimensions({ ...next, areaM2: (next.widthMm / 1000) * next.lengthM });
        }}
        onCreate={() => handleCreateChute(chuteTargetItem, rollsByArticle[getArticleId(chuteTargetItem) || ''] || [], parentWastePieces, chutePlacements).then(res => res && setShowChuteForm(false))}
        creatingChute={creatingChute}
      />

      <PlacementDialog
        showPlacementModal={showPlacementModal}
        editingPlacementId={editingPlacementId}
        placementTargetItem={placementTargetItem}
        onHide={() => setShowPlacementModal(false)}
        t={t}
        disabled={isCommandeLocked}
        placementForm={placementForm}
        placementSourceOptionsDialog={[{ label: t('inventory.roll'), value: 'ROLL' }, { label: t('inventory.wastePiece'), value: 'WASTE_PIECE' }]}
        onSourceTypeChange={v => setPlacementForm({ ...placementForm, sourceType: v as any, sourceId: '' })}
        placementRollOptionsDialog={buildRollOptions(placementTargetItem ? (rollsByArticle[getArticleId(placementTargetItem) || ''] || []) : [])}
        placementWasteOptionsDialog={(placementTargetItem ? (availableWasteByArticle[getArticleId(placementTargetItem) || ''] || []) : []).map(w => ({ label: formatRollChuteLabel({ reference: w.reference ?? w.id.slice(0, 8), nbPlis: w.nbPlis, thicknessMm: w.thicknessMm, colorName: w.colorName, colorHexCode: w.colorHexCode }), value: w.id }))}
        onSourceIdChange={v => setPlacementForm({ ...placementForm, sourceId: v })}
        onFieldChange={(f, v) => setPlacementForm({ ...placementForm, [f]: v })}
        onSave={() => handleCreatePlacement(placementTargetItem!, rollsByArticle[getArticleId(placementTargetItem) || ''] || [], wasteForItem, placementsForItem).then(res => res && setShowPlacementModal(false))}
        creatingPlacement={creatingPlacement}
        rolls={placementTargetItem ? (rollsByArticle[getArticleId(placementTargetItem) || ''] || []) : []}
        wasteForItem={wasteForItem}
        placementsForItem={placementsForItem}
        renderRollOption={opt => opt && (
          <div className="flex align-items-center gap-2">
            <span style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: opt.colorHexCode || 'transparent', border: '1px solid var(--surface-border)' }} />
            <span>{opt.colorName || t('commandes.notAvailable')}</span>
            <span className="text-secondary">•</span>
            <span>{opt.label}</span>
          </div>
        )}
      />

      <PlacementPreviewDialog
        showPlacementPreview={showPlacementPreview}
        onHide={() => setShowPlacementPreview(false)}
        previewPlacement={previewPlacement}
        placementsForItem={placementsForItem}
      />

      <ProductionDialog
        showProductionModal={showProductionModal}
        productionTargetItem={productionTargetItem}
        onHide={() => setShowProductionModal(false)}
        t={t}
        disabled={isCommandeLocked}
        productionForm={productionForm}
        onFieldChange={(f, v) => setProductionForm({ ...productionForm, [f]: v })}
        selectedProductionColorHex={(() => {
          const p = placementsForItem.find(p => p.id === productionForm.placedRectangleId);
          return p?.roll?.colorHexCode || p?.wastePiece?.colorHexCode || '';
        })()}
        selectedProductionColorName={(() => {
          const p = placementsForItem.find(p => p.id === productionForm.placedRectangleId);
          return p?.roll?.colorName || p?.wastePiece?.colorName || '';
        })()}
        selectedProductionLabel={placementsForItem.find(p => p.id === productionForm.placedRectangleId) ? (() => {
          const p = placementsForItem.find(p => p.id === productionForm.placedRectangleId)!;
          const s = p.roll || p.wastePiece;
          return `${formatSourceLabel(s, p.id.slice(0, 8))} | x:${p.xMm} y:${p.yMm} ${p.widthMm}x${p.heightMm}mm`;
        })() : t('commandes.notAvailable')}
        onSave={() => {
          const warnings = getProductionWarnings(productionTargetItem!, placementsForItem.find(p => p.id === productionForm.placedRectangleId), parseFloat(productionForm.pieceLengthM), parseInt(productionForm.pieceWidthMm, 10));
          handleCreateProductionItem(productionTargetItem, warnings).then(res => res && setShowProductionModal(false));
        }}
        creatingProduction={creatingProduction}
      />

      <Dialog
        visible={!!svgZoomPreview}
        onHide={() => setSvgZoomPreview(null)}
        header={svgZoomPreview?.title}
        maximizable
        style={{ width: '90vw' }}
        className="albel-svg-zoom-dialog"
      >
        {svgZoomPreview && (() => {
          const slices = buildOptimizationSvgSlices(svgZoomPreview.svg);
          const isSliced = Array.isArray(slices) && slices.length > 1;
          if (isSliced) {
            console.log('ZOOM MODAL DEBUG: SLICED', { count: slices.length, firstSlice: slices[0]?.html?.slice(0, 200) });
          } else {
            const normalized = normalizeOptimizationSvg(svgZoomPreview.svg);
            console.log('ZOOM MODAL DEBUG: NOT SLICED', { normalizedStart: normalized?.slice(0, 200) });
          }
          return (
            <div
              className={`albel-svg-viewer albel-svg-viewer--zoom${isSliced ? ' albel-svg-viewer--sliced' : ''}`}
              style={{ border: '3px solid red', minHeight: 400, background: '#fffbe6' }}
            >
              {isSliced ? (
                <div className="albel-svg-slices">
                  {slices!.map((slice, idx) => (
                    <div key={`zoom-slice-${idx}`} className="albel-svg-slice-container">
                      <div className="albel-svg-slice-header">
                        <span>{t('commandes.slice')} {idx + 1}</span>
                        <span className="albel-svg-slice-label">{slice.label}</span>
                      </div>
                      <div
                        className="albel-svg-slice"
                        dangerouslySetInnerHTML={{ __html: slice.html }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div dangerouslySetInnerHTML={{ __html: normalizeOptimizationSvg(svgZoomPreview.svg) }} />
              )}
            </div>
          );
        })()}
      </Dialog>

      <Toast ref={toastRef} baseZIndex={10000} />
    </div>
  );
}

export default CommandeDetailPage;
