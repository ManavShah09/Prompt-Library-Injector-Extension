import type { VariablesState } from '../../lib/types';
import { VariableForm }     from '../components/VariableForm';
import { IconArrowLeft, IconZap, IconFileText } from '../components/Icons';

interface Props {
  state:    VariablesState;
  onInject: (compiledText: string) => void;
  onBack:   () => void;
}

export function VariablesPage({ state, onInject, onBack }: Props) {
  return (
    <div className="flex flex-col h-full animate-slide-in">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="px-4 pt-3.5 pb-3">
        <button
          className="btn-ghost -ml-2 mb-3 text-xs"
          onClick={onBack}
          id="variables-back-btn"
        >
          <IconArrowLeft size={13} />
          Back to library
        </button>

        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-600/15 border border-brand-600/25 flex items-center justify-center shrink-0 mt-0.5">
            <IconFileText size={15} className="text-brand-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-ink-primary leading-tight mb-0.5 truncate">
              {state.prompt.name}
            </h2>
            <div className="flex items-center gap-1.5">
              <span className="badge">
                <IconZap size={9} />
                {state.variables.length} variable{state.variables.length !== 1 ? 's' : ''}
              </span>
              <span className="text-[10px] text-ink-muted">Fill in to inject</span>
            </div>
          </div>
        </div>
      </div>

      <div className="divider" />

      {/* ── Variable form ─────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 overflow-hidden px-4 py-4">
        <VariableForm state={state} onSubmit={onInject} />
      </div>
    </div>
  );
}
