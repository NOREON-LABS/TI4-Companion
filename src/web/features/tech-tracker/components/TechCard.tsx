import { useRef, useState } from 'react';
import { Pin } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import type { Prerequisites, Tech } from '@domain';
import { Popover, PopoverAnchor, PopoverContent } from '@web/components/ui/popover';
import { MOTION_TRANSITIONS } from '@web/lib/motion';
import { cn } from '@web/lib/utils';
import { CATEGORY_CARD } from '../colors';
import type { TechStatus } from '../status';
import { PrereqPips } from './PrereqPips';
import { TechDetail } from './TechDetail';
import { UnitSchematic } from './UnitSchematic';

interface TechCardProps {
  tech: Tech;
  status: TechStatus;
  isPinned: boolean;
  available: Prerequisites;
  onToggleOwned: () => void;
  onTogglePin: () => void;
  variant?: 'matrix' | 'unit';
}

/** Hold this long to toggle owned; releasing sooner is a tap and opens the detail popover. */
const LONG_PRESS_MS = 500;
/** Finger/cursor drift beyond this cancels the press — it's a scroll or drag, not a tap. */
const MOVE_CANCEL_PX = 10;

/**
 * A compact tech-tree card. A tap opens the detail popover (which carries the explicit
 * Mark owned / Pin buttons); a long press toggles owned directly.
 */
export function TechCard({
  tech,
  status,
  isPinned,
  available,
  onToggleOwned,
  onTogglePin,
  variant = 'matrix',
}: TechCardProps) {
  const accent = CATEGORY_CARD[tech.category];
  const [detailOpen, setDetailOpen] = useState(false);
  const isUnitUpgrade = variant === 'unit';
  const isWarSun = tech.id === 'ws' || tech.id === 'pws2';
  const [unitSummary = '', ...unitRuleLines] = tech.text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const unitRules = unitRuleLines.join(' ');

  const pressTimer = useRef<number | null>(null);
  const pressOrigin = useRef<{ x: number; y: number } | null>(null);
  const longPressFired = useRef(false);

  const cancelPress = () => {
    if (pressTimer.current !== null) {
      window.clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const handlePointerDown = (event: React.PointerEvent) => {
    if (event.button !== 0) return; // primary button / touch only
    longPressFired.current = false;
    pressOrigin.current = { x: event.clientX, y: event.clientY };
    cancelPress();
    pressTimer.current = window.setTimeout(() => {
      pressTimer.current = null;
      longPressFired.current = true;
      onToggleOwned();
      navigator.vibrate?.(35); // haptic tick where supported (no-op on iOS)
    }, LONG_PRESS_MS);
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    if (pressTimer.current === null || !pressOrigin.current) return;
    const dx = event.clientX - pressOrigin.current.x;
    const dy = event.clientY - pressOrigin.current.y;
    if (Math.hypot(dx, dy) > MOVE_CANCEL_PX) cancelPress();
  };

  // click fires after pointerup even when the long press already toggled — swallow that one.
  const handleClick = () => {
    if (longPressFired.current) {
      longPressFired.current = false;
      return;
    }
    setDetailOpen(true);
  };

  return (
    <Popover open={detailOpen} onOpenChange={setDetailOpen}>
      <PopoverAnchor asChild>
        <m.div
          id={`tech-${tech.id}`}
          tabIndex={0}
          role="button"
          aria-haspopup="dialog"
          aria-expanded={detailOpen}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={cancelPress}
          onPointerLeave={cancelPress}
          onPointerCancel={cancelPress}
          onClick={handleClick}
          whileTap={{ scale: 0.985 }}
          transition={MOTION_TRANSITIONS.tap}
          // Android fires contextmenu at its own long-press threshold; suppress it while our
          // press is live so it doesn't hijack the acquire gesture. Right-click is unaffected
          // (button !== 0 never arms the timer).
          onContextMenu={(event) => {
            if (pressTimer.current !== null || longPressFired.current) event.preventDefault();
          }}
          onKeyDown={(event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            setDetailOpen(true);
          }}
          className={cn(
            // select-none + touch-callout:none stop iOS text-selection UI during the long press.
            // w-full: the tree grid's tier columns own the width, the card just fills its slot.
            'group relative flex w-full shrink-0 scroll-mt-6 cursor-pointer select-none flex-col gap-2 overflow-hidden rounded-xl border p-4 outline-none transition-[filter,background-color,border-color,box-shadow] duration-200 [-webkit-touch-callout:none] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            isUnitUpgrade ? 'h-full min-h-[184px] bg-[#070d18]/90' : 'min-h-[122px]',
            status === 'owned' && cn(accent.border, accent.bgOwned),
            status === 'available' && cn(accent.border, 'bg-card/40'),
            status === 'locked' &&
              'border-border/45 bg-[#070c16]/70 saturate-75 hover:border-border/70 hover:bg-card/45',
            isWarSun &&
              'border-amber-300/45 bg-amber-300/[0.045] shadow-[inset_0_0_42px_-32px_rgba(252,211,77,0.65)]',
            isPinned &&
              'border-primary/90 bg-primary/[0.09] opacity-100 saturate-100 ring-1 ring-primary/55 shadow-[inset_3px_0_0_hsl(var(--primary)),0_0_26px_-13px_hsl(var(--primary))]',
          )}
        >
          <AnimatePresence initial={false}>
            {isPinned ? (
              <m.span
                key="pinned"
                initial={{ opacity: 0, scale: 0.55, rotate: -18 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.7, rotate: 12 }}
                transition={MOTION_TRANSITIONS.state}
                className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full border border-primary/55 bg-primary/15 text-primary"
              >
                <Pin className="h-3.5 w-3.5 fill-current" />
                <span className="sr-only">Pinned</span>
              </m.span>
            ) : null}
          </AnimatePresence>
          {isUnitUpgrade ? <UnitSchematic tech={tech} status={status} /> : null}

          <div className="relative z-[1] flex items-start justify-between gap-1.5">
            <span
              className={cn(
                'flex items-center gap-1 font-semibold leading-tight',
                isUnitUpgrade ? 'max-w-[78%] font-display text-[15px]' : 'text-sm',
                isPinned && 'pr-5',
                status === 'locked' ? 'text-foreground/72' : 'text-foreground',
              )}
            >
              {tech.name}
            </span>
          </div>

          {isUnitUpgrade ? (
            <div className="relative z-[1] max-w-[72%]">
              <div
                className={cn(
                  'font-display text-[10px] font-semibold uppercase leading-relaxed tracking-[0.09em]',
                  status === 'locked' ? 'text-foreground/45' : isWarSun ? 'text-amber-200/80' : 'text-cyan-100/70',
                )}
              >
                {unitSummary.replace(/,\s*/g, ' · ')}
              </div>
              {unitRules ? (
                <p
                  className={cn(
                    'mt-2 line-clamp-3 text-[11.5px] leading-snug',
                    status === 'locked' ? 'text-foreground/45' : 'text-foreground/62',
                  )}
                >
                  {unitRules}
                </p>
              ) : null}
            </div>
          ) : (
            <p
              className={cn(
                'line-clamp-3 text-[12.5px] leading-snug',
                status === 'locked' ? 'text-foreground/55' : 'text-muted-foreground',
              )}
            >
              {tech.text}
            </p>
          )}

          {tech.factionId ? (
            <div className="relative z-[1] flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-fuchsia-300/85">
              <span>◆</span>
              {tech.factionId}
            </div>
          ) : null}

          <div className="relative z-[1] mt-auto flex items-center justify-between gap-1.5 pt-0.5">
            <PrereqPips prerequisites={tech.prerequisites} available={available} />
            <AnimatePresence initial={false} mode="wait">
              <m.span
                key={status}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -3 }}
                transition={MOTION_TRANSITIONS.tap}
                className={cn(
                  'text-[11px] font-bold uppercase tracking-[0.11em]',
                  status === 'locked' ? 'text-muted-foreground/75' : accent.text,
                )}
              >
                {status === 'owned' ? '✓ Owned' : status === 'available' ? 'Ready' : 'Locked'}
              </m.span>
            </AnimatePresence>
          </div>
        </m.div>
      </PopoverAnchor>

      <PopoverContent align="start" className="w-[360px]">
        <TechDetail
          tech={tech}
          status={status}
          isPinned={isPinned}
          onToggleOwned={onToggleOwned}
          onTogglePin={onTogglePin}
        />
      </PopoverContent>
    </Popover>
  );
}
