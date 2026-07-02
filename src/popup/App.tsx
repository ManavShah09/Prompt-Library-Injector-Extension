import { useState, useEffect, useCallback } from 'react';
import type { AppView, GitHubConfig, VariablesState, PromptFile } from '../lib/types';
import { extractVariables } from '../lib/parser';
import { SettingsPage }   from './pages/SettingsPage';
import { LibraryPage }    from './pages/LibraryPage';
import { VariablesPage }  from './pages/VariablesPage';

export default function App() {
  const [view, setView]                       = useState<AppView>('settings');
  const [config, setConfig]                   = useState<GitHubConfig | null>(null);
  const [variablesState, setVariablesState]   = useState<VariablesState | null>(null);
  const [injectStatus, setInjectStatus]       = useState<'idle' | 'success' | 'error'>('idle');
  const [injectError, setInjectError]         = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  // ── Boot: check if config exists → route accordingly ──────────────────────
  useEffect(() => {
    chrome.storage.local.get('githubConfig', (result) => {
      if (result.githubConfig) {
        setConfig(result.githubConfig as GitHubConfig);
        setView('library');
      }
      setIsBootstrapping(false);
    });
  }, []);

  // ── Settings save ──────────────────────────────────────────────────────────
  const handleConfigSave = useCallback((newConfig: GitHubConfig) => {
    setConfig(newConfig);
    setView('library');
  }, []);

  // ── Prompt selection ───────────────────────────────────────────────────────
  const handlePromptSelect = useCallback(async (prompt: PromptFile) => {
    const variables = extractVariables(prompt.content);

    if (variables.length > 0) {
      // Show variable form before injecting
      setVariablesState({ prompt, variables });
      setView('variables');
    } else {
      // No variables — inject immediately
      await sendInject(prompt.content);
    }
  }, []);

  // ── Inject from VariablesPage ──────────────────────────────────────────────
  const handleInjectFromVariables = useCallback(async (compiledText: string) => {
    const ok = await sendInject(compiledText);
    if (ok) setView('library');
  }, []);

  // ── Core inject helper (talks to background service worker) ───────────────
  const sendInject = async (text: string): Promise<boolean> => {
    setInjectStatus('idle');
    setInjectError(null);

    try {
      const response = await chrome.runtime.sendMessage({ type: 'INJECT_TEXT', text });

      if (response?.success) {
        setInjectStatus('success');
        setTimeout(() => setInjectStatus('idle'), 2500);
        return true;
      } else {
        setInjectStatus('error');
        setInjectError((response?.error as string | undefined) ?? 'Injection failed.');
        setTimeout(() => { setInjectStatus('idle'); setInjectError(null); }, 4000);
        return false;
      }
    } catch {
      setInjectStatus('error');
      setInjectError('Could not reach the background service. Reload the extension.');
      setTimeout(() => { setInjectStatus('idle'); setInjectError(null); }, 4000);
      return false;
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (isBootstrapping) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#0d0d14]">
        <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin-slow" />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden bg-[#0d0d14]">
      {/* ── Global inject status toast ─────────────────────────────────── */}
      {injectStatus !== 'idle' && (
        <div
          className={`absolute top-2 left-1/2 -translate-x-1/2 z-50
            flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium
            shadow-lg backdrop-blur-sm border animate-slide-up
            ${injectStatus === 'success'
              ? 'bg-status-success/15 border-status-success/30 text-status-success'
              : 'bg-status-error/15 border-status-error/30 text-status-error'
            }`}
        >
          {injectStatus === 'success' ? '✓ Prompt injected!' : `✗ ${injectError ?? 'Error'}`}
        </div>
      )}

      {/* ── Page views ────────────────────────────────────────────────── */}
      {view === 'settings' && (
        <SettingsPage
          onSave={handleConfigSave}
          initialConfig={config}
          onBack={config ? () => setView('library') : undefined}
        />
      )}

      {view === 'library' && (
        <LibraryPage
          onPromptSelect={handlePromptSelect}
          onSettingsClick={() => setView('settings')}
        />
      )}

      {view === 'variables' && variablesState && (
        <VariablesPage
          state={variablesState}
          onInject={handleInjectFromVariables}
          onBack={() => setView('library')}
        />
      )}
    </div>
  );
}
