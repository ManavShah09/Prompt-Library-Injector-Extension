import type { PromptCategory } from '../../lib/types';
import { IconFolder, IconChevronRight } from './Icons';

interface Props {
  categories:       PromptCategory[];
  selectedCategory: string | null;
  onSelect:         (name: string) => void;
}

// Deterministic color dot per category (cycles through a palette)
const PALETTE = [
  'bg-violet-500', 'bg-blue-500', 'bg-emerald-500',
  'bg-orange-500', 'bg-pink-500', 'bg-cyan-500',
  'bg-yellow-500', 'bg-rose-500',
];

function categoryColor(_name: string, index: number): string {
  // Use index so the color is stable even if names change
  return PALETTE[index % PALETTE.length];
}

export function CategoryList({ categories, selectedCategory, onSelect }: Props) {
  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 px-4 text-center">
        <IconFolder size={24} className="text-ink-muted" />
        <p className="text-xs text-ink-muted">No categories found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5 overflow-y-auto py-1 px-1">
      {categories.map((cat, idx) => {
        const isActive = cat.name === selectedCategory;
        return (
          <button
            key={cat.name}
            id={`category-${cat.name.toLowerCase().replace(/\s+/g, '-')}`}
            className={`category-item ${isActive ? 'active' : ''}`}
            onClick={() => onSelect(cat.name)}
            title={cat.name}
          >
            <span className="flex items-center gap-2 w-full min-w-0">
              <span
                className={`shrink-0 w-2 h-2 rounded-full ${categoryColor(cat.name, idx)}`}
              />
              <span className="truncate text-xs font-medium">{cat.name}</span>
              {isActive && (
                <IconChevronRight size={12} className="ml-auto shrink-0 text-brand-400" />
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
