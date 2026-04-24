import { useState, useCallback } from 'react';
import { PlacedRectangleService } from '../../services/placedRectangleService';
import type { PlacedRectangle } from '../../types';
import { useI18n } from '@/hooks/useI18n';

interface PlacementForm {
  xMm: string;
  yMm: string;
  widthMm: string;
  heightMm: string;
  commandeItemId?: string;
}

export function usePlacements(sourceId: string, sourceType: 'roll' | 'waste') {
  const { t } = useI18n();
  const [placements, setPlacements] = useState<PlacedRectangle[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PlacementForm>({
    xMm: '',
    yMm: '',
    widthMm: '',
    heightMm: '',
    commandeItemId: '',
  });

  const loadPlacements = useCallback(async () => {
    try {
      const response = sourceType === 'roll' 
        ? await PlacedRectangleService.getByRoll(sourceId)
        : await PlacedRectangleService.getByWastePiece(sourceId);
      
      if (response.success && response.data) {
        setPlacements(Array.isArray(response.data) ? response.data : []);
      }
    } catch (err) {
      console.error('Failed to load placements:', err);
    }
  }, [sourceId, sourceType]);

  const validatePlacement = (newPlacement: PlacementForm, sourceWidth: number, sourceLength: number) => {
    const { xMm, yMm, widthMm, heightMm } = newPlacement;
    const x = parseInt(xMm);
    const y = parseInt(yMm);
    const w = parseInt(widthMm);
    const h = parseInt(heightMm);

    if ([x, y, w, h].some(isNaN)) return t('inventory.placementDimensionsRequired');
    if (x < 0 || y < 0 || w <= 0 || h <= 0) return t('inventory.placementValuesMustBePositive');
    if (x + w > sourceWidth || y + h > sourceLength) return t('inventory.placementOutsideSourceBounds');

    const hasOverlap = placements.some(p => {
      if (editingId && p.id === editingId) return false;
      return x < p.xMm + p.widthMm && x + w > p.xMm && y < p.yMm + p.heightMm && y + h > p.yMm;
    });

    if (hasOverlap) return t('inventory.placementOverlapsExisting');
    return null;
  };

  const handleSave = async (sourceWidth: number, sourceLength: number, onSuccess?: () => void) => {
    const validationError = validatePlacement(form, sourceWidth, sourceLength);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const payload = {
        xMm: parseInt(form.xMm),
        yMm: parseInt(form.yMm),
        widthMm: parseInt(form.widthMm),
        heightMm: parseInt(form.heightMm),
        ...(sourceType === 'roll' ? { rollId: sourceId } : { wastePieceId: sourceId }),
        commandeItemId: form.commandeItemId || undefined
      };

      const response = editingId 
        ? await PlacedRectangleService.update(editingId, payload)
        : await PlacedRectangleService.create(payload);

      if (response.success) {
        await loadPlacements();
        setForm({ xMm: '', yMm: '', widthMm: '', heightMm: '', commandeItemId: '' });
        setEditingId(null);
        onSuccess?.();
      } else {
        setError(response.message || t('rollDetail.failedToUpdate'));
      }
    } catch (err) {
      setError(t('rollDetail.failedToUpdate'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string, onSuccess?: () => void) => {
    if (!window.confirm(t('common.confirmDelete') || 'Delete this placement?')) return;
    
    try {
      const response = await PlacedRectangleService.delete(id);
      if (response.success) {
        setPlacements(prev => prev.filter(p => p.id !== id));
        onSuccess?.();
      }
    } catch (err) {
      setError(t('rollDetail.failedToUpdate'));
    }
  };

  const handleClear = async (onSuccess?: () => void) => {
    if (!window.confirm(t('rollDetail.clearConfirm') || 'Clear all placements?')) return;

    try {
      const response = sourceType === 'roll'
        ? await PlacedRectangleService.clearByRoll(sourceId)
        : await PlacedRectangleService.clearByWastePiece(sourceId);
      
      if (response.success) {
        setPlacements([]);
        onSuccess?.();
      }
    } catch (err) {
      setError(t('rollDetail.failedToUpdate'));
    }
  };

  const startEdit = (placement: PlacedRectangle) => {
    setEditingId(placement.id);
    setForm({
      xMm: String(placement.xMm),
      yMm: String(placement.yMm),
      widthMm: String(placement.widthMm),
      heightMm: String(placement.heightMm),
      commandeItemId: placement.commandeItemId || '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ xMm: '', yMm: '', widthMm: '', heightMm: '', commandeItemId: '' });
  };

  const clearPlacementError = () => setError(null);

  return {
    placements,
    loadPlacements,
    form,
    setForm,
    isProcessing,
    error,
    setError,
    clearPlacementError,
    editingId,
    handleSave,
    handleDelete,
    handleClear,
    startEdit,
    cancelEdit,
  };
}
