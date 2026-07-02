import { useState } from 'react';
import type { GitHubConfig } from '../../lib/types';
import {
  IconGithub, IconKey, IconEye, IconEyeOff,
  IconArrowLeft, IconSparkles,
} from '../components/Icons';

interface Props {
  onSave:        (config: GitHubConfig) => void;
  initialConfig: GitHubConfig | null;
  onBack?:       () => void;
}

type FormState = {
  pat:      string;
  owner:    string;
  repo:     string;
  rootPath: string;
};

export function SettingsPage({ onSave, initialConfig, onBack }: Props) {
  const [form, setForm] = useState<FormState>({
    pat:      initialConfig?.pat      ?? '',
    owner:    initialConfig?.owner    ?? '',
    repo:     initialConfig?.repo     ?? '',
    rootPath: initialConfig?.rootPath ?? 'prompts',
  });
  const [showPat, setShowPat] = useState(false);
  const [status, setStatus]   = useState<'idle' | 'saving' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value.trim() }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.pat || !form.owner || !form.repo || !form.rootPath) {
      setErrorMsg('All fields are required.');
      setStatus('error');
      return;
    }

    setStatus('saving');
    setErrorMsg(null);

    try {
      await chrome.storage.local.set({ githubConfig: form });
      // Clear stale cache on config change so next load re-fetches
      await chrome.storage.local.remove(['cachedLibrary', 'lastSynced']);
      onSave(form);
    } catch {
      setStatus('error');
      setErrorMsg('Failed to save settings. Please try again.');
    }
  };

  const isNew = !initialConfig;

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="relative px-5 pt-5 pb-4">
        {/* Background glow */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% -10%, #7c3aed, transparent)',
          }}
        />

        {onBack && (
          <button
            className="btn-icon mb-3 -ml-1"
            onClick={onBack}
            id="settings-back-btn"
          >
            <IconArrowLeft size={16} />
          </button>
        )}

        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-brand-600/20 border border-brand-600/30 flex items-center justify-center shadow-glow-sm">
            <IconSparkles size={18} className="text-brand-400" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-ink-primary">
              {isNew ? 'Connect GitHub' : 'Settings'}
            </h1>
            <p className="text-[11px] text-ink-muted">
              {isNew
                ? 'Configure your prompt repository'
                : 'Update your repository connection'}
            </p>
          </div>
        </div>
      </div>

      <div className="divider" />

      {/* ── Form ──────────────────────────────────────────────────────────── */}
      <form
        id="settings-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-3.5 flex-1 overflow-y-auto px-5 py-4"
      >
        {/* PAT */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="pat-input"
            className="text-xs font-medium text-ink-secondary flex items-center gap-1.5"
          >
            <IconKey size={12} className="text-ink-muted" />
            Personal Access Token
          </label>
          <div className="relative">
            <input
              id="pat-input"
              type={showPat ? 'text' : 'password'}
              className="input-base pr-9 font-mono"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={form.pat}
              onChange={set('pat')}
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-secondary transition-colors"
              onClick={() => setShowPat((s) => !s)}
              tabIndex={-1}
              title={showPat ? 'Hide token' : 'Show token'}
            >
              {showPat
                ? <IconEyeOff size={14} />
                : <IconEye    size={14} />
              }
            </button>
          </div>
          <p className="text-[10px] text-ink-muted ml-1">
            Needs <code className="text-brand-400">Contents: read</code> (fine-grained) or{' '}
            <code className="text-brand-400">repo</code> (classic) scope.
          </p>
        </div>

        {/* Owner + Repo in a row */}
        <div className="flex gap-2">
          <div className="flex flex-col gap-1.5 flex-1">
            <label htmlFor="owner-input" className="text-xs font-medium text-ink-secondary flex items-center gap-1.5">
              <IconGithub size={12} className="text-ink-muted" />
              Owner
            </label>
            <input
              id="owner-input"
              type="text"
              className="input-base"
              placeholder="github-user"
              value={form.owner}
              onChange={set('owner')}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            <label htmlFor="repo-input" className="text-xs font-medium text-ink-secondary">
              Repository
            </label>
            <input
              id="repo-input"
              type="text"
              className="input-base"
              placeholder="my-prompts"
              value={form.repo}
              onChange={set('repo')}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Root folder path */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="rootpath-input" className="text-xs font-medium text-ink-secondary">
            Root Folder Path
          </label>
          <input
            id="rootpath-input"
            type="text"
            className="input-base font-mono"
            placeholder="prompts"
            value={form.rootPath}
            onChange={set('rootPath')}
            autoComplete="off"
            spellCheck={false}
          />
          <p className="text-[10px] text-ink-muted ml-1">
            The folder in your repo containing category subfolders (e.g.{' '}
            <code className="text-ink-accent">prompts/Research/my-prompt.md</code>)
          </p>
        </div>

        {/* Error */}
        {status === 'error' && errorMsg && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-status-error/10 border border-status-error/25 animate-fade-in">
            <span className="text-status-error text-xs leading-relaxed">{errorMsg}</span>
          </div>
        )}

        <div className="flex-1" />

        {/* Submit */}
        <button
          type="submit"
          id="settings-save-btn"
          className="btn-primary w-full"
          disabled={status === 'saving'}
        >
          {status === 'saving' ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />
              Saving…
            </>
          ) : (
            <>
              <IconSparkles size={14} />
              {isNew ? 'Save & Connect' : 'Save Changes'}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
