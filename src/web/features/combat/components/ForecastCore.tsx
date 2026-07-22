import { Activity, Equal, Shield, Swords } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import type { CombatResult } from '@domain';
import { MOTION_TRANSITIONS } from '@web/lib/motion';

interface ForecastCoreProps {
  result: CombatResult | null;
  analyzing: boolean;
}

function Percent({ value, compact = false }: { value: number; compact?: boolean }) {
  return (
    <span
      className={compact
        ? 'relative inline-grid w-[4.4ch] place-items-center overflow-hidden tabular-nums'
        : 'relative inline-grid w-[4.8ch] place-items-center overflow-hidden tabular-nums'}
    >
      <AnimatePresence initial={false} mode="sync">
        <m.span
          key={value}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={MOTION_TRANSITIONS.score}
          className="col-start-1 row-start-1"
        >
          {value.toFixed(1)}
        </m.span>
      </AnimatePresence>
    </span>
  );
}

export function ForecastCore({ result, analyzing }: ForecastCoreProps) {
  const attacker = result?.attackerWin ?? 0;
  const draw = result?.draw ?? 100;
  const defender = result?.defenderWin ?? 0;
  const dominant = attacker >= defender ? attacker : defender;
  const isAttacker = attacker >= defender;
  const ring = `conic-gradient(#38bdf8 0 ${attacker}%, rgba(255,255,255,.22) ${attacker}% ${attacker + draw}%, #fb923c ${attacker + draw}% 100%)`;

  return (
    <section
      aria-label="Combat forecast"
      aria-live="polite"
      className="relative flex min-w-0 flex-col items-center justify-center overflow-hidden border-x border-white/[0.1] px-4 py-4 text-center"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(56,189,248,0.11),transparent_42%)]" />
      <div className="relative mb-3 flex items-center gap-2 font-display text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/65">
        <Activity className="h-3.5 w-3.5 text-primary" />
        Live forecast
      </div>

      <div className="relative flex h-44 w-44 items-center justify-center">
        <m.div
          aria-hidden="true"
          animate={{ rotate: 360 }}
          transition={{ duration: 18, ease: 'linear', repeat: Infinity }}
          className="absolute inset-0 rounded-full border border-dashed border-white/[0.14]"
        />
        <m.div
          key={`${attacker}-${draw}-${defender}`}
          initial={{ opacity: 0.35, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={MOTION_TRANSITIONS.state}
          className="absolute inset-3 rounded-full p-[2px] shadow-[0_0_42px_-18px_rgba(56,189,248,0.9)]"
          style={{ background: ring }}
        >
          <div className="h-full w-full rounded-full bg-[#070c16]" />
        </m.div>
        <div className="relative z-10">
          <div className={`mx-auto flex max-w-[132px] justify-center overflow-hidden font-display font-light leading-none tracking-[-0.055em] text-foreground ${dominant >= 100 ? 'text-[30px]' : 'text-[36px]'}`}>
            {result ? <Percent value={dominant} /> : '—'}
          </div>
          <div className="mt-2 font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground/60">
            {result ? (isAttacker ? 'Attacker win chance' : 'Defender win chance') : 'Acquiring'}
          </div>
        </div>
      </div>

      <div className="relative mt-2 grid w-full grid-cols-3 gap-1 border-y border-white/[0.1] py-3">
        <div>
          <Swords className="mx-auto mb-1 h-3.5 w-3.5 text-sky-300" />
          <div className="font-display text-base text-sky-200">
            <Percent value={attacker} compact /><span className="ml-0.5 font-sans text-[10px]">%</span>
          </div>
          <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-foreground/50">You</div>
        </div>
        <div className="border-x border-white/[0.08]">
          <Equal className="mx-auto mb-1 h-3.5 w-3.5 text-foreground/45" />
          <div className="font-display text-base text-foreground/75">
            <Percent value={draw} compact /><span className="ml-0.5 font-sans text-[10px]">%</span>
          </div>
          <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-foreground/50">Draw</div>
        </div>
        <div>
          <Shield className="mx-auto mb-1 h-3.5 w-3.5 text-orange-300" />
          <div className="font-display text-base text-orange-200">
            <Percent value={defender} compact /><span className="ml-0.5 font-sans text-[10px]">%</span>
          </div>
          <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-foreground/50">Them</div>
        </div>
      </div>

      <div className="relative mt-3 grid w-full grid-cols-2 gap-3 text-left">
        <div>
          <div className="text-[9px] font-semibold uppercase tracking-[0.15em] text-foreground/45">Likely if you win</div>
          <div className="mt-1 line-clamp-2 text-xs leading-4 text-foreground/75">
            {result?.attackerLikelySurvivors ?? '—'}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[9px] font-semibold uppercase tracking-[0.15em] text-foreground/45">Likely if they win</div>
          <div className="mt-1 line-clamp-2 text-xs leading-4 text-foreground/75">
            {result?.defenderLikelySurvivors ?? '—'}
          </div>
        </div>
      </div>

      <div className="relative mt-4 grid w-full grid-cols-2 gap-3 border-t border-white/[0.08] pt-3 text-left">
        <div>
          <div className="text-[9px] font-semibold uppercase tracking-[0.15em] text-foreground/45">Your expected loss</div>
          <div className="mt-1 font-display text-lg tabular-nums text-sky-200">
            {result?.attackerExpectedLoss.toFixed(1) ?? '—'}<span className="ml-1 text-[10px] text-foreground/45">RES</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[9px] font-semibold uppercase tracking-[0.15em] text-foreground/45">Their expected loss</div>
          <div className="mt-1 font-display text-lg tabular-nums text-orange-200">
            {result?.defenderExpectedLoss.toFixed(1) ?? '—'}<span className="ml-1 text-[10px] text-foreground/45">RES</span>
          </div>
        </div>
      </div>

      <div className="relative mt-auto pt-4 text-[10px] font-medium uppercase tracking-[0.14em] text-foreground/45">
        {result ? `${result.averageRounds} avg rounds` : 'Preparing simulation'}
        {analyzing ? <span className="ml-2 text-primary">Refining</span> : null}
      </div>
    </section>
  );
}
