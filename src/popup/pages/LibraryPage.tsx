import { useState, useMemo } from 'react';
import type { PromptFile } from '../../lib/types';
import { useLibrary }      from '../hooks/useLibrary';
import { CategoryList }    from '../components/CategoryList';
import { PromptList }      from '../components/PromptList';
import { SyncButton }      from '../components/SyncButton';
import {
  IconSettings, IconSearch, IconAlertCircle, IconSparkles,
} from '../components/Icons';

interface Props {
  onPromptSelect:  (prompt: PromptFile) => void;
  onSettingsClick: () => void;
}

export function LibraryPage({ onPromptSelect, onSettingsClick }: Props) {
  const { library, isLoading, error, lastSynced, refresh } = useLibrary();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    library[0]?.name ?? null
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-select first category when library loads
  const effectiveCategory =
    selectedCategory ?? library[0]?.name ?? null;

  // ── Filtering ─────────────────────────────────────────────────────────────
  const filteredLibrary = useMemo(() => {
    if (!searchQuery.trim()) return library;
    const q = searchQuery.toLowerCase();
    return library
      .map((cat) => ({
        ...cat,
        prompts: cat.prompts.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.content.toLowerCase().includes(q)
        ),
      }))
      .filter((cat) => cat.prompts.length > 0);
  }, [library, searchQuery]);

  const activeCategory = searchQuery.trim()
    ? filteredLibrary[0] ?? null
    : filteredLibrary.find((c) => c.name === effectiveCategory) ?? filteredLibrary[0] ?? null;

  const promptCount = library.reduce((n, c) => n + c.prompts.length, 0);

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 pt-3.5 pb-2.5">
        {/* Logo + title */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-brand-600/20 border border-brand-600/30 flex items-center justify-center shrink-0">
            <IconSparkles size={14} className="text-brand-400" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-ink-primary leading-tight">
              Prompt Library
            </h1>
            {!isLoading && library.length > 0 && (
              <p className="text-[10px] text-ink-muted leading-tight">
                {library.length} categories · {promptCount} prompts
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <SyncButton onSync={refresh} isLoading={isLoading} lastSynced={lastSynced} />
          <button
            className="btn-icon"
            onClick={onSettingsClick}
            id="library-settings-btn"
            title="Settings"
          >
            <IconSettings size={16} />
          </button>
        </div>
      </div>

      {/* ── Search ───────────────────────────────────────────────────────── */}
      <div className="px-4 pb-2">
        <div className="relative">
          <IconSearch
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none"
          />
          <input
            id="library-search"
            type="search"
            className="input-base pl-8 text-xs py-2"
            placeholder="Search prompts…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            spellCheck={false}
          />
        </div>
      </div>

      <div className="divider" />

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Loading state */}
        {isLoading && library.length === 0 && (
          <div className="flex flex-col items-center justify-center w-full gap-3">
            <div className="relative">
              <div className="w-8 h-8 border-2 border-brand-600/30 rounded-full" />
              <div className="absolute inset-0 w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin-slow" />
            </div>
            <p className="text-xs text-ink-muted">Fetching from GitHub…</p>
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center w-full gap-3 px-6 text-center">
            <div className="w-10 h-10 rounded-xl bg-status-error/10 border border-status-error/20 flex items-center justify-center">
              <IconAlertCircle size={18} className="text-status-error" />
            </div>
            <div>
              <p className="text-sm font-medium text-ink-primary mb-1">Sync failed</p>
              <p className="text-xs text-ink-muted leading-relaxed">{error}</p>
            </div>
            <button
              className="btn-primary text-xs px-4 py-2"
              onClick={refresh}
              id="retry-sync-btn"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty state (after successful sync with no results) */}
        {!isLoading && !error && library.length === 0 && (
          <div className="flex flex-col items-center justify-center w-full gap-3 px-6 text-center">
            <div className="w-10 h-10 rounded-xl bg-brand-600/10 border border-brand-600/20 flex items-center justify-center">
              <IconSparkles size={18} className="text-brand-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-ink-primary mb-1">No prompts found</p>
              <p className="text-xs text-ink-muted leading-relaxed">
                Make sure your repository has .md files inside category subfolders
                within the configured root path.
              </p>
            </div>
            <button className="btn-ghost text-xs" onClick={onSettingsClick} id="check-settings-btn">
              Check Settings
            </button>
          </div>
        )}

        {/* Main two-panel layout */}
        {!isLoading && !error && library.length > 0 && (
          <>
            {/* Category sidebar */}
            <div className="w-[120px] shrink-0 border-r border-surface-border overflow-y-auto py-1">
              <CategoryList
                categories={filteredLibrary}
                selectedCategory={activeCategory?.name ?? null}
                onSelect={(name) => {
                  setSelectedCategory(name);
                  setSearchQuery('');
                }}
              />
            </div>

            {/* Prompt list */}
            <div className="flex-1 overflow-y-auto py-1 px-1">
              {activeCategory ? (
                <PromptList
                  prompts={activeCategory.prompts}
                  onSelect={onPromptSelect}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-xs text-ink-muted">Select a category</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
