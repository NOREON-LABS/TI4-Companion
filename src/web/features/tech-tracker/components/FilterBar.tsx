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

const STATUS_DOT: Record<TechStatus, string> = {
  available: 'bg-primary',
  owned: 'bg-emerald-400',
  locked: 'bg-muted-foreground',
};

const CATEGORY_SHORT: Record<TechCategory, string> = {
  blue: 'Propulsion',
  green: 'Biotic',
  yellow: 'Cybernetic',
  red: 'Warfare',
  unit: 'Units',
  faction: 'Faction',
};

function SegmentButton({
  active,
  onClick,
  children,
  dot,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
  dot?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex min-h-9 items-center justify-center gap-1.5 px-3 text-xs font-semibold transition-[background-color,color,opacity] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
        active
          ? 'bg-secondary text-foreground shadow-sm'
          : 'text-muted-foreground opacity-55 hover:bg-accent/60 hover:opacity-100',
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

/** Compact status, faction-scope, and track controls for the technology catalog. */
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
    <div className="flex flex-col gap-3 border-y border-border/70 py-3">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="font-display text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Status
          </span>
          <div
            role="group"
            aria-label="Tech status"
            className="inline-flex divide-x divide-border/70 overflow-hidden rounded-md border border-border/80 bg-card/35"
          >
            {STATUS_ORDER.map((s) => (
              <SegmentButton
                key={s}
                active={filters.statuses.has(s)}
                dot={STATUS_DOT[s]}
                onClick={() => toggleStatus(s)}
              >
                {STATUS_BADGE[s].label}
              </SegmentButton>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:ml-auto">
          <span className="font-display text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Faction techs
          </span>
          <div
            role="group"
            aria-label="Faction technologies"
            className="inline-flex divide-x divide-border/70 overflow-hidden rounded-md border border-border/80 bg-card/35"
          >
            <SegmentButton
              active={!filters.hideOtherFactionTechs}
              onClick={() => onChange({ ...filters, hideOtherFactionTechs: false })}
            >
              All
            </SegmentButton>
            <SegmentButton
              active={filters.hideOtherFactionTechs}
              onClick={() => onChange({ ...filters, hideOtherFactionTechs: true })}
            >
              Current
            </SegmentButton>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 border-t border-border/50 pt-3">
        <span className="mr-1 font-display text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Tracks
        </span>
        {CATEGORY_ORDER.map((c) => {
          const active = filters.categories.has(c);
          return (
            <button
              type="button"
              key={c}
              aria-pressed={active}
              onClick={() => toggleCategory(c)}
              className={cn(
                'inline-flex min-h-9 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-[background-color,border-color,color,opacity] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active
                  ? 'border-border/90 bg-card/80 text-foreground shadow-sm'
                  : 'border-transparent text-muted-foreground opacity-45 hover:bg-accent/50 hover:opacity-100',
              )}
            >
              <span
                className={cn(
                  'h-2 w-2 rounded-full',
                  CATEGORY_ACCENT[c].dot,
                  !active && 'opacity-40',
                )}
              />
              {CATEGORY_SHORT[c]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
