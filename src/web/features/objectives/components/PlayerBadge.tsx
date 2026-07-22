import type { GamePlayer } from '@web/lib/api';
import { cn } from '@web/lib/utils';
import { PLAYER_COLOR_CLASSES, playerColorOf, playerMarkerCode } from '../colors';

interface PlayerBadgeProps {
  player: GamePlayer;
  className?: string;
}

/** Shared player identity token used anywhere a compact name reference is needed. */
export function PlayerBadge({ player, className }: PlayerBadgeProps) {
  const color = PLAYER_COLOR_CLASSES[playerColorOf(player.color)];

  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex h-6 min-w-8 shrink-0 items-center justify-center rounded-[5px] border border-white/20 bg-[#050a14] px-1 font-display text-[8px] font-bold tracking-[0.02em] ring-1',
        color.text,
        color.ring,
        className,
      )}
    >
      {playerMarkerCode(player.name)}
    </span>
  );
}
