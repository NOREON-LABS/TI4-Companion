import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import { TECH_COLORS, type PrereqCounts } from '@domain';
import { MOTION_TRANSITIONS } from '@web/lib/motion';
import { cn } from '@web/lib/utils';
import { COLOR_DOT, COLOR_LABEL } from '../colors';

const CHANNEL_ACCENT = {
  blue: {
    bar: 'bg-tech-blue',
    glow: 'shadow-[0_0_12px_hsl(var(--tech-blue)/0.7)]',
  },
  green: {
    bar: 'bg-tech-green',
    glow: 'shadow-[0_0_12px_hsl(var(--tech-green)/0.7)]',
  },
  yellow: {
    bar: 'bg-tech-yellow',
    glow: 'shadow-[0_0_12px_hsl(var(--tech-yellow)/0.7)]',
  },
  red: {
    bar: 'bg-tech-red',
    glow: 'shadow-[0_0_12px_hsl(var(--tech-red)/0.7)]',
  },
} as const;

/** Shows how many prerequisites of each colour the player currently has available. */
export function AvailabilityBar({ available }: { available: PrereqCounts }) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border/75 bg-border/75 sm:grid-cols-4">
      {TECH_COLORS.map((color) => (
        <div
          key={color}
          className={cn(
            'group relative flex min-h-12 min-w-0 items-center gap-2.5 bg-[#070d18]/95 px-4 py-3 transition-colors hover:bg-card',
            available[color] === 0 && 'text-muted-foreground',
          )}
          title={`${COLOR_LABEL[color]} prerequisites available`}
        >
          <span className={cn('absolute inset-x-0 bottom-0 h-0.5', CHANNEL_ACCENT[color].bar)} />
          <span
            className={cn(
              'h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-inset ring-white/15',
              COLOR_DOT[color],
              CHANNEL_ACCENT[color].glow,
              available[color] === 0 && 'opacity-35 shadow-none',
            )}
          />
          <span className="min-w-0 flex-1 truncate text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {COLOR_LABEL[color]}
          </span>
          <span className="grid min-w-[1ch] font-display text-lg font-bold leading-none tabular-nums text-foreground">
            <AnimatePresence initial={false}>
              <m.span
                key={available[color]}
                initial={{ opacity: 0, y: -5, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.9 }}
                transition={MOTION_TRANSITIONS.state}
                className="col-start-1 row-start-1"
              >
                {available[color]}
              </m.span>
            </AnimatePresence>
          </span>
        </div>
      ))}
    </div>
  );
}
