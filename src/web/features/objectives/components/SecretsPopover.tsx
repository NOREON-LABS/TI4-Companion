import { useState } from 'react';
import { EyeOff, X } from 'lucide-react';
import {
  MAX_SCORED_SECRETS,
  secretTakenBy,
  type Objective,
  type ObjectiveScore,
} from '@domain';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@web/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@web/components/ui/popover';
import type { GamePlayer } from '@web/lib/api';
import { cn } from '@web/lib/utils';
import { PLAYER_COLOR_CLASSES, playerColorOf } from '../colors';

interface SecretsPopoverProps {
  player: GamePlayer;
  /** Content-gated secrets (pickable); scored ones resolve from the full set upstream. */
  secretPool: Objective[];
  /** This player's scored secrets, resolved to full objectives. */
  scored: Objective[];
  scores: ObjectiveScore[];
  onToggle: (objectiveId: string) => void;
}

/** A player's secret objectives: scored list (tap to un-score) + picker for the rest. */
export function SecretsPopover({ player, secretPool, scored, scores, onToggle }: SecretsPopoverProps) {
  const [open, setOpen] = useState(false);
  const color = PLAYER_COLOR_CLASSES[playerColorOf(player.color)];
  const atCap = scored.length >= MAX_SCORED_SECRETS;
  // Each secret exists once per game — hide the ones anyone has scored from the picker.
  const candidates = secretPool.filter((o) => secretTakenBy(o.id, scores) === null);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`${player.name}: secret objectives`}
          className="flex min-h-12 w-full items-center justify-center rounded-md text-sm font-semibold tabular-nums transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className={cn(scored.length > 0 ? color.text : 'text-foreground/65')}>
            {scored.length}/{MAX_SCORED_SECRETS}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="center" className="w-[320px] p-0">
        <div className="flex items-center gap-2 border-b border-white/[0.14] px-3 py-2.5 text-sm font-semibold">
          <EyeOff className="h-4 w-4 text-primary" />
          {player.name} — secrets
          <span className="ml-auto text-xs font-normal tabular-nums text-foreground/65">
            {scored.length}/{MAX_SCORED_SECRETS}
          </span>
        </div>

        {scored.length > 0 ? (
          <ul className="flex flex-col gap-1 p-2">
            {scored.map((o) => (
              <li key={o.id} className="flex items-start gap-2 rounded-md bg-card/70 px-2.5 py-2">
                <div className="min-w-0 flex-1">
                  <div className={cn('text-sm font-medium leading-tight', color.text)}>{o.name}</div>
                  <div className="line-clamp-2 text-xs text-foreground/65">{o.text}</div>
                </div>
                <button
                  type="button"
                  aria-label={`Un-score ${o.name}`}
                  onClick={() => onToggle(o.id)}
                  className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {atCap ? (
          <p className="px-3 pb-3 pt-1 text-xs text-foreground/65">
            Secret limit reached ({MAX_SCORED_SECRETS}).
          </p>
        ) : (
          <Command>
            <CommandInput placeholder="Score a secret…" />
            <CommandList>
              <CommandEmpty>No secret found.</CommandEmpty>
              {candidates.map((o) => (
                <CommandItem
                  key={o.id}
                  value={o.name}
                  onSelect={() => onToggle(o.id)}
                  className="flex flex-col items-start gap-0.5"
                >
                  <span className="font-medium">{o.name}</span>
                  <span className="line-clamp-2 text-xs text-foreground/65">{o.text}</span>
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        )}
      </PopoverContent>
    </Popover>
  );
}
