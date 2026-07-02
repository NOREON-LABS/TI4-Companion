import { TECH_COLORS, type Prerequisites } from '@domain';
import { cn } from '@web/lib/utils';
import { COLOR_DOT } from '../colors';

const HEX_CLIP = '[clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)]';

/** Tailwind text-color classes matching COLOR_DOT, for ring/outline pips. */
const COLOR_RING: Record<(typeof TECH_COLORS)[number], string> = {
  blue: 'ring-tech-blue/50',
  green: 'ring-tech-green/50',
  yellow: 'ring-tech-yellow/50',
  red: 'ring-tech-red/50',
};

interface PrereqPipsProps {
  prerequisites: Prerequisites;
  /** When provided, pips render as hexagons that fill in as `available` satisfies them. */
  available?: Prerequisites;
}

/** Renders one pip per required prerequisite: a coloured dot, or (with `available`) a hexagon that fills in as satisfied. */
export function PrereqPips({ prerequisites, available }: PrereqPipsProps) {
  const pips = TECH_COLORS.flatMap((color) =>
    Array.from({ length: prerequisites[color] ?? 0 }, (_, i) => ({ color, index: i, key: `${color}-${i}` })),
  );

  if (pips.length === 0) {
    return (
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground/70">
        no prerequisites
      </span>
    );
  }

  if (!available) {
    return (
      <span className="flex items-center gap-1">
        {pips.map((pip) => (
          <span
            key={pip.key}
            data-prereq-pip
            className={cn('h-3 w-3 rounded-full ring-1 ring-inset ring-black/30', COLOR_DOT[pip.color])}
          />
        ))}
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1">
      {pips.map((pip) => {
        const satisfied = (available[pip.color] ?? 0) > pip.index;
        return (
          <span
            key={pip.key}
            data-prereq-pip
            data-satisfied={satisfied}
            className={cn(
              'h-[15px] w-[13px]',
              HEX_CLIP,
              satisfied ? COLOR_DOT[pip.color] : cn('ring-1 ring-inset', COLOR_RING[pip.color]),
            )}
          />
        );
      })}
    </span>
  );
}
