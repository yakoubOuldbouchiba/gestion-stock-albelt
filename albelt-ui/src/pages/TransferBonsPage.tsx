import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Tag } from 'primereact/tag';
import { useI18n } from '@hooks/useI18n';
import { formatRollChuteLabel } from '@utils/rollChuteLabel';
import { TransferCreatePanel } from '../components/transfer/TransferCreatePanel';
import { TransferHistoryPanel } from '../components/transfer/TransferHistoryPanel';
import { TransferWorkbenchHeader } from '../components/transfer/TransferWorkbenchHeader';
import { useTransferBonsPage } from './hooks/useTransferBonsPage';
import './TransferBonsPage.css';

export function TransferBonsPage() {
  const { t } = useI18n();
  const {
    user,
    error,
    formData,
    updateFormField,
    confirmData,
    setConfirmData,
    userAvailableAltiers,
    otherAltiers,
    bons,
    bonDetails,
    selectedBonId,
    detailsVisible,
    setDetailsVisible,
    selectedRollIds,
    selectedWastePieceIds,
    selectedRollsCount,
    selectedWasteCount,
    selectedItemsCount,
    pendingBonsCount,
    deliveredBonsCount,
    totalMovementCount,
    availableRolls,
    availableWastePieces,
    filteredRolls,
    filteredWastePieces,
    rollTotal,
    wasteTotal,
    rollHasMore,
    wasteHasMore,
    bonsHasMore,
    rollsLoading,
    wasteLoading,
    loading,
    bonsLoadingMore,
    isActionLocked,
    viewLoadingBonId,
    deleteLoadingBonId,
    removeMovementLoadingId,
    rollPage,
    wastePage,
    rollSearch,
    setRollSearch,
    wasteSearch,
    setWasteSearch,
    rollDetailsById,
    wasteDetailsById,
    activeTab,
    setActiveTab,
    bonStatusFilter,
    setBonStatusFilter,
    bonSearch,
    setBonSearch,
    handleCreateBon,
    handleSelectBon,
    handleDeleteBon,
    handleConfirmReceipt,
    handleRemoveMovement,
    handleDownloadTransferPdf,
    loadMoreBons,
    toggleRollSelection,
    toggleWasteSelection,
    refreshSources,
    loadRollSources,
    loadWasteSources,
    isLocked,
  } = useTransferBonsPage();

  if (!user) {
    return (
      <div className="transfer-workbench__loading-state">
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <div className="transfer-workbench page-container">
      <TransferWorkbenchHeader
        title={t('transferBons.title')}
        description={t('transferBons.description')}
        pendingCount={pendingBonsCount}
        deliveredCount={deliveredBonsCount}
        rollTotal={rollTotal}
        loadedRolls={availableRolls.length}
        wasteTotal={wasteTotal}
        loadedWaste={availableWastePieces.length}
        selectedItemsCount={selectedItemsCount}
        selectedRollsCount={selectedRollsCount}
        selectedWasteCount={selectedWasteCount}
        bonsCount={bons.length}
        totalMovementCount={totalMovementCount}
      />

      {error && <Message severity="error" text={error} className="transfer-workbench__message" />}

      <div className="transfer-workbench__layout">
        <TransferCreatePanel
          title={t('transferBons.createBon')}
          formData={formData}
          userAvailableAltiers={userAvailableAltiers}
          otherAltiers={otherAltiers}
          selectedItemsCount={selectedItemsCount}
          selectedRollsCount={selectedRollsCount}
          selectedWasteCount={selectedWasteCount}
          filteredRolls={filteredRolls}
          filteredWastePieces={filteredWastePieces}
          availableRollsCount={availableRolls.length}
          availableWastePiecesCount={availableWastePieces.length}
          rollTotal={rollTotal}
          wasteTotal={wasteTotal}
          rollHasMore={rollHasMore}
          wasteHasMore={wasteHasMore}
          rollsLoading={rollsLoading}
          wasteLoading={wasteLoading}
          selectedRollIds={selectedRollIds}
          selectedWastePieceIds={selectedWastePieceIds}
          rollSearch={rollSearch}
          wasteSearch={wasteSearch}
          isActionLocked={isActionLocked}
          creating={isLocked('transfer-create')}
          onUpdateFormField={updateFormField}
          onSubmit={handleCreateBon}
          onRefreshSources={() => void refreshSources()}
          onLoadMoreRolls={() => void loadRollSources(rollPage + 1, 'append')}
          onLoadMoreWaste={() => void loadWasteSources(wastePage + 1, 'append')}
          onToggleRollSelection={toggleRollSelection}
          onToggleWasteSelection={toggleWasteSelection}
          onRollSearchChange={setRollSearch}
          onWasteSearchChange={setWasteSearch}
          renderRollLabel={(roll) => formatRollChuteLabel(roll)}
          renderWasteLabel={(piece) => formatRollChuteLabel(piece)}
          renderRollMeta={(roll) => (
            <>
              <span>{roll.materialType}</span>
              <span>{roll.widthMm} mm</span>
              <span>{(roll.lengthRemainingM || roll.lengthM).toFixed(2)} m</span>
              <Tag
                value={roll.status}
                severity={roll.status === 'AVAILABLE' ? 'success' : roll.status === 'OPENED' ? 'warning' : 'info'}
              />
            </>
          )}
          renderWasteMeta={(piece) => (
            <>
              <span>{piece.materialType}</span>
              <span>{piece.widthMm} mm</span>
              <span>{piece.lengthM.toFixed(2)} m</span>
              <Tag
                value={piece.status}
                severity={piece.status === 'AVAILABLE' ? 'success' : piece.status === 'OPENED' ? 'warning' : 'info'}
              />
            </>
          )}
        />

        <TransferHistoryPanel
          bons={bons}
          bonDetails={bonDetails}
          bonMovementsCount={bonDetails?.movements?.length || 0}
          selectedBonId={selectedBonId}
          detailsVisible={detailsVisible}
          loading={loading}
          loadingMore={bonsLoadingMore}
          hasMore={bonsHasMore}
          isActionLocked={isActionLocked}
          viewLoadingBonId={viewLoadingBonId}
          deleteLoadingBonId={deleteLoadingBonId}
          removeMovementLoadingId={removeMovementLoadingId}
          confirming={isLocked('transfer-confirm')}
          confirmDateEntree={confirmData.dateEntree}
          rollDetailsById={rollDetailsById}
          wasteDetailsById={wasteDetailsById}
          activeTab={activeTab}
          statusFilter={bonStatusFilter}
          search={bonSearch}
          onTabChange={setActiveTab}
          onStatusFilterChange={setBonStatusFilter}
          onSearchChange={setBonSearch}
          onSelectBon={(id) => void handleSelectBon(id)}
          onLoadMoreBons={() => void loadMoreBons()}
          onDeleteBon={(id) => void handleDeleteBon(id)}
          onToggleDetails={() => setDetailsVisible((prev) => !prev)}
          onDownloadPdf={() => void handleDownloadTransferPdf()}
          onConfirmDateChange={(value) => setConfirmData({ dateEntree: value })}
          onConfirmReceipt={handleConfirmReceipt}
          onRemoveMovement={(bonId, movementId) => void handleRemoveMovement(bonId, movementId)}
        />
      </div>
    </div>
  );
}

export default TransferBonsPage;
