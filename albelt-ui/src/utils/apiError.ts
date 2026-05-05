import axios from 'axios';
import type { TFunction } from 'i18next';

type ApiErrorParams = Record<string, unknown>;

interface ApiDomainError {
  code?: string;
  messageKey?: string;
  params?: ApiErrorParams;
  message?: string;
}

interface ApiErrorPayload {
  success?: boolean;
  message?: string;
  data?: unknown;
  timestamp?: string;
}

const getTriggerFunction = (params: ApiErrorParams | undefined) => {
  const triggerFunction = params?.triggerFunction;
  return typeof triggerFunction === 'string' ? triggerFunction : undefined;
};

const mapDomainErrorMessage = (error: ApiDomainError, t: TFunction) => {
  if (error.code === 'TRIGGER_ERROR') {
    switch (getTriggerFunction(error.params)) {
      case 'enforce_waste_piece_child_area':
        return t('apiErrors.wastePieceChildAreaExceeded');
      default:
        break;
    }
  }

  return typeof error.message === 'string' && error.message.trim().length > 0
    ? error.message
    : undefined;
};

export const extractApiErrorMessage = (error: unknown, fallback: string, t: TFunction) => {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as ApiErrorPayload | undefined;
    const domainErrors = Array.isArray(payload?.data) ? (payload.data as ApiDomainError[]) : [];
    const messages = domainErrors
      .map((domainError) => mapDomainErrorMessage(domainError, t))
      .filter((message): message is string => typeof message === 'string' && message.trim().length > 0);

    if (messages.length > 0) {
      return messages.join('\n');
    }

    if (typeof payload?.message === 'string' && payload.message.trim().length > 0) {
      return payload.message;
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
};