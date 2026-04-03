import { useState, useCallback } from 'react';
export { useAuthStore as useAuth } from './useAuth';
export { useAsyncLock } from './useAsyncLock';

/**
 * Custom hook for handling async operations with loading/error states
 */
export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  immediate = true,
) {
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    setStatus('pending');
    setData(null);
    setError(null);
    try {
      const response = await asyncFunction();
      setData(response);
      setStatus('success');
      return response;
    } catch (error) {
      setError(error instanceof Error ? error : new Error('Unknown error'));
      setStatus('error');
    }
  }, [asyncFunction]);

  // Execute on mount if immediate
  useState(() => {
    if (immediate) {
      execute();
    }
  });

  return { execute, status, data, error };
}

/**
 * Custom hook for managing form state
 */
export function useForm<T extends Record<string, unknown>>(
  initialValues: T,
  onSubmit: (values: T) => void | Promise<void>,
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [errors]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } catch (error) {
        setErrors({
          submit: error instanceof Error ? error.message : 'Submission failed',
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, onSubmit],
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
  }, [initialValues]);

  return {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    reset,
    setValues,
    setErrors,
  };
}
