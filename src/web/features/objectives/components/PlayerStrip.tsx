import { Crown } from 'lucide-react';
import type { Objective, ObjectiveScore } from '@domain';
import type { GamePlayer, GameState } from '@web/lib/api';
import { cn } from '@web/lib/utils';
import { PLAYER_COLOR_CLASSES, playerColorOf } from '../colors';
import { AdjustmentsPopover } from './AdjustmentsPopover';
import { SecretsPopover } from './SecretsPopover';
import { ENDGAME_ZONE } from './VpTrack';

type Adjustment = GameState['vpAdjustments'][number];

interface PlayerStripProps {
  players: GamePlayer[];
  vpByPlayer: ReadonlyMap<number, number>;
  victoryTarget: number;
  secretPool: Objective[];
  secretsByPlayer: ReadonlyMap<number, Objective[]>;
  adjustmentsByPlayer: ReadonlyMap<number, Adjustment[]>;
  scores: ObjectiveScore[];
  onToggleScore: (playerId: number, objectiveId: string) => void;
  onAddAdjustment: (playerId: number, label: string, points: number) => void;
  onRemoveAdjustment: (id: number) => void;
}

/**
 * Standings, best first: a big VP number per player plus their secrets (n/3) and bonus-VP
 * admin popovers. Players in the end-game zone glow; the winner gets the crown.
 */
export function PlayerStrip({
  players,
  vpByPlayer,
  victoryTarget,
  secretPool,
  secretsByPlayer,
  adjustmentsByPlayer,
  scores,
  onToggleScore,
  onAddAdjustment,
  onRemoveAdjustment,
}: PlayerStripProps) {
  const vpOf = (p: GamePlayer) => vpByPlayer.get(p.id) ?? 0;
  const standings = [...players].sort((a, b) => vpOf(b) - vpOf(a));

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {standings.map((player) => {
        const color = PLAYER_COLOR_CLASSES[playerColorOf(player.color)];
        const vp = vpOf(player);
        const winner = vp >= victoryTarget;
        const inZone = !winner && vp >= victoryTarget - ENDGAME_ZONE;
        return (
          <div
            key={player.id}
            className={cn(
              'rounded-xl border border-border/60 bg-card/40 p-4',
              winner &&
                'border-amber-400/80 bg-amber-400/10 shadow-[0_0_28px_-8px] shadow-amber-400/50',
              inZone && 'border-orange-400/50 shadow-[0_0_22px_-8px] shadow-orange-400/40',
            )}
          >
            <div className="mb-3 flex items-center gap-2.5">
              {winner ? (
                <Crown className="h-5 w-5 shrink-0 text-amber-400" />
              ) : (
                <span className={cn('h-4 w-4 shrink-0 rounded-full', color.dot)} />
              )}
              <span className="min-w-0 flex-1 truncate text-lg font-bold">{player.name}</span>
              <span
                className={cn(
                  'font-display text-4xl font-bold leading-none tabular-nums',
                  winner ? 'text-amber-300' : color.text,
                  inZone && 'motion-safe:animate-pulse',
                )}
              >
                {vp}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-md border border-border/50 bg-background/40">
                <div className="px-2 pt-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                  Secrets
                </div>
                <SecretsPopover
                  player={player}
                  secretPool={secretPool}
                  scored={secretsByPlayer.get(player.id) ?? []}
                  scores={scores}
                  onToggle={(objectiveId) => onToggleScore(player.id, objectiveId)}
                />
              </div>
              <div className="rounded-md border border-border/50 bg-background/40">
                <div className="px-2 pt-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                  Bonus VP
                </div>
                <AdjustmentsPopover
                  player={player}
                  adjustments={adjustmentsByPlayer.get(player.id) ?? []}
                  onAdd={(label, points) => onAddAdjustment(player.id, label, points)}
                  onRemove={onRemoveAdjustment}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
