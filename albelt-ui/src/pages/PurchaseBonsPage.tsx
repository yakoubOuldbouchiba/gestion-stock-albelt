import { Message } from 'primereact/message';
import { PurchaseWorkbenchHeader } from '../components/purchase/PurchaseWorkbenchHeader';
import { PurchaseBonFormPanel } from '../components/purchase/PurchaseBonFormPanel';
import { PurchaseBonListPanel } from '../components/purchase/PurchaseBonListPanel';
import { usePurchaseBonsPage } from './hooks/usePurchaseBonsPage';
import './PurchaseBonsPage.css';

export function PurchaseBonsPage() {
  const {
    t,
    suppliers,
    altiers,
    colors,
    bons,
    selectedBon,
    loading,
    error,
    bonForm,
    itemForm,
    items,
    materialOptions,
    isSaving,
    updateBonField,
    updateItemField,
    addItem,
    removeItem,
    loadBonDetails,
    handleCreateBon,
    handleValidate,
    handleDelete,
    handleDownloadPdf,
  } = usePurchaseBonsPage();

  const draftCount = bons.filter((bon) => bon.status === 'DRAFT').length;
  const validatedCount = bons.filter((bon) => bon.status === 'VALIDATED').length;
  const pendingLines = bons.reduce((sum, bon) => sum + (bon.itemCount || 0), 0);

  return (
    <div className="purchase-workbench">
      <PurchaseWorkbenchHeader
        title={t('purchaseBons.title')}
        subtitle={t('purchaseBons.subtitle')}
        draftCount={draftCount}
        validatedCount={validatedCount}
        pendingLines={pendingLines}
        supplierCount={suppliers.length}
        selectedLinesCount={items.length}
        totalBons={bons.length}
      />

      {error && <Message severity="error" text={error} className="purchase-workbench__message" />}

      <div className="purchase-workbench__layout">
        <PurchaseBonFormPanel
          t={t}
          suppliers={suppliers}
          altiers={altiers}
          colors={colors}
          materialOptions={materialOptions}
          bonForm={bonForm}
          itemForm={itemForm}
          items={items}
          isSaving={isSaving}
          onSubmit={handleCreateBon}
          onUpdateBonField={updateBonField}
          onUpdateItemField={updateItemField}
          onAddItem={addItem}
          onRemoveItem={removeItem}
        />

        <PurchaseBonListPanel
          t={t}
          loading={loading}
          isSaving={isSaving}
          bons={bons}
          selectedBon={selectedBon}
          onLoadBonDetails={(id) => void loadBonDetails(id)}
          onValidate={(id) => void handleValidate(id)}
          onDelete={(id) => void handleDelete(id)}
          onDownloadPdf={(bon) => void handleDownloadPdf(bon)}
        />
      </div>
    </div>
  );
}

export default PurchaseBonsPage;
