import { useState } from 'react';
import type { VariablesState } from '../../lib/types';
import { compilePrompt } from '../../lib/parser';
import { IconZap } from './Icons';

interface Props {
  state:    VariablesState;
  onSubmit: (compiledText: string) => void;
}

export function VariableForm({ state, onSubmit }: Props) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(state.variables.map((v) => [v, '']))
  );
  const [touched, setTouched] = useState<Set<string>>(new Set());

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => new Set(prev).add(key));
  };

  const allFilled  = state.variables.every((v) => values[v].trim().length > 0);
  const compiled   = compilePrompt(state.prompt.content, values);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (allFilled) onSubmit(compiled);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 flex-1 overflow-y-auto"
    >
      {state.variables.map((varName) => {
        const isEmpty  = touched.has(varName) && !values[varName].trim();
        const label    = varName.replace(/_/g, ' ');

        return (
          <div key={varName} className="flex flex-col gap-1.5">
            <label
              htmlFor={`var-${varName}`}
              className="text-xs font-medium text-ink-secondary flex items-center gap-1.5"
            >
              <span
                className="inline-block w-1.5 h-1.5 rounded-full bg-brand-500"
              />
              <span className="capitalize">{label}</span>
            </label>
            <input
              id={`var-${varName}`}
              type="text"
              className={`input-base ${isEmpty ? 'border-status-error/60' : ''}`}
              placeholder={`Enter ${label}…`}
              value={values[varName]}
              onChange={(e) => handleChange(varName, e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
            {isEmpty && (
              <p className="text-[10px] text-status-error ml-1">
                This field is required
              </p>
            )}
          </div>
        );
      })}

      {/* Preview */}
      {compiled !== state.prompt.content && (
        <div className="mt-1 p-3 rounded-lg bg-surface-elevated border border-surface-border">
          <p className="text-[10px] text-ink-muted mb-1.5 font-medium uppercase tracking-wide">
            Preview
          </p>
          <p className="text-xs text-ink-secondary leading-relaxed line-clamp-4 font-mono whitespace-pre-wrap">
            {compiled}
          </p>
        </div>
      )}

      <button
        type="submit"
        className="btn-primary w-full mt-auto"
        disabled={!allFilled}
        id="inject-prompt-btn"
      >
        <IconZap size={14} />
        Inject Prompt
      </button>
    </form>
  );
}
