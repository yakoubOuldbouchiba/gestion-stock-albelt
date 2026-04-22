import { useEffect, useState } from 'react';
import { ClientService } from '../../services/clientService';
import { ColorService } from '../../services/colorService';
import type { Client, Color } from '../../types';

export interface ClientOption {
  label: string;
  value: string;
}

export interface ColorOption {
  label: string;
  value: string;
  hexCode?: string;
}

interface UseCommandeLookupsOptions {
  t: (key: string) => string;
  onClientsError?: (message: string, error?: unknown) => void;
}

export function useCommandeLookups({ t, onClientsError }: UseCommandeLookupsOptions) {
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [colors, setColors] = useState<ColorOption[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchClients = async () => {
      try {
        setClientsLoading(true);
        const res = await ClientService.getAll();
        const raw = res?.data;
        const dataArray = Array.isArray(raw) ? raw : (raw as any)?.items ?? [];
        const clientOptions: ClientOption[] = (dataArray as Client[]).map((client) => ({
          label: client.name,
          value: client.id,
        }));
        if (!cancelled) {
          setClients(clientOptions);
          if (clientOptions.length === 0) {
            onClientsError?.(t('commandes.noClientsAvailable'));
          }
        }
      } catch (err) {
        if (!cancelled) {
          onClientsError?.(t('commandes.errorLoadingClients'), err);
        }
      } finally {
        if (!cancelled) {
          setClientsLoading(false);
        }
      }
    };

    fetchClients();
    return () => {
      cancelled = true;
    };
  }, [onClientsError, t]);

  useEffect(() => {
    let cancelled = false;

    const fetchColors = async () => {
      try {
        const res = await ColorService.getAll();
        const colorData = res?.data;
        const colorArray = Array.isArray(colorData) ? colorData : [];
        const options = (colorArray as Color[]).map((color) => ({
          label: color.name,
          value: color.id,
          hexCode: color.hexCode,
        }));
        if (!cancelled) {
          setColors(options);
        }
      } catch {
        if (!cancelled) {
          setColors([]);
        }
      }
    };

    fetchColors();
    return () => {
      cancelled = true;
    };
  }, []);

  return { clients, colors, clientsLoading };
}

