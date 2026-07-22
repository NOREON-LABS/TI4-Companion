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
        'inline-flex min-h-11 items-center justify-center gap-2 px-3 text-sm font-semibold transition-[background-color,color,opacity,box-shadow] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
        active
          ? 'bg-primary/[0.13] text-primary shadow-[inset_0_-2px_0_hsl(var(--primary)/0.75)]'
          : 'text-muted-foreground/75 hover:bg-accent/60 hover:text-foreground',
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
    <div className="flex flex-col gap-5">
      <div>
        <span className="mb-2 block font-display text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Status
        </span>
        <div
          role="group"
          aria-label="Tech status"
          className="grid grid-cols-3 divide-x divide-border/70 overflow-hidden rounded-md border border-border/80 bg-card/35"
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

      <div>
        <span className="mb-2 block font-display text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Faction techs
        </span>
        <div
          role="group"
          aria-label="Faction technologies"
          className="grid grid-cols-2 divide-x divide-border/70 overflow-hidden rounded-md border border-border/80 bg-card/35"
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
            Selected
          </SegmentButton>
        </div>
      </div>

      <div>
        <span className="mb-2 block font-display text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Tracks
        </span>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORY_ORDER.map((c) => {
            const active = filters.categories.has(c);
            return (
              <button
                type="button"
                key={c}
                aria-pressed={active}
                onClick={() => toggleCategory(c)}
                className={cn(
                  'inline-flex min-h-11 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-[background-color,border-color,color,opacity] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  active
                    ? 'border-border bg-card text-foreground shadow-sm'
                    : 'border-border/25 bg-transparent text-muted-foreground/55 hover:border-border/60 hover:bg-accent/50 hover:text-foreground',
                )}
              >
                <span
                  className={cn(
                    'h-2 w-2 rounded-full',
                    CATEGORY_ACCENT[c].dot,
                    !active && 'opacity-35',
                  )}
                />
                {CATEGORY_SHORT[c]}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
