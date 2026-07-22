import type { CSSProperties } from 'react';
import type { Prerequisites, Tech, TechCategory } from '@domain';
import { cn } from '@web/lib/utils';
import { CATEGORY_ACCENT, CATEGORY_ORDER, LANE_META, TIER_LABELS, tierOf } from '../colors';
import type { TechStatus } from '../status';
import { TechCard } from './TechCard';

interface TechTreeGridProps {
  /** Techs per category, already filtered by status, track, and faction scope. */
  byCategory: ReadonlyMap<TechCategory, readonly Tech[]>;
  statusOf: (tech: Tech) => TechStatus;
  pinnedIds: ReadonlySet<string>;
  available: Prerequisites;
  onToggleOwned: (id: string) => void;
  onTogglePin: (id: string) => void;
}

// Leaves a small rounding/scrollbar allowance so all five tiers fit a 1024px landscape
// viewport without creating a 1–2px horizontal scroll range.
const TIER_MIN_WIDTH_PX = 183;
const TIER_GAP_PX = 12;

/** A responsive lane × tier research board sized first for iPad mini landscape. */
export function TechTreeGrid({
  byCategory,
  statusOf,
  pinnedIds,
  available,
  onToggleOwned,
  onTogglePin,
}: TechTreeGridProps) {
  const lanes = CATEGORY_ORDER.filter(
    (category) => category !== 'unit' && (byCategory.get(category)?.length ?? 0) > 0,
  );
  const highestTier = Math.min(
    TIER_LABELS.length - 1,
    Math.max(
      0,
      ...lanes.flatMap((category) =>
        (byCategory.get(category) ?? []).map((tech) => tierOf(tech.prerequisites)),
      ),
    ),
  );
  const visibleTiers = TIER_LABELS.slice(0, highestTier + 1);
  const gridStyle = {
    gridTemplateColumns: `repeat(${visibleTiers.length}, minmax(${TIER_MIN_WIDTH_PX}px, 1fr))`,
  } satisfies CSSProperties;
  const minimumWidth =
    visibleTiers.length * TIER_MIN_WIDTH_PX +
    Math.max(visibleTiers.length - 1, 0) * TIER_GAP_PX;

  return (
    <div
      aria-label="Technology tiers. Scroll horizontally to compare tiers when required."
      className="w-full max-w-full overflow-x-auto overscroll-x-contain pb-2"
    >
      <div
        className="relative isolate w-full"
        style={{ minWidth: minimumWidth }}
      >
        <div className="relative mb-1 grid gap-3 border-b border-white/[0.09]" style={gridStyle}>
          {visibleTiers.map((tier) => (
            <div key={tier.top} className="flex h-10 min-w-0 items-center justify-center">
              <div className="font-display text-xs font-semibold uppercase tracking-[0.12em] text-foreground/85">
                {tier.top}
              </div>
            </div>
          ))}
        </div>

        {lanes.map((category) => {
          const techs = byCategory.get(category) ?? [];
          const accent = CATEGORY_ACCENT[category];
          const meta = LANE_META[category];
          const columns = visibleTiers.map((_, tier) =>
            techs.filter((tech) => tierOf(tech.prerequisites) === tier),
          );

          return (
            <section key={category} className="relative px-0.5 py-4">
              <div className="sticky left-0 z-10 mb-3 flex w-fit items-center gap-2.5 bg-gradient-to-r from-[#050a14] via-[#050a14]/90 to-transparent py-1 pr-8">
                <span className={cn('h-2.5 w-2.5 rounded-full', accent.dot)} />
                <span className="font-display text-xs font-semibold uppercase tracking-[0.12em] text-foreground">
                  {meta.name}
                </span>
              </div>
              <div className="grid gap-3" style={gridStyle}>
                {columns.map((column, tier) => (
                  <div key={tier} className="flex min-w-0 flex-col gap-3">
                    {column.map((tech) => (
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
            </section>
          );
        })}
      </div>
    </div>
  );
}
