import type { Prerequisites, Tech, TechCategory } from '@domain';
import { cn } from '@web/lib/utils';
import { CATEGORY_ACCENT, CATEGORY_ORDER, LANE_META, TIER_LABELS, tierOf } from '../colors';
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
    <div className="overflow-x-auto">
      <div className="min-w-max">
        {/* Tier axis header row — spacer matches the sticky lane-label width below. */}
        <div className="mb-3 flex items-end gap-[26px]">
          <div className="sticky left-0 z-10 w-[126px] shrink-0" />
          {TIER_LABELS.map((tier) => (
            <div key={tier.top} className="flex w-[170px] shrink-0 flex-col items-center gap-0.5">
              <div className="font-display text-[11px] uppercase tracking-[0.12em] text-foreground/80">
                {tier.top}
              </div>
              <div className="text-[9.5px] uppercase tracking-wide text-muted-foreground">
                {tier.sub}
              </div>
              <div className="mt-0.5 h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />
            </div>
          ))}
        </div>

        {lanes.map((category) => {
          const techs = byCategory.get(category) ?? [];
          const meta = LANE_META[category];
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
              {/* w-[152px] = 126px of content + the 26px gap before the columns, all as one sticky,
                  self-stretching, opaque block — otherwise cards scrolling underneath peek through
                  the gap, or below the label's own (shorter) height. */}
              <div className="sticky left-0 z-10 flex w-[152px] shrink-0 gap-2.5 self-stretch bg-card pr-[26px]">
                <span className={cn('min-h-10 w-[3px] shrink-0 rounded-full', accent.dot)} />
                <div className="flex flex-col gap-0.5 pt-0.5">
                  <div className="font-display text-[11px] uppercase tracking-[0.06em] text-foreground">
                    {meta.name}
                  </div>
                  <div className="text-[9.5px] leading-tight text-muted-foreground">{meta.sub}</div>
                </div>
              </div>

              <div className="flex gap-[26px]">
                {columns.map((col, tier) => (
                  <div key={tier} className="flex w-[170px] shrink-0 flex-col gap-3">
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
