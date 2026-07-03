import { Settings2, Users, X } from 'lucide-react';
import { VICTORY_TARGETS, type EnabledContent } from '@domain';
import type { GamePlayer, PlayerInput } from '@web/lib/api';
import { cn } from '@web/lib/utils';
import { PlayerRoster } from './PlayerRoster';

interface SettingsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  players: GamePlayer[];
  enabledContent: EnabledContent;
  victoryTarget: number;
  onSetVictoryTarget: (target: 10 | 14) => void;
  onAddPlayer: (player: PlayerInput) => void;
  onUpdatePlayer: (id: number, patch: Partial<PlayerInput>) => void;
  onRemovePlayer: (id: number) => void;
}

/**
 * Table config lives off-screen so the main page stays a pure display: a gear button
 * toggles a fixed drawer (same overlay pattern as the tech tracker's setup rail) with
 * the victory target and the player roster.
 */
export function SettingsDrawer({
  open,
  onOpenChange,
  players,
  enabledContent,
  victoryTarget,
  onSetVictoryTarget,
  onAddPlayer,
  onUpdatePlayer,
  onRemovePlayer,
}: SettingsDrawerProps) {
  return (
    <>
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-expanded={open}
        aria-label="Table settings"
        className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-card/60 px-2.5 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Settings2 className="h-4 w-4" />
        Table setup
      </button>

      <aside
        className={cn(
          'fixed bottom-4 right-0 top-[72px] z-40 flex w-[360px] max-w-[92vw] flex-col gap-4 overflow-y-auto rounded-l-xl border border-r-0 border-border/70 bg-background/95 p-4 shadow-2xl backdrop-blur transition-transform duration-300',
          open ? 'translate-x-0' : 'translate-x-[400px]',
        )}
      >
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Table setup</h3>
          <button
            type="button"
            aria-label="Close settings"
            onClick={() => onOpenChange(false)}
            className="ml-auto rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div>
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Victory points to win
          </div>
          <div className="flex w-fit rounded-lg border border-border/80 bg-card/60 p-0.5">
            {VICTORY_TARGETS.map((target) => (
              <button
                key={target}
                type="button"
                aria-pressed={victoryTarget === target}
                onClick={() => onSetVictoryTarget(target)}
                className={cn(
                  'rounded-md px-4 py-2 text-sm font-semibold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  victoryTarget === target
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {target}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            Players
            {players.length > 0 ? <span className="tabular-nums">· {players.length}</span> : null}
          </div>
          <PlayerRoster
            players={players}
            enabledContent={enabledContent}
            onAdd={onAddPlayer}
            onUpdate={onUpdatePlayer}
            onRemove={onRemovePlayer}
          />
        </div>
      </aside>
    </>
  );
}
