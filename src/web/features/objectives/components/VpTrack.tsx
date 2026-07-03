import { Crown } from 'lucide-react';
import type { GamePlayer } from '@web/lib/api';
import { cn } from '@web/lib/utils';
import { PLAYER_COLOR_CLASSES, playerColorOf } from '../colors';

/** Scores this close to the target count as the end game — the track heats up. */
export const ENDGAME_ZONE = 3;

/** Escalating warmth for the last cells before the target (key = target - vp). */
const HEAT: Record<number, string> = {
  3: 'border-orange-400/30 bg-orange-400/5',
  2: 'border-orange-400/45 bg-orange-400/10',
  1: 'border-orange-500/60 bg-orange-500/15',
};

interface VpTrackProps {
  players: GamePlayer[];
  vpByPlayer: ReadonlyMap<number, number>;
  victoryTarget: number;
}

/**
 * The victory point track — the TV hero. One big cell per score 0..target with the
 * players' tokens sitting on their current score, like the physical board. The final
 * stretch glows hotter as players close in on the target.
 */
export function VpTrack({ players, vpByPlayer, victoryTarget }: VpTrackProps) {
  const cells = Array.from({ length: victoryTarget + 1 }, (_, vp) => vp);
  const clamp = (vp: number) => Math.min(Math.max(vp, 0), victoryTarget);
  const playersAt = (vp: number) =>
    players.filter((p) => clamp(vpByPlayer.get(p.id) ?? 0) === vp);
  const endgame = players.some(
    (p) => (vpByPlayer.get(p.id) ?? 0) >= victoryTarget - ENDGAME_ZONE,
  );

  return (
    <div
      className={cn(
        'flex gap-1.5 rounded-xl transition-shadow duration-700 sm:gap-2',
        endgame && 'shadow-[0_0_70px_-18px] shadow-orange-500/40',
      )}
    >
      {cells.map((vp) => {
        const isTarget = vp === victoryTarget;
        const inZone = vp >= victoryTarget - ENDGAME_ZONE;
        const occupants = playersAt(vp);
        return (
          <div
            key={vp}
            className={cn(
              'flex min-h-[104px] min-w-0 flex-1 flex-col rounded-xl border px-1 py-2 sm:min-h-[128px]',
              isTarget
                ? 'border-amber-400/80 bg-amber-400/15 shadow-[0_0_24px_-6px] shadow-amber-400/50'
                : (HEAT[victoryTarget - vp] ?? 'border-border/50 bg-card/40'),
            )}
          >
            <div
              className={cn(
                'flex items-center gap-1 px-1.5 font-display text-lg font-bold tabular-nums sm:text-2xl',
                isTarget
                  ? 'text-amber-300'
                  : inZone
                    ? 'text-orange-300/90'
                    : 'text-muted-foreground',
              )}
            >
              {vp}
              {isTarget ? <Crown className="h-5 w-5 shrink-0" /> : null}
            </div>
            <div className="flex flex-1 flex-col items-center justify-center gap-1.5">
              {occupants.map((player) => {
                const color = PLAYER_COLOR_CLASSES[playerColorOf(player.color)];
                return (
                  <span
                    key={player.id}
                    title={player.name}
                    className={cn(
                      'flex max-w-full items-center gap-2 rounded-full border border-border/60 bg-background/85 py-1.5 pl-2 pr-3 text-sm font-bold shadow-sm',
                      vp > 0 && color.text,
                      // Players in the end-game zone burn bright.
                      inZone &&
                        'border-orange-400/70 shadow-[0_0_16px_-2px] shadow-orange-400/60 motion-safe:animate-pulse',
                    )}
                  >
                    <span className={cn('h-3.5 w-3.5 shrink-0 rounded-full', color.dot)} />
                    <span className="truncate">{player.name}</span>
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
