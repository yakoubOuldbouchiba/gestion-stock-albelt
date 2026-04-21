import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '@hooks/useI18n';
import { useAsyncLock } from '@hooks/useAsyncLock';
import type {
  Altier,
  Color,
  MaterialType,
  PurchaseBon,
  PurchaseBonItemRequest,
  PurchaseBonRequest,
  Supplier
} from '../../types/index';
import { SupplierService } from '../../services/supplierService';
import { AltierService } from '../../services/altierService';
import { ColorService } from '../../services/colorService';
import { PurchaseBonService } from '../../services/purchaseBonService';
import {
  buildNextItemForm,
  computeAreaM2,
  formatDateInput,
  toArray,
} from '../purchaseBons.utils';

export function usePurchaseBonsPage() {
  const { t, i18n } = useI18n();
  const { run, isLocked } = useAsyncLock();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [altiers, setAltiers] = useState<Altier[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [bons, setBons] = useState<PurchaseBon[]>([]);
  const [selectedBon, setSelectedBon] = useState<PurchaseBon | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [bonForm, setBonForm] = useState({
    reference: '',
    bonDate: formatDateInput(new Date()),
    supplierId: '',
    notes: ''
  });

  const [itemForm, setItemForm] = useState<PurchaseBonItemRequest>({
    materialType: 'PU',
    nbPlis: 1,
    thicknessMm: 2.5,
    widthMm: 1000,
    lengthM: 50,
    areaM2: 50,
    quantity: 1,
    colorId: undefined,
    altierId: undefined,
    qrCode: ''
  });

  const [items, setItems] = useState<PurchaseBonItemRequest[]>([]);

  const materialOptions = useMemo(
    () =>
      (['PU', 'PVC', 'CAOUTCHOUC'] as MaterialType[]).map((material) => ({
        label: material,
        value: material
      })),
    []
  );

  useEffect(() => {
    void loadBaseData();
  }, []);

  const loadBaseData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [suppliersRes, altiersRes, colorsRes, bonsRes] = await Promise.all([
        SupplierService.getAll(),
        AltierService.getAll(),
        ColorService.getAll(),
        PurchaseBonService.list()
      ]);

      if (suppliersRes.success && suppliersRes.data) {
        setSuppliers(toArray<Supplier>(suppliersRes.data));
      }
      if (altiersRes.success && altiersRes.data) {
        setAltiers(toArray<Altier>(altiersRes.data));
      }
      if (colorsRes.success && colorsRes.data) {
        setColors(toArray<Color>(colorsRes.data));
      }
      if (bonsRes.success && bonsRes.data) {
        setBons(toArray<PurchaseBon>(bonsRes.data));
      }
    } catch (loadError) {
      console.error(loadError);
      setError(t('purchaseBons.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const loadBonDetails = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await PurchaseBonService.getById(id);
      if (response.success && response.data) {
        setSelectedBon(response.data);
      }
    } catch (loadError) {
      console.error(loadError);
      setError(t('purchaseBons.failedToLoadDetails'));
    } finally {
      setLoading(false);
    }
  };

  const updateBonField = (field: keyof typeof bonForm, value: string) => {
    setBonForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const updateItemField = <K extends keyof PurchaseBonItemRequest>(
    field: K,
    value: PurchaseBonItemRequest[K]
  ) => {
    setItemForm((prev) => {
      const updated: PurchaseBonItemRequest = {
        ...prev,
        [field]: value
      };

      if (field === 'widthMm' || field === 'lengthM') {
        updated.areaM2 = computeAreaM2(updated.widthMm || 0, updated.lengthM || 0);
      }

      return updated;
    });
  };

  const addItem = () => {
    if (isLocked('purchase-bon')) return;

    if (!itemForm.materialType || !itemForm.quantity || itemForm.quantity <= 0) {
      setError(t('purchaseBons.itemRequired'));
      return;
    }

    setItems((prev) => [...prev, itemForm]);
    setItemForm(buildNextItemForm(itemForm));
  };

  const removeItem = (index: number) => {
    if (isLocked('purchase-bon')) return;
    setItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const resetBonForm = () => {
    setBonForm({
      reference: '',
      bonDate: formatDateInput(new Date()),
      supplierId: '',
      notes: ''
    });
    setItems([]);
  };

  const handleCreateBon = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (isLocked('purchase-bon')) return;

    if (!bonForm.reference || !bonForm.supplierId || !bonForm.bonDate) {
      setError(t('purchaseBons.headerRequired'));
      return;
    }

    if (items.length === 0) {
      setError(t('purchaseBons.itemsRequired'));
      return;
    }

    const request: PurchaseBonRequest = {
      reference: bonForm.reference,
      bonDate: bonForm.bonDate,
      supplierId: bonForm.supplierId,
      notes: bonForm.notes || undefined,
      items
    };

    try {
      await run(async () => {
        const response = await PurchaseBonService.create(request);

        if (response.success && response.data) {
          await loadBaseData();
          setSelectedBon(response.data);
          resetBonForm();
          return;
        }

        setError(response.message || t('purchaseBons.failedToCreate'));
      }, 'purchase-bon');
    } catch (createError) {
      console.error(createError);
      setError(t('purchaseBons.failedToCreate'));
    }
  };

  const handleValidate = async (bonId: string) => {
    try {
      if (isLocked('purchase-bon')) return;

      await run(async () => {
        const response = await PurchaseBonService.validate(bonId);

        if (response.success) {
          await loadBaseData();
          await loadBonDetails(bonId);
          return;
        }

        setError(response.message || t('purchaseBons.failedToValidate'));
      }, 'purchase-bon');
    } catch (validateError) {
      console.error(validateError);
      setError(t('purchaseBons.failedToValidate'));
    }
  };

  const handleDelete = async (bonId: string) => {
    try {
      if (isLocked('purchase-bon')) return;

      await run(async () => {
        const response = await PurchaseBonService.delete(bonId);

        if (response.success) {
          await loadBaseData();
          if (selectedBon?.id === bonId) {
            setSelectedBon(null);
          }
          return;
        }

        setError(response.message || t('purchaseBons.failedToDelete'));
      }, 'purchase-bon');
    } catch (deleteError) {
      console.error(deleteError);
      setError(t('purchaseBons.failedToDelete'));
    }
  };

  const handleDownloadPdf = async (bon: PurchaseBon) => {
    try {
      const blob = await PurchaseBonService.downloadPdf(bon.id, i18n.language || 'fr');
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `purchase-bon-${bon.reference || bon.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (downloadError) {
      console.error(downloadError);
      setError(t('purchaseBons.failedToDownloadPdf'));
    }
  };

  return {
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
    isSaving: isLocked('purchase-bon'),
    updateBonField,
    updateItemField,
    addItem,
    removeItem,
    loadBonDetails,
    handleCreateBon,
    handleValidate,
    handleDelete,
    handleDownloadPdf,
  };
}
