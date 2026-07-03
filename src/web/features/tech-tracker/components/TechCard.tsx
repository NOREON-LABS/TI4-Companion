import { useRef, useState } from 'react';
import { Pin } from 'lucide-react';
import type { Prerequisites, Tech } from '@domain';
import { Popover, PopoverAnchor, PopoverContent } from '@web/components/ui/popover';
import { cn } from '@web/lib/utils';
import { CATEGORY_CARD } from '../colors';
import type { TechStatus } from '../status';
import { PrereqPips } from './PrereqPips';
import { TechDetail } from './TechDetail';

interface TechCardProps {
  tech: Tech;
  status: TechStatus;
  isPinned: boolean;
  available: Prerequisites;
  onToggleOwned: () => void;
  onTogglePin: () => void;
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
}: TechCardProps) {
  const accent = CATEGORY_CARD[tech.category];
  const [detailOpen, setDetailOpen] = useState(false);

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
        <div
          id={`tech-${tech.id}`}
          tabIndex={-1}
          role="button"
          aria-haspopup="dialog"
          aria-expanded={detailOpen}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={cancelPress}
          onPointerLeave={cancelPress}
          onPointerCancel={cancelPress}
          onClick={handleClick}
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
            'flex min-h-[92px] w-full shrink-0 scroll-mt-6 cursor-pointer select-none flex-col gap-1.5 rounded-[10px] border p-3 outline-none transition-[opacity,filter,background-color,border-color] duration-200 [-webkit-touch-callout:none] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            status === 'owned' && cn(accent.border, accent.bgOwned),
            status === 'available' && cn(accent.border, 'bg-card/40'),
            status === 'locked' && 'border-border/50 bg-card/20 opacity-40 saturate-50 hover:opacity-70',
          )}
        >
          <div className="flex items-start justify-between gap-1.5">
            <span
              className={cn(
                'flex items-center gap-1 text-[13px] font-semibold leading-tight',
                status === 'locked' ? 'text-muted-foreground' : 'text-foreground',
              )}
            >
              {tech.name}
              {isPinned ? <Pin className="h-3 w-3 shrink-0 fill-current text-primary" /> : null}
            </span>
          </div>

          <p
            className={cn(
              'line-clamp-2 text-[10.5px] leading-snug',
              status === 'locked' ? 'text-muted-foreground/70' : 'text-muted-foreground',
            )}
          >
            {tech.text}
          </p>

          {tech.factionId ? (
            <div className="flex items-center gap-1 text-[8.5px] font-semibold uppercase tracking-wider text-fuchsia-300/80">
              <span>◆</span>
              {tech.factionId}
            </div>
          ) : null}

          <div className="mt-auto flex items-center justify-between gap-1.5 pt-0.5">
            <PrereqPips prerequisites={tech.prerequisites} available={available} />
            {status === 'owned' ? (
              <span className={cn('text-sm leading-none', accent.text)}>✓</span>
            ) : null}
            {status === 'available' ? (
              <span
                className={cn('text-sm leading-none motion-safe:animate-pulse', accent.text)}
                aria-label="Available to research"
              >
                ○
              </span>
            ) : null}
          </div>
        </div>
      </PopoverAnchor>

      <PopoverContent align="start" className="w-80">
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
