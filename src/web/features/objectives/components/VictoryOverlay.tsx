import { Crown } from 'lucide-react';
import * as m from 'motion/react-m';
import type { GamePlayer } from '@web/lib/api';
import { PLAYER_COLOR_HEX, playerColorOf } from '../colors';

interface VictoryOverlayProps {
  winner: GamePlayer;
  victoryTarget: number;
  onDismiss: () => void;
}

/** A ceremonial, full-canvas endgame sequence. Tap the canvas or the explicit action to dismiss. */
export function VictoryOverlay({ winner, victoryTarget, onDismiss }: VictoryOverlayProps) {
  const winnerHex = PLAYER_COLOR_HEX[playerColorOf(winner.color)];

  return (
    <m.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="victory-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.015 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="fixed inset-0 z-[80] isolate overflow-hidden bg-[#02050d]/80 text-center backdrop-blur-[3px]"
    >
      <button
        type="button"
        autoFocus
        aria-label="Dismiss victory announcement"
        onClick={onDismiss}
        className="absolute inset-0 z-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-300"
      />

      <m.div
        aria-hidden="true"
        initial={{ opacity: 0.95, scale: 0.35, x: '-50%', y: '-50%' }}
        animate={{ opacity: 0, scale: 2.6, x: '-50%', y: '-50%' }}
        transition={{ duration: 1.45, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-none absolute left-1/2 top-1/2 h-[42vmin] w-[42vmin] rounded-full bg-amber-200/65 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 48%, ${winnerHex}2e 0%, ${winnerHex}0d 24%, transparent 50%), radial-gradient(circle at 50% 54%, rgba(245, 158, 11, 0.18), transparent 42%), linear-gradient(to bottom, rgba(2,5,13,0.2), rgba(2,5,13,0.92))`,
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[140vmax] w-[140vmax] -translate-x-1/2 -translate-y-1/2 opacity-30 [mask-image:radial-gradient(circle,black_0%,black_18%,transparent_58%)]"
      >
        <m.div
          animate={{ rotate: 360 }}
          transition={{ duration: 70, repeat: Infinity, ease: 'linear' }}
          className="h-full w-full"
          style={{
            backgroundImage:
              'repeating-conic-gradient(from 0deg, transparent 0deg 18deg, rgba(251,191,36,0.16) 19deg, transparent 21deg 43deg, rgba(125,211,252,0.1) 44deg, transparent 46deg 72deg)',
          }}
        />
      </div>
      <m.div
        aria-hidden="true"
        initial={{ scale: 0.2, opacity: 0.8, x: '-50%', y: '-50%' }}
        animate={{ scale: 2.2, opacity: 0, x: '-50%', y: '-50%' }}
        transition={{ duration: 1.7, delay: 0.08, ease: 'easeOut' }}
        className="pointer-events-none absolute left-1/2 top-1/2 h-[28vmin] w-[28vmin] rounded-full border border-amber-200/70"
      />
      <m.div
        aria-hidden="true"
        initial={{ scale: 0.25, opacity: 0.58, x: '-50%', y: '-50%' }}
        animate={{ scale: 2.75, opacity: 0, x: '-50%', y: '-50%' }}
        transition={{ duration: 2.1, delay: 0.22, ease: 'easeOut' }}
        className="pointer-events-none absolute left-1/2 top-1/2 h-[34vmin] w-[34vmin] rounded-full border border-sky-300/45"
      />

      <div className="pointer-events-none relative z-10 flex h-[100dvh] flex-col items-center justify-center gap-[clamp(0.3rem,1.25vh,0.8rem)] overflow-hidden px-5 py-[clamp(1rem,3vh,2.5rem)] sm:px-10">
        <m.div
          initial={{ opacity: 0, scale: 0.25, rotate: -22 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 250, damping: 19, mass: 1, delay: 0.28 }}
          className="relative flex h-[clamp(4.5rem,17vh,8rem)] w-[clamp(4.5rem,17vh,8rem)] shrink-0 items-center justify-center"
        >
          <m.div
            aria-hidden="true"
            animate={{ rotate: 360 }}
            transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-full border border-dashed border-amber-200/40"
          />
          <div
            className="absolute inset-[14%] rounded-full border border-amber-200/35 bg-[#07101f]/95 shadow-[0_0_50px_-12px_rgba(251,191,36,0.88)]"
            style={{ boxShadow: `0 0 54px -10px ${winnerHex}aa, inset 0 0 28px ${winnerHex}1f` }}
          />
          <Crown className="relative h-[44%] w-[44%] text-amber-300 drop-shadow-[0_0_18px_rgba(251,191,36,0.9)]" />
        </m.div>

        <m.div
          initial={{ opacity: 0, letterSpacing: '0.1em' }}
          animate={{ opacity: 1, letterSpacing: '0.42em' }}
          transition={{ duration: 0.75, delay: 0.48, ease: [0.16, 1, 0.3, 1] }}
          className="pl-[0.42em] font-display text-[clamp(0.65rem,1.7vh,0.9rem)] font-bold uppercase text-amber-200"
        >
          Galactic victory
        </m.div>

        <m.h1
          id="victory-title"
          initial={{ opacity: 0, scale: 0.84, y: 28 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 190, damping: 22, mass: 1, delay: 0.58 }}
          className="max-w-[92vw] bg-clip-text font-display font-bold leading-[0.84] tracking-[-0.055em] text-transparent [overflow-wrap:anywhere]"
          style={{
            fontSize: 'clamp(3.5rem, min(15vw, 18vh), 10rem)',
            backgroundImage: `linear-gradient(180deg, #ffffff 0%, ${winnerHex} 48%, ${winnerHex}bb 100%)`,
            filter: `drop-shadow(0 0 34px ${winnerHex}78)`,
          }}
        >
          {winner.name}
        </m.h1>

        <m.div
          initial={{ opacity: 0, scaleX: 0.2 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.65, delay: 0.86, ease: [0.16, 1, 0.3, 1] }}
          className="flex w-[min(560px,78vw)] items-center gap-3 py-[clamp(0.15rem,0.8vh,0.45rem)]"
        >
          <span className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-300/70 to-amber-200" />
          <Crown className="h-4 w-4 shrink-0 text-amber-300" />
          <span className="h-px flex-1 bg-gradient-to-l from-transparent via-amber-300/70 to-amber-200" />
        </m.div>

        <m.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.94, ease: 'easeOut' }}
          className="font-display text-[clamp(0.9rem,2.5vh,1.25rem)] font-semibold uppercase tracking-[0.16em] text-slate-100"
        >
          Claims the Imperial Throne
        </m.p>
        <m.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 1.08 }}
          className="text-[clamp(0.7rem,1.8vh,0.875rem)] text-slate-400"
        >
          {victoryTarget} victory points · the galaxy has a new ruler
        </m.p>

        <m.button
          type="button"
          onClick={onDismiss}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 1.22, ease: 'easeOut' }}
          whileTap={{ scale: 0.97 }}
          className="pointer-events-auto mt-[clamp(0.2rem,1vh,0.7rem)] rounded-full border border-amber-200/35 bg-amber-200/[0.08] px-5 py-2.5 font-display text-[clamp(0.62rem,1.6vh,0.75rem)] font-semibold uppercase tracking-[0.2em] text-amber-100 backdrop-blur transition-colors hover:bg-amber-200/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
        >
          Return to the command table
        </m.button>
      </div>
    </m.div>
  );
}
