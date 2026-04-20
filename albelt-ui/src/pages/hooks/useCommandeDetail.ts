import { useState, useEffect, useCallback } from 'react';
import { CommandeService } from '../../services/commandeService';
import type { Commande, AltierScore, ItemStatus } from '../../types';
import { useI18n } from '@hooks/useI18n';

export function useCommandeDetail(id: string | undefined) {
  const { t } = useI18n();
  const [commande, setCommande] = useState<Commande | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [deletingOrder, setDeletingOrder] = useState(false);
  const [altierScores, setAltierScores] = useState<AltierScore[]>([]);
  const [altierScoresLoading, setAltierScoresLoading] = useState(false);
  const [altierSaving, setAltierSaving] = useState(false);
  const [selectedAltierId, setSelectedAltierId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  const refreshCommande = useCallback(async () => {
    if (!id) return;
    try {
      const res = await CommandeService.getById(id);
      if (res.data) {
        setCommande(res.data);
        setSelectedStatus(res.data.status);
        setSelectedAltierId(res.data.altierId ?? null);
      }
    } catch (err) {
      console.error('Error refreshing commande:', err);
    }
  }, [id]);

  useEffect(() => {
    if (!id) {
      setError(t('commandes.loadError'));
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await CommandeService.getById(id);
        if (res.data) {
          setCommande(res.data);
          setSelectedStatus(res.data.status);
          setSelectedAltierId(res.data.altierId ?? null);
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(t('commandes.loadError'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, t]);

  useEffect(() => {
    if (!id) return;

    const fetchScores = async () => {
      setAltierScoresLoading(true);
      try {
        const res = await CommandeService.getAltierScores(id);
        setAltierScores(res.data || []);
      } catch (err) {
        console.error('Error fetching altier scores:', err);
        setAltierScores([]);
      } finally {
        setAltierScoresLoading(false);
      }
    };

    fetchScores();
  }, [id]);

  const handleAltierSave = async () => {
    if (!commande || !id) return;
    try {
      setAltierSaving(true);
      const res = await CommandeService.update(id, {
        numeroCommande: commande.numeroCommande,
        clientId: commande.clientId,
        altierId: selectedAltierId || undefined,
        status: commande.status,
        description: commande.description,
        notes: commande.notes,
      });

      if (res.data) {
        setCommande(res.data);
        setSelectedAltierId(res.data.altierId ?? null);
        return true;
      }
    } catch (err) {
      console.error('Error updating workshop:', err);
      throw err;
    } finally {
      setAltierSaving(false);
    }
    return false;
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!id) return;
    try {
      setUpdating(true);
      const res = await CommandeService.updateStatus(id, newStatus);
      if (res.data) {
        setCommande(res.data);
        setSelectedStatus(res.data.status);
        return true;
      }
    } catch (err) {
      console.error('Error updating status:', err);
      throw err;
    } finally {
      setUpdating(false);
    }
    return false;
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await CommandeService.deleteItem(itemId);
      if (commande) {
        setCommande({
          ...commande,
          items: commande.items.filter((item) => item.id !== itemId),
        });
      }
      return true;
    } catch (err) {
      console.error('Error deleting item:', err);
      throw err;
    }
  };

  const handleItemStatusUpdate = async (itemId: string, newStatus: ItemStatus) => {
    try {
      const res = await CommandeService.updateItemStatus(itemId, newStatus);
      if (res.data) {
        await refreshCommande();
        return true;
      }
    } catch (err) {
      console.error('Error updating item status:', err);
      throw err;
    }
    return false;
  };

  const handleDeleteOrder = async () => {
    if (!id) return;
    try {
      setDeletingOrder(true);
      await CommandeService.delete(id);
      return true;
    } catch (err) {
      console.error('Error deleting order:', err);
      throw err;
    } finally {
      setDeletingOrder(false);
    }
  };

  return {
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
    setSelectedStatus,
    handleAltierSave,
    handleStatusUpdate,
    handleDeleteItem,
    handleItemStatusUpdate,
    handleDeleteOrder,
    refreshCommande,
    setCommande,
  };
}
