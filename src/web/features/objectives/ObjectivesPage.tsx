import { useMemo, type ReactNode } from 'react';
import { Crown, Users } from 'lucide-react';
import {
  activeEntities,
  hasReachedTarget,
  objectivesById,
  OBJECTIVES,
  playerVp,
  VICTORY_TARGETS,
  type Objective,
} from '@domain';
import { Card, CardContent, CardHeader, CardTitle } from '@web/components/ui/card';
import { useGame } from '@web/hooks/useGameState';
import type { GameState } from '@web/lib/api';
import { cn } from '@web/lib/utils';
import { PlayerRoster } from './components/PlayerRoster';
import { ScoreBoard } from './components/ScoreBoard';
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

  const view = useMemo(() => (game ? buildView(game) : null), [game]);

  if (isLoading) return <CenteredNote>Loading game…</CenteredNote>;
  if (isError || !game || !view) {
    return <CenteredNote>Couldn’t load the game. Is the API running?</CenteredNote>;
  }

  const leader = view.leader;
  const hasPlayers = game.players.length > 0;

  return (
    <>
      {/* Command strip: victory target + winner callout. */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-xs font-semibold uppercase tracking-[0.16em] text-foreground">
            Victory points
          </h2>
          <div className="flex rounded-lg border border-border/80 bg-card/60 p-0.5">
            {VICTORY_TARGETS.map((target) => (
              <button
                key={target}
                type="button"
                aria-pressed={game.victoryTarget === target}
                onClick={() => setVictoryTarget.mutate(target)}
                className={cn(
                  'rounded-md px-3.5 py-1.5 text-sm font-semibold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  game.victoryTarget === target
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {target}
              </button>
            ))}
          </div>
        </div>
        {leader ? (
          <div className="flex items-center gap-2 rounded-lg border border-amber-400/60 bg-amber-400/10 px-3 py-2 text-sm font-medium text-amber-300">
            <Crown className="h-4 w-4" />
            {leader.name} has reached {game.victoryTarget} VP!
          </div>
        ) : null}
      </div>

      {hasPlayers ? (
        <div className="mb-5 rounded-lg border border-border/70 bg-card/45 p-4 shadow-[0_18px_44px_-38px_black]">
          <ScoreBoard
            players={game.players}
            revealedStage1={view.revealedStage1}
            revealedStage2={view.revealedStage2}
            candidatesStage1={view.candidatesStage1}
            candidatesStage2={view.candidatesStage2}
            secretPool={view.secretPool}
            scores={game.scores}
            vpByPlayer={view.vpByPlayer}
            secretsByPlayer={view.secretsByPlayer}
            adjustmentsByPlayer={view.adjustmentsByPlayer}
            victoryTarget={game.victoryTarget}
            onToggleScore={(playerId, objectiveId) => toggleScore.mutate({ playerId, objectiveId })}
            onReveal={(id) => revealObjectives.mutate([...game.revealedObjectiveIds, id])}
            onUnreveal={(id) =>
              revealObjectives.mutate(game.revealedObjectiveIds.filter((x) => x !== id))
            }
            onAddAdjustment={(playerId, label, points) =>
              addAdjustment.mutate({ playerId, label, points })
            }
            onRemoveAdjustment={(id) => removeAdjustment.mutate(id)}
          />
        </div>
      ) : null}

      <Card className={cn('w-full', hasPlayers ? 'sm:max-w-md' : 'sm:max-w-lg')}>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-primary" />
            Players
            {game.players.length > 0 ? (
              <span className="ml-auto text-xs font-normal tabular-nums text-muted-foreground">
                {game.players.length}
              </span>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <PlayerRoster
            players={game.players}
            enabledContent={game.enabledContent}
            onAdd={(player) => addPlayer.mutate(player)}
            onUpdate={(id, patch) => updatePlayer.mutate({ id, patch })}
            onRemove={(id) => removePlayer.mutate(id)}
          />
        </CardContent>
      </Card>
    </>
  );
}

/** Resolve ids to objectives and pre-group everything the board needs. */
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
