import { TECH_COLORS, type PrereqCounts } from '@domain';
import { cn } from '@web/lib/utils';
import { COLOR_DOT, COLOR_LABEL } from '../colors';

/** Shows how many prerequisites of each colour the player currently has available. */
export function AvailabilityBar({ available }: { available: PrereqCounts }) {
  return (
    <div className="flex flex-wrap gap-2">
      {TECH_COLORS.map((color) => (
        <div
          key={color}
          className={cn(
            'flex items-center gap-2 rounded-lg border bg-card/60 px-3 py-2 transition-opacity',
            available[color] === 0 && 'opacity-50',
          )}
          title={`${COLOR_LABEL[color]} prerequisites available`}
        >
          <span
            className={cn('h-3.5 w-3.5 rounded-full ring-1 ring-inset ring-black/30', COLOR_DOT[color])}
          />
          <span className="text-xs text-muted-foreground">{COLOR_LABEL[color]}</span>
          <span className="text-base font-bold leading-none tabular-nums">{available[color]}</span>
        </div>
      ))}
    </div>
  );
}
