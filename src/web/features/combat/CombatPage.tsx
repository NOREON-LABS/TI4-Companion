import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowLeftRight, RotateCcw } from 'lucide-react';
import * as m from 'motion/react-m';
import {
  activeEntities,
  EMPTY_COMBAT_MODIFIERS,
  FACTIONS,
  upgradesFromTechs,
  type CombatForce,
  type CombatMode,
  type CombatResult,
  type CombatScenario,
} from '@domain';
import { useGame } from '@web/hooks/useGameState';
import { MOTION_TRANSITIONS } from '@web/lib/motion';
import { cn } from '@web/lib/utils';
import { CombatModifiersDrawer } from './components/CombatModifiersDrawer';
import { ForceBuilder } from './components/ForceBuilder';
import { ForecastCore } from './components/ForecastCore';

interface CombatWorkerResponse {
  readonly requestId: number;
  readonly result: CombatResult;
  readonly complete: boolean;
}

const DEFAULT_ATTACKER_UNITS: CombatForce['units'] = {
  dreadnought: 1,
  carrier: 1,
  cruiser: 1,
  fighter: 3,
  mech: 1,
  infantry: 3,
};

const DEFAULT_DEFENDER_UNITS: CombatForce['units'] = {
  dreadnought: 1,
  carrier: 1,
  destroyer: 1,
  fighter: 3,
  mech: 1,
  infantry: 3,
};

export function CombatPage() {
  const { data: game, isLoading, isError } = useGame();
  if (isLoading) return <CenteredNote>Loading combat systems…</CenteredNote>;
  if (isError || !game) return <CenteredNote>Couldn’t load the game. Is the API running?</CenteredNote>;

  const factions = activeEntities(FACTIONS, game.enabledContent);
  const ownFactionId = game.factionId ?? factions.find((faction) => faction.id === 'sol')?.id ?? factions[0]?.id ?? 'sol';
  const opponentFactionId =
    game.players.find((player) => player.factionId && player.factionId !== ownFactionId)?.factionId ??
    factions.find((faction) => faction.id !== ownFactionId)?.id ??
    ownFactionId;

  return (
    <CombatWorkspace
      factions={factions}
      initialAttacker={{
        factionId: ownFactionId,
        units: DEFAULT_ATTACKER_UNITS,
        upgrades: upgradesFromTechs(ownFactionId, game.ownedTechIds),
        modifiers: EMPTY_COMBAT_MODIFIERS,
      }}
      initialDefender={{
        factionId: opponentFactionId,
        units: DEFAULT_DEFENDER_UNITS,
        upgrades: [],
        modifiers: EMPTY_COMBAT_MODIFIERS,
      }}
    />
  );
}

interface CombatWorkspaceProps {
  factions: ReturnType<typeof activeEntities<typeof FACTIONS[number]>>;
  initialAttacker: CombatForce;
  initialDefender: CombatForce;
}

function CombatWorkspace({ factions, initialAttacker, initialDefender }: CombatWorkspaceProps) {
  const [mode, setMode] = useState<CombatMode>('space');
  const [attacker, setAttacker] = useState(initialAttacker);
  const [defender, setDefender] = useState(initialDefender);
  const [result, setResult] = useState<CombatResult | null>(null);
  const [analyzing, setAnalyzing] = useState(true);
  const [modifiersOpen, setModifiersOpen] = useState(false);
  const requestId = useRef(0);

  const scenario = useMemo<CombatScenario>(() => ({ mode, attacker, defender }), [mode, attacker, defender]);

  useEffect(() => {
    const currentRequest = ++requestId.current;
    setAnalyzing(true);
    const delay = window.setTimeout(() => {
      const worker = new Worker(new URL('./combat.worker.ts', import.meta.url), { type: 'module' });
      worker.onmessage = ({ data }: MessageEvent<CombatWorkerResponse>) => {
        if (data.requestId !== requestId.current) return;
        setResult(data.result);
        setAnalyzing(!data.complete);
        if (data.complete) worker.terminate();
      };
      worker.postMessage({ requestId: currentRequest, scenario });
      activeWorker = worker;
    }, 90);
    let activeWorker: Worker | null = null;
    return () => {
      window.clearTimeout(delay);
      activeWorker?.terminate();
    };
  }, [scenario]);

  const clearForces = () => {
    setAttacker((force) => ({ ...force, units: {} }));
    setDefender((force) => ({ ...force, units: {} }));
  };
  const swapForces = () => {
    setAttacker(defender);
    setDefender(attacker);
  };

  return (
    <div className="relative z-10 min-w-0">
      <div className="mb-3 flex min-h-11 items-center gap-2 border-b border-white/[0.12] pb-3">
        <h1 className="mr-auto font-display text-sm font-semibold uppercase tracking-[0.18em] text-foreground">
          Combat forecast
        </h1>
        <div className="flex rounded-md border border-border/80 bg-black/15 p-0.5" aria-label="Combat type">
          {(['space', 'ground'] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              onClick={() => setMode(value)}
              className={cn(
                'relative h-9 min-w-20 rounded px-3 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                mode === value ? 'text-primary-foreground' : 'text-foreground/55 hover:text-foreground',
              )}
            >
              {mode === value ? (
                <m.span
                  layoutId="combat-mode-selection"
                  transition={MOTION_TRANSITIONS.state}
                  className="absolute inset-0 rounded bg-primary"
                />
              ) : null}
              <span className="relative z-10">{value}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={swapForces}
          className="flex h-10 items-center gap-2 rounded-md border border-border/80 px-3 text-xs font-semibold text-foreground/70 transition-colors hover:border-foreground/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeftRight className="h-3.5 w-3.5" />
          Swap
        </button>
        <button
          type="button"
          onClick={clearForces}
          className="flex h-10 items-center gap-2 rounded-md border border-border/80 px-3 text-xs font-semibold text-foreground/70 transition-colors hover:border-foreground/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Clear
        </button>
      </div>

      <main className="grid h-[min(590px,calc(100dvh-10.25rem))] min-h-[520px] grid-cols-[minmax(250px,1fr)_minmax(260px,0.76fr)_minmax(250px,1fr)] overflow-hidden rounded-xl border border-white/[0.14] bg-[#070d18]/75 shadow-[0_24px_80px_-55px_black] backdrop-blur-[2px]">
        <ForceBuilder
          side="attacker"
          title="Your force"
          force={attacker}
          mode={mode}
          factions={factions}
          onChange={setAttacker}
        />
        <ForecastCore result={result} analyzing={analyzing} />
        <ForceBuilder
          side="defender"
          title="Opposing force"
          force={defender}
          mode={mode}
          factions={factions}
          onChange={setDefender}
        />
      </main>

      <CombatModifiersDrawer
        open={modifiersOpen}
        onOpenChange={setModifiersOpen}
        mode={mode}
        attacker={attacker}
        defender={defender}
        onAttackerChange={setAttacker}
        onDefenderChange={setDefender}
      />
    </div>
  );
}

function CenteredNote({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
