import { useState, useCallback } from 'react';
import { confirmDialog } from 'primereact/confirmdialog';
import { PlacedRectangleService } from '../../services/placedRectangleService';
import { ProductionItemService } from '../../services/productionItemService';
import { CommandeService } from '../../services/commandeService';
import type { CommandeItem, PlacedRectangle, Commande } from '../../types';
import { useI18n } from '@hooks/useI18n';

export function usePlacementActions(
  commandeId: string | undefined,
  setCommande: (commande: Commande) => void,
  loadPlacementsForItem: (itemId: string) => Promise<void>,
  loadProductionForItem: (itemId: string) => Promise<void>,
  loadOptimizationForItem: (itemId: string) => Promise<void>,
  showSuccess: (msg: string) => void,
  showError: (msg: string) => void,
  showWarning: (msg: string) => void,
  isCommandeLocked: boolean
) {
  const { t } = useI18n();
  const [creatingPlacement, setCreatingPlacement] = useState(false);
  const [editingPlacementId, setEditingPlacementId] = useState<string | null>(null);
  const [placementForm, setPlacementForm] = useState({
    sourceType: 'ROLL' as 'ROLL' | 'WASTE_PIECE',
    sourceId: '',
    xMm: '',
    yMm: '',
    widthMm: '',
    heightMm: '',
  });

  const resetPlacementForm = useCallback(() => {
    setPlacementForm({
      sourceType: 'ROLL',
      sourceId: '',
      xMm: '',
      yMm: '',
      widthMm: '',
      heightMm: '',
    });
    setEditingPlacementId(null);
  }, []);

  const handleCreatePlacement = async (
    item: CommandeItem,
    rolls: any[],
    wasteForItem: any[],
    placementsForItem: PlacedRectangle[]
  ) => {
    if (isCommandeLocked) {
      showWarning(t('commandes.editLocked'));
      return false;
    }
    const isEditing = editingPlacementId !== null;
    const sourceId = placementForm.sourceId;
    const isRollSource = placementForm.sourceType === 'ROLL';
    if (!sourceId && !isEditing) {
      showError('Select a roll or waste piece for placement.');
      return false;
    }

    const source = isRollSource
      ? rolls.find((roll) => roll.id === sourceId)
      : wasteForItem.find((waste: any) => waste.id === sourceId);
    if (!source) {
      showError(t('inventory.placementSourceNotFound'));
      return false;
    }

    const xMm = parseInt(placementForm.xMm, 10);
    const yMm = parseInt(placementForm.yMm, 10);
    const widthMm = parseInt(placementForm.widthMm, 10);
    const heightMm = parseInt(placementForm.heightMm, 10);

    if ([xMm, yMm, widthMm, heightMm].some((value) => Number.isNaN(value))) {
      showError(t('inventory.placementDimensionsRequired'));
      return false;
    }

    const sourceWidth = Number(source.widthMm) || 0;
    const sourceLengthMm = Math.round((Number(source.lengthM) || 0) * 1000);
    if (sourceWidth <= 0 || sourceLengthMm <= 0) {
      showError(t('inventory.sourceDimensionsRequired'));
      return false;
    }

    if (xMm < 0 || yMm < 0 || widthMm <= 0 || heightMm <= 0) {
      showError(t('inventory.placementValuesMustBePositive'));
      return false;
    }

    if (
      xMm >= sourceWidth ||
      yMm >= sourceLengthMm ||
      xMm + widthMm > sourceWidth ||
      yMm + heightMm > sourceLengthMm
    ) {
      showError(t('inventory.placementOutsideSourceBounds'));
      return false;
    }

    const placementsForSource = placementsForItem.filter((placement) =>
      isRollSource ? placement.rollId === sourceId : placement.wastePieceId === sourceId
    );
    const hasOverlap = placementsForSource.some((placement) => {
      if (isEditing && placement.id === editingPlacementId) {
        return false;
      }
      const exX = placement.xMm;
      const exY = placement.yMm;
      const exW = placement.widthMm;
      const exH = placement.heightMm;
      return xMm < exX + exW && xMm + widthMm > exX && yMm < exY + exH && yMm + heightMm > exY;
    });
    if (hasOverlap) {
      showError(t('inventory.placementOverlapsExistingRectangle'));
      return false;
    }

    try {
      if (creatingPlacement) return false;
      setCreatingPlacement(true);
      if (isEditing && editingPlacementId) {
        await PlacedRectangleService.update(editingPlacementId, {
          xMm,
          yMm,
          widthMm,
          heightMm,
        });
      } else {
        await PlacedRectangleService.create({
          rollId: isRollSource ? sourceId : undefined,
          wastePieceId: isRollSource ? undefined : sourceId,
          commandeItemId: item.id,
          xMm,
          yMm,
          widthMm,
          heightMm,
        });
      }
      await loadPlacementsForItem(item.id);
      await loadOptimizationForItem(item.id);
      resetPlacementForm();
      showSuccess(isEditing ? t('inventory.placementUpdated') : t('inventory.placementSaved'));
      return true;
    } catch (err) {
      console.error('Error creating placement:', err);
      showError(
        isEditing ? t('inventory.placementUpdateFailed') : t('inventory.placementSaveFailed')
      );
    } finally {
      setCreatingPlacement(false);
    }
    return false;
  };

  const handleDeletePlacement = (placementId: string, itemId: string) => {
    if (isCommandeLocked) {
      showWarning(t('commandes.editLocked'));
      return;
    }
    const performDelete = async () => {
      await PlacedRectangleService.delete(placementId);
      await loadPlacementsForItem(itemId);
      await loadOptimizationForItem(itemId);
      if (editingPlacementId === placementId) {
        resetPlacementForm();
      }
      showSuccess(t('inventory.placementDeleted'));
    };

    confirmDialog({
      message: t('inventory.confirmDeletePlacement'),
      header: t('common.confirm'),
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          const productionRes = await ProductionItemService.getByCommandeItemId(itemId);
          const productionItems = Array.isArray(productionRes.data) ? productionRes.data : [];
          const linked = productionItems.filter((p) => p.placedRectangleId === placementId);

          if (linked.length > 0) {
            confirmDialog({
              message: ` ${t('inventory.placementHasLinkedProductionItems', {
                count: linked.length,
              })}`,
              header: t('common.confirm'),
              icon: 'pi pi-exclamation-triangle',
              accept: async () => {
                try {
                  await Promise.all(linked.map((p) => ProductionItemService.delete(p.id)));
                  await loadProductionForItem(itemId);
                  await performDelete();
                  if (commandeId) {
                    const commandeRes = await CommandeService.getById(commandeId);
                    if (commandeRes.data) {
                      setCommande(commandeRes.data);
                    }
                  }
                  showSuccess(t('inventory.productionItemsDeleted'));
                } catch (err) {
                  console.error('Error deleting linked production items:', err);
                  showError(t('inventory.unableToDeleteProductionItems'));
                }
              },
            });
            return;
          }

          await performDelete();
        } catch (err) {
          console.error('Error deleting placement:', err);
          showError(t('inventory.placementDeleteFailed'));
        }
      },
    });
  };

  return {
    creatingPlacement,
    editingPlacementId,
    setEditingPlacementId,
    placementForm,
    setPlacementForm,
    resetPlacementForm,
    handleCreatePlacement,
    handleDeletePlacement,
  };
}
