import { Trash2 } from 'lucide-react';
import type { Objective } from '@domain';
import { Button } from '@web/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@web/components/ui/popover';
import type { GamePlayer } from '@web/lib/api';
import { cn } from '@web/lib/utils';
import { PLAYER_COLOR_CLASSES, playerColorOf } from '../colors';

/** Physical card accents: stage I decks are amber, stage II decks are blue. */
const STAGE_ACCENT = {
  1: { border: 'border-amber-400/50', label: 'text-amber-300', chip: 'bg-amber-400/10' },
  2: { border: 'border-sky-400/50', label: 'text-sky-300', chip: 'bg-sky-400/10' },
} as const;

interface ObjectiveCardProps {
  objective: Objective;
  players: GamePlayer[];
  scoredPlayerIds: ReadonlySet<number>;
  onToggleScore: (playerId: number) => void;
  onUnreveal: () => void;
}

/**
 * A revealed public objective as a big TV-readable card. The card itself is display-first;
 * tapping it opens the admin popover (who scored it + remove from table).
 */
export function ObjectiveCard({
  objective,
  players,
  scoredPlayerIds,
  onToggleScore,
  onUnreveal,
}: ObjectiveCardProps) {
  const stage = objective.stage === 2 ? 2 : 1;
  const accent = STAGE_ACCENT[stage];
  const scorers = players.filter((p) => scoredPlayerIds.has(p.id));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex min-h-[210px] flex-col gap-2.5 rounded-2xl border-2 bg-card/50 p-5 text-left shadow-[0_18px_44px_-38px_black] transition-colors hover:bg-card/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            accent.border,
          )}
        >
          <div className="flex items-center justify-between gap-2">
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

          <h3 className="font-display text-2xl font-bold leading-tight">{objective.name}</h3>
          <p className="text-[15px] leading-snug text-foreground/85">{objective.text}</p>

          <div className="mt-auto flex min-h-8 flex-wrap items-center gap-2 pt-1.5">
            {scorers.map((player) => {
              const color = PLAYER_COLOR_CLASSES[playerColorOf(player.color)];
              return (
                <span
                  key={player.id}
                  className={cn(
                    'flex items-center gap-2 rounded-full border border-border/60 bg-background/70 py-1 pl-2 pr-2.5 text-sm font-bold',
                    color.text,
                  )}
                >
                  <span className={cn('h-3 w-3 rounded-full', color.dot)} />
                  {player.name}
                </span>
              );
            })}
          </div>
        </button>
      </PopoverTrigger>

      <PopoverContent align="center" className="w-[300px] p-0">
        <div className="border-b border-border/60 px-3 py-2.5 text-sm font-semibold">
          {objective.name} — scored by
        </div>
        <div className="flex flex-col gap-1 p-2">
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
                  'flex min-h-11 items-center gap-2.5 rounded-md px-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  scored ? 'bg-card' : 'hover:bg-accent/60',
                )}
              >
                <span className={cn('h-3 w-3 shrink-0 rounded-full', color.dot)} />
                <span className="min-w-0 flex-1 truncate text-left">{player.name}</span>
                <span className={cn('text-base', scored ? color.text : 'text-muted-foreground/30')}>
                  {scored ? '✓' : '○'}
                </span>
              </button>
            );
          })}
        </div>
        {objective.notes ? (
          <p className="px-3 pb-2 text-xs leading-snug text-muted-foreground">{objective.notes}</p>
        ) : null}
        <div className="border-t border-border/60 p-2">
          <Button variant="outline" size="sm" onClick={onUnreveal}>
            <Trash2 className="h-4 w-4" />
            Remove from table
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
