import type { PromptFile } from '../../lib/types';
import { IconFileText, IconZap } from './Icons';
import { extractVariables } from '../../lib/parser';

interface Props {
  prompts:  PromptFile[];
  onSelect: (prompt: PromptFile) => void;
}

export function PromptList({ prompts, onSelect }: Props) {
  if (prompts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 px-4 text-center">
        <IconFileText size={24} className="text-ink-muted" />
        <p className="text-xs text-ink-muted">No prompts in this category</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 overflow-y-auto py-1 px-1">
      {prompts.map((prompt) => {
        const vars         = extractVariables(prompt.content);
        const hasVariables = vars.length > 0;

        // Strip markdown syntax for the preview snippet
        const snippet = prompt.content
          .replace(/^#{1,6}\s+/gm, '')
          .replace(/\*\*|__|\*|_|`{1,3}|~~|>/g, '')
          .replace(/\{\{(\w+)\}\}/g, '[$1]')
          .replace(/\n+/g, ' ')
          .trim()
          .slice(0, 120);

        return (
          <button
            key={prompt.path}
            id={`prompt-${prompt.path.replace(/\//g, '-').replace(/\.md$/, '')}`}
            className="prompt-card animate-fade-in text-left"
            onClick={() => onSelect(prompt)}
            title={`Inject: ${prompt.name}`}
          >
            <div className="flex items-start gap-2">
              <IconFileText
                size={14}
                className="mt-0.5 shrink-0 text-ink-muted group-hover:text-brand-400"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="prompt-title">{prompt.name}</span>
                  {hasVariables && (
                    <span className="badge gap-1 shrink-0">
                      <IconZap size={9} />
                      {vars.length}
                    </span>
                  )}
                </div>
                {snippet && (
                  <p className="prompt-snippet">{snippet}</p>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
