import { useEffect, useRef, useState } from 'react';
import { Check, Maximize2, Trash2, X } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import { createPortal } from 'react-dom';
import type { Objective } from '@domain';
import { Button } from '@web/components/ui/button';
import type { GamePlayer } from '@web/lib/api';
import { MOTION_TRANSITIONS } from '@web/lib/motion';
import { cn } from '@web/lib/utils';
import { PLAYER_COLOR_CLASSES, playerColorOf } from '../colors';
import { PlayerBadge } from './PlayerBadge';

/** Physical card accents: stage I decks are amber, stage II decks are blue. */
const STAGE_ACCENT = {
  1: {
    border: 'border-amber-400/55',
    label: 'text-amber-300',
    chip: 'bg-amber-400/10',
    wash: 'from-amber-300/16 via-amber-300/[0.035] to-transparent',
  },
  2: {
    border: 'border-sky-400/55',
    label: 'text-sky-300',
    chip: 'bg-sky-400/10',
    wash: 'from-sky-300/16 via-sky-300/[0.035] to-transparent',
  },
} as const;

interface ObjectiveCardProps {
  objective: Objective;
  players: GamePlayer[];
  scoredPlayerIds: ReadonlySet<number>;
  onToggleScore: (playerId: number) => void;
  onUnreveal: () => void;
}

/**
 * A TV-readable public objective. Pressing it opens a large briefing surface that keeps
 * the objective itself dominant while still exposing the scoring controls.
 */
export function ObjectiveCard({
  objective,
  players,
  scoredPlayerIds,
  onToggleScore,
  onUnreveal,
}: ObjectiveCardProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const stage = objective.stage === 2 ? 2 : 1;
  const accent = STAGE_ACCENT[stage];
  const scorers = players.filter((player) => scoredPlayerIds.has(player.id));
  const titleId = `objective-briefing-${objective.id}`;

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusFrame = requestAnimationFrame(() => dialogRef.current?.focus());
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', closeOnEscape);
      document.body.style.overflow = previousOverflow;
      triggerRef.current?.focus();
    };
  }, [open]);

  return (
    <>
      <m.button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        whileTap={{ scale: 0.99 }}
        transition={MOTION_TRANSITIONS.tap}
        className={cn(
          'group relative flex min-h-[230px] cursor-pointer flex-col gap-3 overflow-hidden rounded-xl border-2 bg-[#070d18]/95 p-5 text-left shadow-[0_18px_44px_-38px_black] transition-[background-color,border-color,transform] hover:bg-[#0a1220] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          accent.border,
        )}
      >
        <div
          aria-hidden="true"
          className={cn('pointer-events-none absolute inset-0 bg-gradient-to-br opacity-45', accent.wash)}
        />
        <div className="relative flex items-center justify-between gap-3">
          <span
            className={cn(
              'rounded-full px-3 py-1.5 font-display text-xs font-semibold uppercase tracking-[0.14em]',
              accent.chip,
              accent.label,
            )}
          >
            Stage {stage === 1 ? 'I' : 'II'}
          </span>
          <span className={cn('font-display text-2xl font-bold tabular-nums', accent.label)}>
            {objective.points} VP
          </span>
        </div>

        <h3 className="relative font-display text-[clamp(1.5rem,2vw,2rem)] font-bold leading-tight">
          {objective.name}
        </h3>
        <p className="relative text-[clamp(1rem,1.25vw,1.25rem)] leading-snug text-foreground/90">
          {objective.text}
        </p>

        <div className="relative mt-auto flex min-h-8 flex-wrap items-center gap-2 pt-1">
          {scorers.map((player) => (
            <span
              key={player.id}
              aria-label={`${player.name} scored this objective`}
              title={player.name}
            >
              <PlayerBadge player={player} />
            </span>
          ))}
          <span
            className={cn(
              'ml-auto inline-flex items-center gap-1.5 rounded-md border border-white/[0.12] bg-white/[0.035] px-2.5 py-1.5 text-xs font-semibold text-foreground/70 transition-[background-color,border-color,color] group-hover:border-white/25 group-hover:bg-white/[0.07] group-hover:text-foreground',
              accent.label,
            )}
          >
            <Maximize2 className="h-3.5 w-3.5" />
            View details
          </span>
        </div>
      </m.button>

      {typeof document !== 'undefined'
        ? createPortal(
            <AnimatePresence initial={false}>
              {open ? (
                <div className="fixed inset-0 z-[70]">
                  <m.button
                    type="button"
                    aria-label="Close objective briefing"
                    onClick={() => setOpen(false)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={MOTION_TRANSITIONS.route}
                    className="absolute inset-0 cursor-default bg-[#01040a]/80 backdrop-blur-[5px]"
                  />
                  <m.article
                    ref={dialogRef}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={titleId}
                    tabIndex={-1}
                    initial={{ opacity: 0, scale: 0.965, y: 18 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: 10 }}
                    transition={MOTION_TRANSITIONS.drawer}
                    className={cn(
                      'absolute inset-x-[6vw] inset-y-[7vh] mx-auto grid max-w-[1380px] grid-cols-[minmax(0,1.7fr)_minmax(300px,0.8fr)] overflow-hidden rounded-2xl border-2 bg-[#050a14] shadow-[0_40px_120px_-34px_black] outline-none',
                      accent.border,
                    )}
                  >
                    <div className="relative flex min-w-0 flex-col overflow-y-auto p-8 lg:p-10">
                      <div
                        aria-hidden="true"
                        className={cn('pointer-events-none absolute inset-0 bg-gradient-to-br opacity-70', accent.wash)}
                      />
                      <div aria-hidden="true" className={cn('absolute inset-y-8 left-0 w-1', stage === 1 ? 'bg-amber-300' : 'bg-sky-300')} />

                      <div className="relative flex items-start justify-between gap-6">
                        <div className={cn('font-display text-sm font-semibold uppercase tracking-[0.2em]', accent.label)}>
                          Stage {stage === 1 ? 'I' : 'II'}
                        </div>
                        <div className={cn('shrink-0 text-right font-display', accent.label)}>
                          <div className="text-[clamp(2rem,3.8vw,4rem)] font-bold leading-none tabular-nums">
                            {objective.points}
                          </div>
                          <div className="mt-1 text-xs font-semibold uppercase tracking-[0.2em]">VP</div>
                        </div>
                      </div>

                      <div className="relative flex flex-1 flex-col justify-center pb-8">
                        <h2
                          id={titleId}
                          className="max-w-[18ch] font-display text-[clamp(2.3rem,3.8vw,4rem)] font-bold leading-[1.06] tracking-[-0.03em]"
                        >
                          {objective.name}
                        </h2>
                        <div className="mt-8 max-w-[27ch] text-[clamp(2rem,3.6vw,3.8rem)] font-medium leading-[1.18] text-foreground/95">
                          {objective.text}
                        </div>

                        {objective.notes ? (
                          <p className="mt-7 max-w-[70ch] border-l border-white/20 pl-4 text-base leading-relaxed text-foreground/65">
                            {objective.notes}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <aside className="relative flex min-w-0 flex-col border-l border-white/[0.1] bg-[#070c16] p-6">
                      <div className="mb-5 flex items-center gap-3 border-b border-white/[0.08] pb-5">
                        <div className="font-display text-sm font-semibold uppercase tracking-[0.15em]">Scored by</div>
                        <button
                          type="button"
                          aria-label="Close objective briefing"
                          onClick={() => setOpen(false)}
                          className="ml-auto flex h-11 w-11 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 overflow-y-auto">
                        {players.map((player) => {
                          const color = PLAYER_COLOR_CLASSES[playerColorOf(player.color)];
                          const scored = scoredPlayerIds.has(player.id);
                          return (
                            <button
                              key={player.id}
                              type="button"
                              aria-pressed={scored}
                              onClick={() => onToggleScore(player.id)}
                              className={cn(
                                'flex min-h-12 items-center gap-2.5 rounded-lg border px-3 text-sm font-semibold transition-[background-color,border-color,color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                scored
                                  ? 'border-primary/70 bg-primary/[0.1] text-foreground'
                                  : 'border-white/[0.14] bg-background/25 text-foreground/65 hover:border-white/25 hover:bg-accent/55 hover:text-foreground',
                              )}
                            >
                              <PlayerBadge player={player} />
                              <span className="min-w-0 flex-1 truncate text-left">{player.name}</span>
                              {scored ? <Check className={cn('h-4 w-4', color.text)} /> : null}
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-auto border-t border-white/[0.08] pt-5">
                        <Button
                          variant="outline"
                          className="h-11 border-white/[0.16] text-foreground/65 hover:text-foreground"
                          onClick={() => {
                            onUnreveal();
                            setOpen(false);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove from table
                        </Button>
                      </div>
                    </aside>
                  </m.article>
                </div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </>
  );
}
