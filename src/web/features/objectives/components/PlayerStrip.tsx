import { Crown } from 'lucide-react';
import type { Objective, ObjectiveScore } from '@domain';
import type { GamePlayer, GameState } from '@web/lib/api';
import { cn } from '@web/lib/utils';
import { PLAYER_COLOR_CLASSES, playerColorOf } from '../colors';
import { AdjustmentsPopover } from './AdjustmentsPopover';
import { PlayerBadge } from './PlayerBadge';
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

/** A compact standings instrument. One shared surface replaces the previous card mosaic. */
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
  const standings = [...players].sort((a, b) => vpOf(b) - vpOf(a) || a.name.localeCompare(b.name));
  const scoreCounts = new Map<number, number>();
  for (const player of standings) scoreCounts.set(vpOf(player), (scoreCounts.get(vpOf(player)) ?? 0) + 1);
  let previousVp: number | null = null;
  let previousRank = 0;
  const rankedStandings = standings.map((player, index) => {
    const vp = vpOf(player);
    const rank = previousVp === vp ? previousRank : index + 1;
    previousVp = vp;
    previousRank = rank;
    return { player, vp, rank, tied: (scoreCounts.get(vp) ?? 0) > 1 };
  });
  const columnCount = Math.max(
    1,
    Math.min(
      5,
      rankedStandings.length <= 5
        ? rankedStandings.length
        : Math.ceil(rankedStandings.length / 2),
    ),
  );

  return (
    <section aria-labelledby="standings-title">
      <div className="mb-3 flex items-center gap-3">
        <h2
          id="standings-title"
          className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-foreground"
        >
          Standings
        </h2>
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground/60">
          VP order
        </span>
        <span className="h-px flex-1 bg-gradient-to-r from-white/25 to-transparent" />
      </div>
      <div
        className="grid gap-px overflow-hidden rounded-xl border border-white/[0.14] bg-white/[0.12]"
        style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
      >
        {rankedStandings.map(({ player, vp, rank, tied }) => {
          const color = PLAYER_COLOR_CLASSES[playerColorOf(player.color)];
          const winner = vp >= victoryTarget;
          const inZone = !winner && vp >= victoryTarget - ENDGAME_ZONE;
          return (
          <article
            key={player.id}
            className={cn(
              'relative bg-[#070d18]/95 p-3.5',
              winner && 'bg-amber-400/[0.09]',
              inZone && 'bg-orange-400/[0.045]',
            )}
          >
            {winner || inZone ? (
              <span
                aria-hidden="true"
                className={cn(
                  'absolute inset-x-0 top-0 h-0.5',
                  winner ? 'bg-amber-300' : 'bg-orange-400/70',
                )}
              />
            ) : null}
            <div className="mb-3 flex items-center gap-2">
              <span className="w-6 shrink-0 font-display text-[10px] font-bold tabular-nums text-foreground/55">
                {tied ? `T${rank}` : `#${rank}`}
              </span>
              <PlayerBadge player={player} />
              <span className="min-w-0 flex-1 truncate text-[17px] font-bold leading-tight">
                {player.name}
              </span>
              {winner ? <Crown className="h-4 w-4 shrink-0 text-amber-300" /> : null}
              <span
                className={cn(
                  'font-display text-4xl font-bold leading-none tabular-nums',
                  winner ? 'text-amber-300' : color.text,
                )}
              >
                {vp}
              </span>
            </div>
            <div className="grid grid-cols-2 divide-x divide-white/[0.12] border-t border-white/[0.12]">
              <div>
                <div className="px-2 pt-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground/65">
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
              <div>
                <div className="px-2 pt-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground/65">
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
          </article>
        );
      })}
      </div>
    </section>
  );
}
