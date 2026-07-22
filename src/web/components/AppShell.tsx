import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import { useLocation, useOutlet } from 'react-router-dom';
import { objectivesById, OBJECTIVES, playerVp } from '@domain';
import { TabNav } from '@web/components/TabNav';
import { PLAYER_COLOR_HEX, playerColorOf } from '@web/features/objectives/colors';
import {
  ScreenEffects,
  type EffectMode,
} from '@web/features/objectives/components/ScreenEffects';
import { useGame } from '@web/hooks/useGameState';
import { MOTION_TRANSITIONS } from '@web/lib/motion';

const OBJECTIVE_MAP = objectivesById(OBJECTIVES);

/** App frame: the active tool's tab reads as the title; other tools sit beside it. */
export function AppShell() {
  const location = useLocation();
  const outlet = useOutlet();
  const { data: game } = useGame();

  let leadingVp = 0;
  let leadingPlayer = game?.players[0];
  for (const player of game?.players ?? []) {
    const vp = playerVp(player.id, game?.scores ?? [], game?.vpAdjustments ?? [], OBJECTIVE_MAP);
    if (vp > leadingVp) {
      leadingVp = vp;
      leadingPlayer = player;
    }
  }

  const victoryTarget = game?.victoryTarget ?? 10;
  const remainingVp = victoryTarget - leadingVp;
  const progress = victoryTarget > 0 ? Math.min(Math.max(leadingVp / victoryTarget, 0), 1) : 0;
  const atmosphereMode: EffectMode =
    remainingVp <= 1 ? 'brink' : remainingVp <= 3 ? 'ascent' : 'ambient';
  const showObjectiveProgression = location.pathname.startsWith('/objectives');

  return (
    <>
      <ScreenEffects
        mode={atmosphereMode}
        progress={progress}
        accentHex={leadingPlayer ? PLAYER_COLOR_HEX[playerColorOf(leadingPlayer.color)] : undefined}
        showProgression={showObjectiveProgression}
      />
      <div className="relative z-10 mx-auto w-full min-w-0 max-w-[1720px] overflow-x-clip px-3 py-3 sm:px-5 sm:py-5 lg:px-6 xl:px-8">
        <header className="relative z-20 mb-4 sm:mb-6">
          <TabNav />
        </header>
        <AnimatePresence mode="popLayout" initial={false}>
          <m.div
            key={location.pathname}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={MOTION_TRANSITIONS.route}
            className="w-full min-w-0"
          >
            {outlet}
          </m.div>
        </AnimatePresence>
      </div>
    </>
  );
}
