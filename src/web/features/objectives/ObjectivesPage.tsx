import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Crown, Users } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import {
  activeEntities,
  hasReachedTarget,
  objectivesById,
  OBJECTIVES,
  playerVp,
  type Objective,
} from '@domain';
import { Button } from '@web/components/ui/button';
import { useGame } from '@web/hooks/useGameState';
import type { GameState } from '@web/lib/api';
import { MOTION_TRANSITIONS } from '@web/lib/motion';
import { PLAYER_COLOR_HEX, playerColorOf } from './colors';
import { ObjectiveCard } from './components/ObjectiveCard';
import { PlayerStrip } from './components/PlayerStrip';
import { RevealObjectivePicker } from './components/RevealObjectivePicker';
import { ScreenEffects } from './components/ScreenEffects';
import { SettingsDrawer } from './components/SettingsDrawer';
import { VictoryOverlay } from './components/VictoryOverlay';
import {
  useAddAdjustment,
  useAddPlayer,
  useRemoveAdjustment,
  useRemovePlayer,
  useRevealObjectives,
  useSetVictoryTarget,
  useToggleScore,
  useUpdatePlayer,
} from './hooks/useScoring';

/**
 * TV-first table display: the VP track and big revealed-objective cards answer "what are
 * the current objectives / who's winning?" from across the room. Scoring hides in card
 * popovers; players + victory target live in the Table setup drawer.
 */
export function ObjectivesPage() {
  const { data: game, isLoading, isError } = useGame();
  const addPlayer = useAddPlayer();
  const updatePlayer = useUpdatePlayer();
  const removePlayer = useRemovePlayer();
  const revealObjectives = useRevealObjectives();
  const toggleScore = useToggleScore();
  const addAdjustment = useAddAdjustment();
  const removeAdjustment = useRemoveAdjustment();
  const setVictoryTarget = useSetVictoryTarget();
  const [setupOpen, setSetupOpen] = useState(false);

  const view = useMemo(() => (game ? buildView(game) : null), [game]);

  // Pop the full-screen victory moment only on the transition into a winner state —
  // reloading the page mid-celebration shows banner + confetti, not the takeover again.
  const [overlayWinner, setOverlayWinner] = useState<GameState['players'][number] | null>(null);
  const previousLeaderId = useRef<number | null | undefined>(undefined);
  const leader = view?.leader ?? null;
  useEffect(() => {
    if (!view) return;
    const current = leader?.id ?? null;
    if (previousLeaderId.current === null && current !== null) setOverlayWinner(leader);
    previousLeaderId.current = current;
  }, [view, leader]);

  if (isLoading) return <CenteredNote>Loading game…</CenteredNote>;
  if (isError || !game || !view) {
    return <CenteredNote>Couldn’t load the game. Is the API running?</CenteredNote>;
  }

  const hasPlayers = game.players.length > 0;
  const onToggleScore = (playerId: number, objectiveId: string) =>
    toggleScore.mutate({ playerId, objectiveId });
  const onReveal = (id: string) => revealObjectives.mutate([...game.revealedObjectiveIds, id]);
  const onUnreveal = (id: string) =>
    revealObjectives.mutate(game.revealedObjectiveIds.filter((x) => x !== id));

  const setupControl = () => (
    <SettingsDrawer
      open={setupOpen}
      onOpenChange={setSetupOpen}
      players={game.players}
      enabledContent={game.enabledContent}
      victoryTarget={game.victoryTarget}
      onSetVictoryTarget={(target) => setVictoryTarget.mutate(target)}
      onAddPlayer={(player) => addPlayer.mutate(player)}
      onUpdatePlayer={(id, patch) => updatePlayer.mutate({ id, patch })}
      onRemovePlayer={(id) => removePlayer.mutate(id)}
    />
  );

  const stageSection = (stage: 1 | 2, revealed: Objective[], candidates: Objective[]) => (
    <section aria-labelledby={`stage-${stage}-title`}>
      <div className="mb-3 flex min-h-10 flex-wrap items-center gap-2.5">
        <h3
          id={`stage-${stage}-title`}
          className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-foreground"
        >
          Stage {stage === 1 ? 'I' : 'II'}
        </h3>
        <span className="h-px flex-1 bg-gradient-to-r from-white/25 to-transparent" />
        <RevealObjectivePicker stage={stage} candidates={candidates} onReveal={onReveal} prominent />
        {stage === 1 ? setupControl() : null}
      </div>
      {revealed.length > 0 ? (
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))' }}
        >
          {revealed.map((objective) => (
            <ObjectiveCard
              key={objective.id}
              objective={objective}
              players={game.players}
              scoredPlayerIds={view.scorersByObjective.get(objective.id) ?? EMPTY_SET}
              onToggleScore={(playerId) => onToggleScore(playerId, objective.id)}
              onUnreveal={() => onUnreveal(objective.id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex min-h-20 items-center rounded-xl border border-white/[0.14] bg-[#070d18]/90 px-5 py-4">
          <div>
            <div className="text-base font-semibold">No public objective on the table</div>
            <div className="mt-1 text-sm text-foreground/65">
              Use Reveal objective above to put one into play.
            </div>
          </div>
        </div>
      )}
    </section>
  );

  return (
    <>
      {overlayWinner ? (
        <ScreenEffects
          mode="celebration"
          progress={1}
          accentHex={PLAYER_COLOR_HEX[playerColorOf(overlayWinner.color)]}
        />
      ) : null}
      <AnimatePresence>
        {overlayWinner ? (
          <VictoryOverlay
            key={overlayWinner.id}
            winner={overlayWinner}
            victoryTarget={game.victoryTarget}
            onDismiss={() => setOverlayWinner(null)}
          />
        ) : null}
      </AnimatePresence>

      <div className="relative z-10">
        {hasPlayers ? (
          <div className="min-w-0">
              <AnimatePresence initial={false}>
                {leader ? (
                  <m.div
                    key={leader.id}
                    initial={{ opacity: 0, scale: 0.96, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={MOTION_TRANSITIONS.state}
                    className="mb-3 flex w-fit items-center gap-2 rounded-lg border border-amber-400/60 bg-amber-400/10 px-3 py-2 text-sm font-medium text-amber-300"
                  >
                    <Crown className="h-4 w-4" />
                    {leader.name} has reached {game.victoryTarget} VP!
                  </m.div>
                ) : null}
              </AnimatePresence>

              <div className="flex flex-col gap-6">
                {stageSection(1, view.revealedStage1, view.candidatesStage1)}
                {stageSection(2, view.revealedStage2, view.candidatesStage2)}
                <PlayerStrip
                  players={game.players}
                  vpByPlayer={view.vpByPlayer}
                  victoryTarget={game.victoryTarget}
                  secretPool={view.secretPool}
                  secretsByPlayer={view.secretsByPlayer}
                  adjustmentsByPlayer={view.adjustmentsByPlayer}
                  scores={game.scores}
                  onToggleScore={onToggleScore}
                  onAddAdjustment={(playerId, label, points) =>
                    addAdjustment.mutate({ playerId, label, points })
                  }
                  onRemoveAdjustment={(id) => removeAdjustment.mutate(id)}
                />
              </div>
          </div>
        ) : (
          <>
            <div className="mb-4 flex justify-end">
              {setupControl()}
            </div>
            <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 bg-card/20 p-8 text-center">
              <Users className="h-10 w-10 text-muted-foreground/40" />
              <Button onClick={() => setSetupOpen(true)}>Open table setup</Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

const EMPTY_SET: ReadonlySet<number> = new Set();

/** Resolve ids to objectives and pre-group everything the display needs. */
function buildView(game: GameState) {
  // Full unfiltered map: revealed/scored PoK objectives keep rendering + counting even if
  // the content set changes mid-game; only the pickers below are content-gated.
  const byId = objectivesById(OBJECTIVES);
  const active = activeEntities(OBJECTIVES, game.enabledContent);
  const revealedSet = new Set(game.revealedObjectiveIds);

  const revealed = game.revealedObjectiveIds
    .map((id) => byId.get(id))
    .filter((o): o is Objective => Boolean(o));
  const revealedStage1 = revealed.filter((o) => o.stage === 1);
  const revealedStage2 = revealed.filter((o) => o.stage === 2);

  const unrevealedPublics = active
    .filter((o) => o.kind === 'public' && !revealedSet.has(o.id))
    .sort((a, b) => a.name.localeCompare(b.name));
  const candidatesStage1 = unrevealedPublics.filter((o) => o.stage === 1);
  const candidatesStage2 = unrevealedPublics.filter((o) => o.stage === 2);
  const secretPool = active
    .filter((o) => o.kind === 'secret')
    .sort((a, b) => a.name.localeCompare(b.name));

  const scorersByObjective = new Map<string, Set<number>>();
  for (const score of game.scores) {
    const set = scorersByObjective.get(score.objectiveId) ?? new Set<number>();
    set.add(score.playerId);
    scorersByObjective.set(score.objectiveId, set);
  }

  const vpByPlayer = new Map<number, number>();
  const secretsByPlayer = new Map<number, Objective[]>();
  const adjustmentsByPlayer = new Map<number, GameState['vpAdjustments']>();
  for (const player of game.players) {
    vpByPlayer.set(player.id, playerVp(player.id, game.scores, game.vpAdjustments, byId));
    secretsByPlayer.set(
      player.id,
      game.scores
        .filter((s) => s.playerId === player.id)
        .map((s) => byId.get(s.objectiveId))
        .filter((o): o is Objective => o?.kind === 'secret'),
    );
    adjustmentsByPlayer.set(
      player.id,
      game.vpAdjustments.filter((a) => a.playerId === player.id),
    );
  }

  const leader =
    game.players
      .filter((p) => hasReachedTarget(vpByPlayer.get(p.id) ?? 0, game.victoryTarget))
      .sort((a, b) => (vpByPlayer.get(b.id) ?? 0) - (vpByPlayer.get(a.id) ?? 0))[0] ?? null;

  return {
    revealedStage1,
    revealedStage2,
    candidatesStage1,
    candidatesStage2,
    secretPool,
    scorersByObjective,
    vpByPlayer,
    secretsByPlayer,
    adjustmentsByPlayer,
    leader,
  };
}

function CenteredNote({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
