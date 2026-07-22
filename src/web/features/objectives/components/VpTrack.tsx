import type { GamePlayer } from '@web/lib/api';
import { LayoutGroup } from 'motion/react';
import * as m from 'motion/react-m';
import { MOTION_TRANSITIONS } from '@web/lib/motion';
import { cn } from '@web/lib/utils';
import { PLAYER_COLOR_CLASSES, playerColorOf, playerMarkerCode } from '../colors';

/** Scores this close to the target count as the end game. */
export const ENDGAME_ZONE = 3;

interface VerticalVpRailProps {
  players: GamePlayer[];
  vpByPlayer: ReadonlyMap<number, number>;
  victoryTarget: number;
}

/** A deliberately narrow, sticky VP spine; full player controls live below Stage II. */
export function VerticalVpRail({ players, vpByPlayer, victoryTarget }: VerticalVpRailProps) {
  const clampScore = (score: number) => Math.min(Math.max(score, 0), victoryTarget);
  const scoreOf = (player: GamePlayer) => clampScore(vpByPlayer.get(player.id) ?? 0);
  const leadingScore = players.reduce((highest, player) => Math.max(highest, scoreOf(player)), 0);
  const progress = victoryTarget > 0 ? Math.min(leadingScore / victoryTarget, 1) : 0;
  const inEndgame = leadingScore >= victoryTarget - ENDGAME_ZONE;
  const ticks = Array.from({ length: victoryTarget + 1 }, (_, index) => victoryTarget - index);

  return (
    <aside
      aria-label="Victory point spine"
      className={cn(
        'sticky top-3 h-[calc(100dvh-5.5rem)] min-h-[560px] max-h-[760px] rounded-lg border bg-[#050a14]/76 p-2 backdrop-blur-sm',
        inEndgame ? 'border-amber-300/40' : 'border-white/[0.14]',
      )}
    >
      <LayoutGroup id="vertical-vp-rail">
        <div className="relative h-full min-h-0">
          <div aria-hidden="true" className="absolute inset-y-2 left-[22px] w-px">
            <span className="absolute inset-0 bg-white/[0.18]" />
            <m.span
              initial={false}
              animate={{ height: `${progress * 100}%` }}
              transition={MOTION_TRANSITIONS.score}
              className={cn(
                'absolute inset-x-0 bottom-0 bg-gradient-to-t',
                inEndgame
                  ? 'from-sky-400 via-amber-300 to-amber-100 shadow-[0_0_10px_rgba(252,211,77,0.5)]'
                  : 'from-sky-500 to-cyan-300 shadow-[0_0_8px_rgba(56,189,248,0.38)]',
              )}
            />
          </div>

          <div
            className="relative grid h-full min-h-0"
            style={{
              gridTemplateRows: `repeat(${victoryTarget}, minmax(0, 1fr)) minmax(66px, 1.5fr)`,
            }}
          >
            {ticks.map((score) => {
              const playersAtScore = players
                .filter((player) => scoreOf(player) === score)
                .sort((a, b) => a.name.localeCompare(b.name));
              const isFront = score === leadingScore && leadingScore > 0;
              const isTarget = score === victoryTarget;

              return (
                <div key={score} className="relative flex min-h-0 items-center">
                  <span
                    className={cn(
                      'w-4 shrink-0 text-right font-display text-[10px] font-bold tabular-nums text-slate-400',
                      isFront && (inEndgame ? 'text-amber-300' : 'text-sky-300'),
                      isTarget && 'text-amber-300',
                    )}
                  >
                    {score}
                  </span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      'mx-1 h-px w-1 shrink-0 bg-white/[0.28]',
                      isFront && (inEndgame ? 'bg-amber-300/75' : 'bg-sky-300/65'),
                    )}
                  />
                  <div className="relative z-10 flex min-w-0 flex-1 flex-wrap items-center gap-0.5">
                    {playersAtScore.map((player) => {
                      const color = PLAYER_COLOR_CLASSES[playerColorOf(player.color)];
                      return (
                        <m.span
                          layout
                          layoutId={`vp-player-${player.id}`}
                          key={player.id}
                          role="img"
                          aria-label={`${player.name}, ${score} victory points`}
                          title={`${player.name} — ${score} VP`}
                          transition={MOTION_TRANSITIONS.score}
                          className={cn(
                            'flex h-5 min-w-5 shrink-0 items-center justify-center rounded-[4px] border border-white/20 bg-[#070d18] px-0.5 font-display text-[7px] font-bold leading-none tracking-[-0.02em] shadow-sm ring-1',
                            color.text,
                            color.ring,
                            score >= victoryTarget && 'ring-2 ring-amber-200/90',
                          )}
                        >
                          {playerMarkerCode(player.name)}
                        </m.span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </LayoutGroup>
    </aside>
  );
}
