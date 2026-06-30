import type { ReactNode } from 'react';
import { EyeOff } from 'lucide-react';
import type { TechCategory } from '@domain';
import { cn } from '@web/lib/utils';
import { CATEGORY_ACCENT, CATEGORY_ORDER } from '../colors';
import { STATUS_BADGE, type TechStatus } from '../status';

export interface TechFilters {
  statuses: ReadonlySet<TechStatus>;
  categories: ReadonlySet<TechCategory>;
  hideOtherFactionTechs: boolean;
}

const STATUS_ORDER: readonly TechStatus[] = ['available', 'owned', 'locked'];

const CATEGORY_SHORT: Record<TechCategory, string> = {
  blue: 'Propulsion',
  green: 'Biotic',
  yellow: 'Cybernetic',
  red: 'Warfare',
  unit: 'Units',
  faction: 'Faction',
};

function Chip({
  active,
  onClick,
  children,
  dot,
  accent = false,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  dot?: string;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex min-h-[2rem] items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors',
        accent
          ? active
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border text-muted-foreground hover:bg-accent'
          : active
            ? 'border-border bg-secondary text-foreground'
            : 'border-transparent text-muted-foreground opacity-55 hover:opacity-100',
      )}
    >
      {dot ? <span className={cn('h-2 w-2 rounded-full', dot, !active && 'opacity-50')} /> : null}
      {children}
    </button>
  );
}

interface FilterBarProps {
  filters: TechFilters;
  onChange: (filters: TechFilters) => void;
}

/** Status + type filters for the tech catalog, plus a toggle to hide other factions' techs. */
export function FilterBar({ filters, onChange }: FilterBarProps) {
  const toggleStatus = (s: TechStatus) => {
    const next = new Set(filters.statuses);
    if (next.has(s)) next.delete(s);
    else next.add(s);
    onChange({ ...filters, statuses: next });
  };
  const toggleCategory = (c: TechCategory) => {
    const next = new Set(filters.categories);
    if (next.has(c)) next.delete(c);
    else next.add(c);
    onChange({ ...filters, categories: next });
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-card/40 p-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Status
        </span>
        {STATUS_ORDER.map((s) => (
          <Chip key={s} active={filters.statuses.has(s)} onClick={() => toggleStatus(s)}>
            {STATUS_BADGE[s].label}
          </Chip>
        ))}
        <span className="mx-1 hidden h-4 w-px bg-border sm:block" />
        <Chip
          accent
          active={filters.hideOtherFactionTechs}
          onClick={() => onChange({ ...filters, hideOtherFactionTechs: !filters.hideOtherFactionTechs })}
        >
          <EyeOff className="h-3.5 w-3.5" />
          Hide other factions
        </Chip>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Type
        </span>
        {CATEGORY_ORDER.map((c) => (
          <Chip
            key={c}
            active={filters.categories.has(c)}
            dot={CATEGORY_ACCENT[c].dot}
            onClick={() => toggleCategory(c)}
          >
            {CATEGORY_SHORT[c]}
          </Chip>
        ))}
      </div>
    </div>
  );
}
