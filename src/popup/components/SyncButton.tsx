import { IconRefresh } from './Icons';

interface Props {
  onSync:      () => void;
  isLoading:   boolean;
  lastSynced:  number | null;
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const sec  = Math.floor(diff / 1000);
  if (sec < 60)  return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60)  return `${min}m ago`;
  const hr  = Math.floor(min / 60);
  if (hr  < 24)  return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

export function SyncButton({ onSync, isLoading, lastSynced }: Props) {
  return (
    <button
      id="sync-btn"
      className="btn-ghost flex-col items-start gap-0 px-2 py-1.5 h-auto"
      onClick={onSync}
      disabled={isLoading}
      title="Sync prompts from GitHub"
    >
      <span className="flex items-center gap-1.5">
        <IconRefresh
          size={13}
          className={`text-ink-muted ${isLoading ? 'animate-spin-slow' : ''}`}
        />
        <span className="text-xs text-ink-secondary">
          {isLoading ? 'Syncing…' : 'Sync'}
        </span>
      </span>
      {lastSynced && !isLoading && (
        <span className="text-[10px] text-ink-muted leading-none ml-[19px]">
          {formatRelative(lastSynced)}
        </span>
      )}
    </button>
  );
}
