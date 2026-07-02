import { useState, useEffect, useCallback } from 'react';

/**
 * Typed wrapper around chrome.storage.local.
 *
 * - Reads the stored value on mount (isLoaded = false until complete)
 * - `setStoredValue` updates both React state and chrome.storage atomically
 */
export function useStorage<T>(
  key: string,
  defaultValue: T
): readonly [T, (newValue: T | ((prev: T) => T)) => void, boolean] {
  const [value, setValue]     = useState<T>(defaultValue);
  const [isLoaded, setLoaded] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(key, (result) => {
      if (chrome.runtime.lastError) {
        console.warn('[useStorage] Read error:', chrome.runtime.lastError.message);
      } else if (result[key] !== undefined) {
        setValue(result[key] as T);
      }
      setLoaded(true);
    });
  }, [key]);

  const setStoredValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved =
          typeof newValue === 'function'
            ? (newValue as (p: T) => T)(prev)
            : newValue;
        chrome.storage.local.set({ [key]: resolved });
        return resolved;
      });
    },
    [key]
  );

  return [value, setStoredValue, isLoaded] as const;
}
