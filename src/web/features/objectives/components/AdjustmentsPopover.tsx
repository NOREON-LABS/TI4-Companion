import { useState, type FormEvent } from 'react';
import { Medal, Minus, Plus, X } from 'lucide-react';
import { Button } from '@web/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@web/components/ui/popover';
import type { GamePlayer, GameState } from '@web/lib/api';
import { cn } from '@web/lib/utils';
import { PLAYER_COLOR_CLASSES, playerColorOf } from '../colors';

type Adjustment = GameState['vpAdjustments'][number];

/** Common non-objective VP sources at the table — one tap each. */
const QUICK_ADDS: readonly { label: string; points: number }[] = [
  { label: 'Custodians', points: 1 },
  { label: 'Imperial', points: 1 },
  { label: 'Support for the Throne', points: 1 },
  { label: 'Relic', points: 1 },
  { label: 'Agenda', points: 1 },
];

interface AdjustmentsPopoverProps {
  player: GamePlayer;
  adjustments: Adjustment[];
  onAdd: (label: string, points: number) => void;
  onRemove: (id: number) => void;
}

/** A player's bonus VP (custodians, Imperial, relics...): quick chips + custom entries. */
export function AdjustmentsPopover({ player, adjustments, onAdd, onRemove }: AdjustmentsPopoverProps) {
  const [label, setLabel] = useState('');
  const [points, setPoints] = useState(1);
  const color = PLAYER_COLOR_CLASSES[playerColorOf(player.color)];
  const total = adjustments.reduce((sum, a) => sum + a.points, 0);

  const submitCustom = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = label.trim();
    if (!trimmed || points === 0) return;
    onAdd(trimmed, points);
    setLabel('');
    setPoints(1);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`${player.name}: bonus victory points`}
          className="flex min-h-12 w-full items-center justify-center rounded-md text-sm font-semibold tabular-nums transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className={cn(total !== 0 ? color.text : 'text-foreground/65')}>
            {total > 0 ? `+${total}` : total}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="center" className="w-[300px] p-0">
        <div className="flex items-center gap-2 border-b border-white/[0.14] px-3 py-2.5 text-sm font-semibold">
          <Medal className="h-4 w-4 text-primary" />
          {player.name} — bonus VP
        </div>

        {adjustments.length > 0 ? (
          <ul className="flex flex-col gap-1 p-2">
            {adjustments.map((a) => (
              <li key={a.id} className="flex items-center gap-2 rounded-md bg-card/70 px-2.5 py-1.5">
                <span className="min-w-0 flex-1 truncate text-sm">{a.label}</span>
                <span className={cn('text-sm font-semibold tabular-nums', color.text)}>
                  {a.points > 0 ? `+${a.points}` : a.points}
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${a.label}`}
                  onClick={() => onRemove(a.id)}
                  className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="flex flex-wrap gap-1.5 px-3 pt-2">
          {QUICK_ADDS.map((q) => (
            <button
              key={q.label}
              type="button"
              onClick={() => onAdd(q.label, q.points)}
              className="rounded-full border border-border/70 bg-card/50 px-2.5 py-1.5 text-xs transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {q.label} +{q.points}
            </button>
          ))}
        </div>

        <form onSubmit={submitCustom} className="flex items-center gap-1.5 p-3">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Custom…"
            maxLength={60}
            className="h-9 min-w-0 flex-1 rounded-md border border-border/70 bg-background/60 px-2.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
          <button
            type="button"
            aria-label="Decrease points"
            onClick={() => setPoints((p) => Math.max(p - 1, -5))}
            className="rounded-md border border-border/70 p-2 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="w-7 text-center text-sm font-semibold tabular-nums">
            {points > 0 ? `+${points}` : points}
          </span>
          <button
            type="button"
            aria-label="Increase points"
            onClick={() => setPoints((p) => Math.min(p + 1, 5))}
            className="rounded-md border border-border/70 p-2 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <Button type="submit" size="sm" disabled={!label.trim() || points === 0}>
            Add
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
