import { Hexagon, Star } from 'lucide-react';
import type { TechColor } from '@domain';
import { cn } from '@web/lib/utils';
import { COLOR_LABEL } from '../colors';

const COLOR_TEXT: Record<TechColor, string> = {
  blue: 'text-tech-blue',
  green: 'text-tech-green',
  yellow: 'text-tech-yellow',
  red: 'text-tech-red',
};

/**
 * Tech-skip indicator: a filled hexagon (TI's tech/tile motif) in the skip's colour, so it
 * reads as a tech icon — distinct from the round trait dot and the resource/influence pills.
 */
export function TechSkipIcon({ color, className }: { color: TechColor; className?: string }) {
  return (
    <span
      className="inline-flex items-center gap-0.5"
      title={`${COLOR_LABEL[color]} tech skip`}
      aria-label={`${COLOR_LABEL[color]} tech skip`}
    >
      <Hexagon
        className={cn('h-4 w-4 drop-shadow-[0_0_3px_rgba(0,0,0,0.6)]', COLOR_TEXT[color], className)}
        fill="currentColor"
        strokeWidth={1.25}
      />
    </span>
  );
}

/**
 * Resources (amber) / influence (sky) pills — TI4 colour convention. Not shown in the Tech
 * Tracker (resources/influence don't affect tech); kept for future tools that need it.
 */
export function ResourceInfluence({
  resources,
  influence,
}: {
  resources: number;
  influence: number;
}) {
  return (
    <span className="inline-flex items-center gap-1 text-xs tabular-nums" title="Resources / Influence">
      <span className="inline-flex h-4 min-w-[1rem] items-center justify-center rounded bg-amber-500/20 px-1 font-semibold text-amber-300">
        {resources}
      </span>
      <span className="inline-flex h-4 min-w-[1rem] items-center justify-center rounded bg-sky-500/20 px-1 font-semibold text-sky-300">
        {influence}
      </span>
    </span>
  );
}

export function LegendaryIcon() {
  return <Star className="h-3 w-3 fill-amber-300 text-amber-300" aria-label="Legendary" />;
}
