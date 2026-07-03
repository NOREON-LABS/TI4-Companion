import { Crown, EyeOff, Medal, Trash2 } from 'lucide-react';
import type { Objective, ObjectiveScore } from '@domain';
import { Badge } from '@web/components/ui/badge';
import { Button } from '@web/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@web/components/ui/popover';
import type { GamePlayer, GameState } from '@web/lib/api';
import { cn } from '@web/lib/utils';
import { PLAYER_COLOR_CLASSES, playerColorOf } from '../colors';
import { AdjustmentsPopover } from './AdjustmentsPopover';
import { RevealObjectivePicker } from './RevealObjectivePicker';
import { SecretsPopover } from './SecretsPopover';

type Adjustment = GameState['vpAdjustments'][number];

interface ScoreBoardProps {
  players: GamePlayer[];
  /** Revealed publics resolved to objectives, grouped by stage (reveal order preserved). */
  revealedStage1: Objective[];
  revealedStage2: Objective[];
  /** Content-gated unrevealed publics per stage, for the reveal pickers. */
  candidatesStage1: Objective[];
  candidatesStage2: Objective[];
  /** Content-gated secrets for the per-player pickers. */
  secretPool: Objective[];
  scores: ObjectiveScore[];
  vpByPlayer: ReadonlyMap<number, number>;
  secretsByPlayer: ReadonlyMap<number, Objective[]>;
  adjustmentsByPlayer: ReadonlyMap<number, Adjustment[]>;
  victoryTarget: number;
  onToggleScore: (playerId: number, objectiveId: string) => void;
  onReveal: (objectiveId: string) => void;
  onUnreveal: (objectiveId: string) => void;
  onAddAdjustment: (playerId: number, label: string, points: number) => void;
  onRemoveAdjustment: (id: number) => void;
}

/**
 * The shared table: revealed publics as rows x players as columns; a tap on a cell toggles
 * that player's score. Secrets and bonus VP get one popover row each at the bottom.
 */
export function ScoreBoard({
  players,
  revealedStage1,
  revealedStage2,
  candidatesStage1,
  candidatesStage2,
  secretPool,
  scores,
  vpByPlayer,
  secretsByPlayer,
  adjustmentsByPlayer,
  victoryTarget,
  onToggleScore,
  onReveal,
  onUnreveal,
  onAddAdjustment,
  onRemoveAdjustment,
}: ScoreBoardProps) {
  const scoredBy = (playerId: number, objectiveId: string) =>
    scores.some((s) => s.playerId === playerId && s.objectiveId === objectiveId);

  const objectiveRow = (objective: Objective) => (
    <div key={objective.id} className="contents">
      <ObjectiveLabel objective={objective} onUnreveal={() => onUnreveal(objective.id)} />
      {players.map((player) => {
        const color = PLAYER_COLOR_CLASSES[playerColorOf(player.color)];
        const scored = scoredBy(player.id, objective.id);
        return (
          <button
            key={player.id}
            type="button"
            aria-label={`${player.name}: ${objective.name}`}
            aria-pressed={scored}
            onClick={() => onToggleScore(player.id, objective.id)}
            className={cn(
              'flex min-h-14 items-center justify-center rounded-md text-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              scored ? 'bg-card/80' : 'hover:bg-accent/60',
            )}
          >
            {scored ? (
              <span className={cn('font-semibold', color.text)}>✓</span>
            ) : (
              <span className="text-muted-foreground/25">○</span>
            )}
          </button>
        );
      })}
    </div>
  );

  const sectionRow = (label: string, picker: React.ReactNode) => (
    <>
      <div className="col-span-full mt-2 flex items-center gap-3 first:mt-0">
        <span className="font-display text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </span>
        <span className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
        {picker}
      </div>
    </>
  );

  return (
    <div className="overflow-x-auto overscroll-x-contain">
      <div
        className="grid items-stretch gap-x-1.5 gap-y-1"
        style={{
          gridTemplateColumns: `minmax(190px, 300px) repeat(${players.length}, minmax(84px, 1fr))`,
        }}
      >
        {/* Player header row */}
        <div />
        {players.map((player) => {
          const color = PLAYER_COLOR_CLASSES[playerColorOf(player.color)];
          const vp = vpByPlayer.get(player.id) ?? 0;
          const winner = vp >= victoryTarget;
          return (
            <div
              key={player.id}
              className={cn(
                'flex flex-col items-center gap-0.5 rounded-md border border-border/50 bg-card/40 px-1 py-2',
                winner && 'border-amber-400/70 bg-amber-400/10',
              )}
            >
              <div className="flex min-w-0 max-w-full items-center gap-1.5 px-1">
                {winner ? (
                  <Crown className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                ) : (
                  <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', color.dot)} />
                )}
                <span className="truncate text-xs font-medium">{player.name}</span>
              </div>
              <span className={cn('text-xl font-bold leading-none tabular-nums', color.text)}>
                {vp}
              </span>
            </div>
          );
        })}

        {sectionRow(
          'Stage I — 1 VP',
          <RevealObjectivePicker stage={1} candidates={candidatesStage1} onReveal={onReveal} />,
        )}
        {revealedStage1.length > 0 ? (
          revealedStage1.map(objectiveRow)
        ) : (
          <p className="col-span-full px-1 py-2 text-xs text-muted-foreground">
            No stage I objectives revealed yet.
          </p>
        )}

        {sectionRow(
          'Stage II — 2 VP',
          <RevealObjectivePicker stage={2} candidates={candidatesStage2} onReveal={onReveal} />,
        )}
        {revealedStage2.length > 0 ? (
          revealedStage2.map(objectiveRow)
        ) : (
          <p className="col-span-full px-1 py-2 text-xs text-muted-foreground">
            No stage II objectives revealed yet.
          </p>
        )}

        {sectionRow('Secrets & bonus', null)}
        <div className="flex min-h-12 items-center gap-2 px-1 text-sm text-muted-foreground">
          <EyeOff className="h-4 w-4" />
          Secret objectives
        </div>
        {players.map((player) => (
          <SecretsPopover
            key={player.id}
            player={player}
            secretPool={secretPool}
            scored={secretsByPlayer.get(player.id) ?? []}
            scores={scores}
            onToggle={(objectiveId) => onToggleScore(player.id, objectiveId)}
          />
        ))}

        <div className="flex min-h-12 items-center gap-2 px-1 text-sm text-muted-foreground">
          <Medal className="h-4 w-4" />
          Bonus VP
        </div>
        {players.map((player) => (
          <AdjustmentsPopover
            key={player.id}
            player={player}
            adjustments={adjustmentsByPlayer.get(player.id) ?? []}
            onAdd={(label, points) => onAddAdjustment(player.id, label, points)}
            onRemove={onRemoveAdjustment}
          />
        ))}
      </div>
    </div>
  );
}

/** First-column cell: objective name; tap for card text + the remove-from-table action. */
function ObjectiveLabel({ objective, onUnreveal }: { objective: Objective; onUnreveal: () => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex min-h-14 min-w-0 flex-col justify-center gap-0.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="truncate text-sm font-medium leading-tight">{objective.name}</span>
          <span className="line-clamp-1 text-[11px] leading-tight text-muted-foreground">
            {objective.text}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-0">
        <div className="flex flex-col gap-2.5 p-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold leading-tight">{objective.name}</h3>
            <Badge variant="secondary">
              {objective.points} VP · {objective.phase}
            </Badge>
          </div>
          <p className="whitespace-pre-line text-sm leading-snug">{objective.text}</p>
          {objective.notes ? (
            <p className="text-xs leading-snug text-muted-foreground">{objective.notes}</p>
          ) : null}
          <Button variant="outline" size="sm" className="self-start" onClick={onUnreveal}>
            <Trash2 className="h-4 w-4" />
            Remove from table
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
