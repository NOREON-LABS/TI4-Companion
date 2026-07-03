import type { Prerequisites, Tech, TechCategory } from '@domain';
import { cn } from '@web/lib/utils';
import { CATEGORY_ACCENT, CATEGORY_ORDER, TIER_LABELS, tierOf } from '../colors';
import type { TechStatus } from '../status';
import { TechCard } from './TechCard';

const TIER_COUNT = TIER_LABELS.length;

interface TechTreeGridProps {
  /** Techs per category, already filtered by status + faction-scope (not by category selection). */
  byCategory: ReadonlyMap<TechCategory, readonly Tech[]>;
  /** Categories toggled on in the filter bar — deselected lanes are dimmed, not removed. */
  activeCategories: ReadonlySet<TechCategory>;
  statusOf: (tech: Tech) => TechStatus;
  pinnedIds: ReadonlySet<string>;
  available: Prerequisites;
  onToggleOwned: (id: string) => void;
  onTogglePin: (id: string) => void;
}

/** Lane (category) x tier grid replacing the flat catalog list — see plan-prompt.md. */
export function TechTreeGrid({
  byCategory,
  activeCategories,
  statusOf,
  pinnedIds,
  available,
  onToggleOwned,
  onTogglePin,
}: TechTreeGridProps) {
  const lanes = CATEGORY_ORDER.filter((category) => (byCategory.get(category)?.length ?? 0) > 0);

  return (
    // 16px gutters + 166px columns keep the full 5-tier grid (8+16 + 5*166 + 4*16 = 918px)
    // inside an iPad landscape viewport (even minus a desktop scrollbar), so there's no few-px
    // scroll slack wiggling under swipes. Narrower screens still get real horizontal scroll;
    // overscroll-x-contain stops a pan from escalating into the browser's back gesture.
    <div className="overflow-x-auto overscroll-x-contain">
      <div className="min-w-max">
        {/* Tier axis header row — spacer matches the sticky lane-marker width below. */}
        <div className="mb-3 flex items-end gap-4">
          <div className="sticky left-0 z-10 w-2 shrink-0" />
          {TIER_LABELS.map((tier) => (
            <div key={tier.top} className="flex w-[166px] shrink-0 flex-col items-center gap-0.5">
              <div className="font-display text-[11px] uppercase tracking-[0.12em] text-foreground/80">
                {tier.top}
              </div>
              <div className="mt-0.5 h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />
            </div>
          ))}
        </div>

        {lanes.map((category) => {
          const techs = byCategory.get(category) ?? [];
          const accent = CATEGORY_ACCENT[category];
          const active = activeCategories.has(category);
          const columns = Array.from({ length: TIER_COUNT }, (_, tier) =>
            techs.filter((tech) => tierOf(tech.prerequisites) === tier),
          );

          return (
            <div
              key={category}
              className={cn(
                'flex items-start border-t border-border/40 py-3.5 transition-opacity duration-200',
                active ? 'opacity-100' : 'pointer-events-none opacity-[0.15]',
              )}
            >
              {/* Sticky, self-stretching, opaque lane marker: an accent line only (label text
                  removed). w-6 = 8px marker column + the 16px gap before the columns, kept
                  opaque so cards scrolling underneath don't peek through the gap. */}
              <div className="sticky left-0 z-10 flex w-6 shrink-0 self-stretch bg-card pr-4">
                <span className={cn('w-[3px] shrink-0 rounded-full', accent.dot)} />
              </div>

              <div className="flex gap-4">
                {columns.map((col, tier) => (
                  <div key={tier} className="flex w-[166px] shrink-0 flex-col gap-3">
                    {col.map((tech) => (
                      <TechCard
                        key={tech.id}
                        tech={tech}
                        status={statusOf(tech)}
                        isPinned={pinnedIds.has(tech.id)}
                        available={available}
                        onToggleOwned={() => onToggleOwned(tech.id)}
                        onTogglePin={() => onTogglePin(tech.id)}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
