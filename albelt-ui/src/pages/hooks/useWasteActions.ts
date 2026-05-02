import { useState, useCallback } from 'react';
import { WastePieceService } from '../../services/wastePieceService';
import type { CommandeItem, Roll } from '../../types';
import { useI18n } from '@hooks/useI18n';
import { getArticleId } from '../../utils/article';

export function useWasteActions(
  loadWasteForItem: (itemId: string) => Promise<void>,
  showSuccess: (msg: string) => void,
  showError: (msg: string) => void,
  showWarning: (msg: string) => void,
  isCommandeLocked: boolean
) {
  const { t } = useI18n();
  const [creatingChute, setCreatingChute] = useState(false);
  const [chuteSourceType, setChuteSourceType] = useState<'ROLL' | 'WASTE_PIECE'>('ROLL');
  const [chuteRollId, setChuteRollId] = useState('');
  const [parentWastePieceId, setParentWastePieceId] = useState('');
  const [chutePosition, setChutePosition] = useState({ xMm: 0, yMm: 0 });
  const [chuteDimensions, setChuteDimensions] = useState({
    widthMm: 0,
    lengthM: 0,
    areaM2: 0,
  });

  const resetChuteForm = useCallback(() => {
    setChuteSourceType('ROLL');
    setChuteRollId('');
    setParentWastePieceId('');
    setChutePosition({ xMm: 0, yMm: 0 });
    setChuteDimensions({ widthMm: 0, lengthM: 0, areaM2: 0 });
  }, []);

  const handleCreateChute = async (
    chuteTargetItem: CommandeItem | null,
    rolls: Roll[],
    parentWastePieces: any[]
  ) => {
    if (!chuteTargetItem) return false;

    if (isCommandeLocked) {
      showWarning(t('commandes.editLocked'));
      return false;
    }

    if (creatingChute) return false;
    setCreatingChute(true);

    const isRollSource = chuteSourceType === 'ROLL';
    const source = isRollSource
      ? rolls.find((roll) => roll.id === chuteRollId)
      : parentWastePieces.find((piece: any) => piece.id === parentWastePieceId);

    if (!source) {
      showError(t('commandes.productionItemSourceRequired'));
      setCreatingChute(false);
      return false;
    }

    if (chuteDimensions.widthMm <= 0 || chuteDimensions.lengthM <= 0) {
      showError(t('commandes.invalidDimensionsError'));
      setCreatingChute(false);
      return false;
    }

    const wasteData = {
      articleId: getArticleId(source) ?? getArticleId(chuteTargetItem) ?? undefined,
      rollId: isRollSource ? source.id : source.rollId,
      parentWastePieceId: isRollSource ? undefined : source.id,
      materialType: source.materialType,
      nbPlis: source.nbPlis,
      thicknessMm: source.thicknessMm,
      widthMm: chuteDimensions.widthMm,
      lengthM: chuteDimensions.lengthM,
      areaM2: chuteDimensions.areaM2,
      status: 'AVAILABLE',
      wasteType: 'CHUTE_EXPLOITABLE',
      altierID: source.altierId,
      colorId: source.colorId,
      reference: source.reference,
      commandeItemId: chuteTargetItem.id,
      xMm: chutePosition.xMm,
      yMm: chutePosition.yMm,
    };

    try {
      await WastePieceService.create(wasteData);
      await loadWasteForItem(chuteTargetItem.id);
      showSuccess(t('commandes.wasteRecordedSuccess'));
      resetChuteForm();
      return true;
    } catch (err) {
      console.error('Error creating chute:', err);
      showError(t('commandes.wasteRecordError'));
    } finally {
      setCreatingChute(false);
    }
    return false;
  };

  return {
    creatingChute,
    chuteSourceType,
    setChuteSourceType,
    chuteRollId,
    setChuteRollId,
    parentWastePieceId,
    setParentWastePieceId,
    chutePosition,
    setChutePosition,
    chuteDimensions,
    setChuteDimensions,
    resetChuteForm,
    handleCreateChute,
  };
}
