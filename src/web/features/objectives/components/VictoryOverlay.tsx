import { Crown } from 'lucide-react';
import type { GamePlayer } from '@web/lib/api';
import { cn } from '@web/lib/utils';
import { PLAYER_COLOR_CLASSES, playerColorOf } from '../colors';

interface VictoryOverlayProps {
  winner: GamePlayer;
  victoryTarget: number;
  onDismiss: () => void;
}

/**
 * Full-screen victory moment, shown once when a player first reaches the target (the
 * confetti layer keeps running behind and after it). Tap anywhere to dismiss.
 */
export function VictoryOverlay({ winner, victoryTarget, onDismiss }: VictoryOverlayProps) {
  const color = PLAYER_COLOR_CLASSES[playerColorOf(winner.color)];
  return (
    <button
      type="button"
      aria-label="Dismiss victory announcement"
      onClick={onDismiss}
      className="fixed inset-0 z-[60] flex cursor-pointer flex-col items-center justify-center gap-5 bg-background/85 px-6 text-center backdrop-blur-sm motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500"
    >
      <Crown className="h-24 w-24 text-amber-400 drop-shadow-[0_0_30px_rgba(251,191,36,0.6)] motion-safe:animate-bounce" />
      <div className={cn('font-display text-6xl font-bold leading-tight sm:text-7xl', color.text)}>
        {winner.name}
      </div>
      <div className="font-display text-2xl font-semibold uppercase tracking-[0.2em] text-amber-300">
        claims the galactic throne
      </div>
      <div className="text-sm text-muted-foreground">
        First to {victoryTarget} victory points · tap anywhere to continue
      </div>
    </button>
  );
}
