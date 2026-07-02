import { useState, useCallback, useEffect } from 'react';
import type { PromptLibrary } from '../../lib/types';

interface LibraryState {
  library:    PromptLibrary;
  isLoading:  boolean;
  error:      string | null;
  lastSynced: number | null;
}

const INITIAL: LibraryState = {
  library:    [],
  isLoading:  false,
  error:      null,
  lastSynced: null,
};

/**
 * Manages the prompt library state.
 *
 * - On mount, calls the background service worker to load from cache
 * - `refresh()` forces a full GitHub API sync
 */
export function useLibrary() {
  const [state, setState] = useState<LibraryState>(INITIAL);

  const loadLibrary = useCallback(async (forceRefresh = false) => {
    setState((s) => ({ ...s, isLoading: true, error: null }));

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'FETCH_LIBRARY',
        forceRefresh,
      });

      if (response?.success === true) {
        // Pull lastSynced from storage (set by background on each sync)
        const { lastSynced } = await chrome.storage.local.get('lastSynced');
        setState({
          library:    response.library as PromptLibrary,
          isLoading:  false,
          error:      null,
          lastSynced: (lastSynced as number | undefined) ?? Date.now(),
        });
      } else {
        setState((s) => ({
          ...s,
          isLoading: false,
          error: (response?.error as string | undefined) ?? 'An unknown error occurred.',
        }));
      }
    } catch {
      setState((s) => ({
        ...s,
        isLoading: false,
        error:
          'Could not reach the background service. ' +
          'Try reopening the extension popup.',
      }));
    }
  }, []);

  // Auto-load from cache on mount
  useEffect(() => {
    void loadLibrary(false);
  }, [loadLibrary]);

  return {
    ...state,
    /** Force a full sync from GitHub */
    refresh: () => loadLibrary(true),
    /** Reload from local cache only */
    reload:  () => loadLibrary(false),
  };
}
