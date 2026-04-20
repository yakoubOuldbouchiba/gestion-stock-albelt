import React, { useState } from 'react';
import { confirmDialog } from 'primereact/confirmdialog';
import { ProductionItemService } from '../../services/productionItemService';
import { CommandeService } from '../../services/commandeService';
import type { CommandeItem, Commande } from '../../types';
import { useI18n } from '@hooks/useI18n';

export function useProductionActions(
  commandeId: string | undefined,
  setCommande: (commande: Commande) => void,
  loadProductionForItem: (itemId: string) => Promise<void>,
  loadOptimizationForItem: (itemId: string) => Promise<void>,
  showSuccess: (msg: string) => void,
  showError: (msg: string) => void,
  showWarning: (msg: string) => void,
  isCommandeLocked: boolean
) {
  const { t } = useI18n();
  const [creatingProduction, setCreatingProduction] = useState(false);
  const [productionForm, setProductionForm] = useState({
    placedRectangleId: '',
    pieceLengthM: '',
    pieceWidthMm: '',
    quantity: '',
    notes: '',
  });

  const handleCreateProductionItem = async (targetItem: CommandeItem | null, warnings: string[]) => {
    if (!targetItem) return false;
    if (isCommandeLocked) {
      showWarning(t('commandes.editLocked'));
      return false;
    }

    const quantity = parseInt(productionForm.quantity, 10);
    const pieceLength = parseFloat(productionForm.pieceLengthM);
    const pieceWidth = parseInt(productionForm.pieceWidthMm, 10);

    if (!quantity || !pieceLength || !pieceWidth) {
      showError(t('commandes.productionItemRequired'));
      return false;
    }

    const placementId = productionForm.placedRectangleId;
    if (!placementId) {
      showError(t('commandes.productionItemSourceRequired'));
      return false;
    }

    const saveProductionItem = async () => {
      try {
        if (creatingProduction) return false;
        setCreatingProduction(true);
        await ProductionItemService.create({
          placedRectangleId: placementId,
          pieceLengthM: pieceLength,
          pieceWidthMm: pieceWidth,
          quantity,
          notes: productionForm.notes || undefined,
        });

        await loadProductionForItem(targetItem.id);
        await loadOptimizationForItem(targetItem.id);
        showSuccess(t('commandes.productionItemCreated'));
        return true;
      } catch (err) {
        console.error('Error creating production item:', err);
        showError(t('commandes.productionItemCreateError'));
      } finally {
        setCreatingProduction(false);
      }
      return false;
    };

    if (warnings.length > 0) {
      return new Promise<boolean>((resolve) => {
        confirmDialog({
          header: t('commandes.productionMismatchTitle'),
          message: React.createElement('div', null,
            React.createElement('div', { style: { marginBottom: '0.5rem' } }, t('commandes.productionMismatchMessage')),
            React.createElement('ul', { style: { margin: 0, paddingLeft: '1.25rem' } },
              warnings.map((warning, index) => React.createElement('li', { key: index }, warning))
            )
          ),
          icon: 'pi pi-exclamation-triangle',
          acceptLabel: t('commandes.continueSave'),
          rejectLabel: t('commandes.cancel'),
          accept: async () => {
            const result = await saveProductionItem();
            resolve(result);
          },
          reject: () => resolve(false),
        });
      });
    }

    return await saveProductionItem();
  };

  const handleDeleteProductionItem = async (productionItemId: string, itemId: string) => {
    if (!commandeId) return;
    if (isCommandeLocked) {
      showWarning(t('commandes.editLocked'));
      return;
    }
    confirmDialog({
      message: 'Delete this production item?',
      header: t('common.confirm'),
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          await ProductionItemService.delete(productionItemId);
          await loadProductionForItem(itemId);
          const commandeRes = await CommandeService.getById(commandeId);
          if (commandeRes.data) {
            setCommande(commandeRes.data);
          }
          showSuccess('Production item deleted.');
        } catch (err) {
          console.error('Error deleting production item:', err);
          showError('Unable to delete production item.');
        }
      },
    });
  };

  return {
    creatingProduction,
    productionForm,
    setProductionForm,
    handleCreateProductionItem,
    handleDeleteProductionItem,
  };
}
