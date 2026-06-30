import { TECH_COLORS, type Prerequisites } from '@domain';
import { cn } from '@web/lib/utils';
import { COLOR_DOT } from '../colors';

/** Renders one coloured dot per required prerequisite. */
export function PrereqPips({ prerequisites }: { prerequisites: Prerequisites }) {
  const pips = TECH_COLORS.flatMap((color) =>
    Array.from({ length: prerequisites[color] ?? 0 }, (_, i) => ({ color, key: `${color}-${i}` })),
  );

  if (pips.length === 0) {
    return (
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground/70">
        no prerequisites
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1">
      {pips.map((pip) => (
        <span
          key={pip.key}
          className={cn('h-3 w-3 rounded-full ring-1 ring-inset ring-black/30', COLOR_DOT[pip.color])}
        />
      ))}
    </span>
  );
}
