import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Crown, Users } from 'lucide-react';
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
import { PLAYER_COLOR_HEX, playerColorOf } from './colors';
import { ObjectiveCard } from './components/ObjectiveCard';
import { PlayerStrip } from './components/PlayerStrip';
import { RevealObjectivePicker } from './components/RevealObjectivePicker';
import { ScreenEffects } from './components/ScreenEffects';
import { SettingsDrawer } from './components/SettingsDrawer';
import { VictoryOverlay } from './components/VictoryOverlay';
import { ENDGAME_ZONE, VpTrack } from './components/VpTrack';
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

  const stageSection = (stage: 1 | 2, revealed: Objective[], candidates: Objective[]) => (
    <section>
      <div className="mb-3 flex items-center gap-3">
        <h3 className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-foreground">
          Stage {stage === 1 ? 'I' : 'II'}
        </h3>
        <span className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
        <RevealObjectivePicker stage={stage} candidates={candidates} onReveal={onReveal} />
      </div>
      {revealed.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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
        <p className="rounded-xl border border-dashed border-border/60 bg-card/20 p-6 text-center text-sm text-muted-foreground">
          No stage {stage === 1 ? 'I' : 'II'} objectives revealed yet.
        </p>
      )}
    </section>
  );

  // Whole-screen ambience: embers once anyone enters the end-game zone, confetti for a win.
  const endgame =
    !leader &&
    game.players.some(
      (p) => (view.vpByPlayer.get(p.id) ?? 0) >= game.victoryTarget - ENDGAME_ZONE,
    );

  return (
    <>
      <ScreenEffects
        mode={leader ? 'celebration' : endgame ? 'embers' : null}
        accentHex={leader ? PLAYER_COLOR_HEX[playerColorOf(leader.color)] : undefined}
      />
      {overlayWinner ? (
        <VictoryOverlay
          winner={overlayWinner}
          victoryTarget={game.victoryTarget}
          onDismiss={() => setOverlayWinner(null)}
        />
      ) : null}

      {/* Command strip: winner callout + table setup. */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-xs font-semibold uppercase tracking-[0.16em] text-foreground">
            First to {game.victoryTarget}
          </h2>
          {leader ? (
            <div className="flex items-center gap-2 rounded-lg border border-amber-400/60 bg-amber-400/10 px-3 py-2 text-sm font-medium text-amber-300 motion-safe:animate-pulse">
              <Crown className="h-4 w-4" />
              {leader.name} has reached {game.victoryTarget} VP!
            </div>
          ) : null}
        </div>
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
      </div>

      {hasPlayers ? (
        <div className="flex flex-col gap-7">
          <VpTrack
            players={game.players}
            vpByPlayer={view.vpByPlayer}
            victoryTarget={game.victoryTarget}
          />
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
      ) : (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 bg-card/20 p-8 text-center">
          <Users className="h-10 w-10 text-muted-foreground/40" />
          <p className="max-w-sm text-sm text-muted-foreground">
            Add the players at the table to light up the victory point track.
          </p>
          <Button onClick={() => setSetupOpen(true)}>Open table setup</Button>
        </div>
      )}
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
