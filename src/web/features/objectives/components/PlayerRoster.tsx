import { useState, type FormEvent } from 'react';
import { Check, ChevronsUpDown, Plus, X } from 'lucide-react';
import { activeEntities, FACTIONS, PLAYER_COLORS, type EnabledContent, type PlayerColor } from '@domain';
import { Button } from '@web/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@web/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@web/components/ui/popover';
import type { GamePlayer, PlayerInput } from '@web/lib/api';
import { cn } from '@web/lib/utils';
import { PLAYER_COLOR_CLASSES, playerColorOf } from '../colors';

interface PlayerRosterProps {
  players: GamePlayer[];
  enabledContent: EnabledContent;
  onAdd: (player: PlayerInput) => void;
  onUpdate: (id: number, patch: Partial<PlayerInput>) => void;
  onRemove: (id: number) => void;
}

/** Add / edit / remove the people at the table. Colours are unique per player. */
export function PlayerRoster({ players, enabledContent, onAdd, onUpdate, onRemove }: PlayerRosterProps) {
  const [name, setName] = useState('');
  const takenColors = new Set(players.map((p) => p.color));
  const freeColors = PLAYER_COLORS.filter((c) => !takenColors.has(c));
  const [color, setColor] = useState<PlayerColor | null>(null);
  const pickedColor = color && !takenColors.has(color) ? color : (freeColors[0] ?? null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || !pickedColor) return;
    onAdd({ name: trimmed, color: pickedColor });
    setName('');
    setColor(null);
  };

  return (
    <div className="flex flex-col gap-3">
      {players.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {players.map((player) => (
            <PlayerRow
              key={player.id}
              player={player}
              enabledContent={enabledContent}
              onUpdate={(patch) => onUpdate(player.id, patch)}
              onRemove={() => onRemove(player.id)}
            />
          ))}
        </ul>
      ) : (
        <p className="px-1 text-xs text-muted-foreground">
          Add the players at the table to start scoring.
        </p>
      )}

      {freeColors.length > 0 ? (
        <form onSubmit={submit} className="flex flex-col gap-2.5 rounded-md border border-border/60 bg-card/40 p-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Player name…"
            maxLength={40}
            className="h-10 rounded-md border border-border/70 bg-background/60 px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div className="flex items-center gap-2">
            <div className="flex flex-1 flex-wrap gap-1.5">
              {PLAYER_COLORS.map((c) => {
                const taken = takenColors.has(c);
                return (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Colour ${c}`}
                    disabled={taken}
                    onClick={() => setColor(c)}
                    className={cn(
                      'h-8 w-8 rounded-full transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      PLAYER_COLOR_CLASSES[c].dot,
                      taken && 'opacity-20',
                      pickedColor === c && 'ring-2 ring-foreground/80 scale-110',
                    )}
                  />
                );
              })}
            </div>
            <Button type="submit" size="sm" disabled={!name.trim() || !pickedColor}>
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

function PlayerRow({
  player,
  enabledContent,
  onUpdate,
  onRemove,
}: {
  player: GamePlayer;
  enabledContent: EnabledContent;
  onUpdate: (patch: Partial<PlayerInput>) => void;
  onRemove: () => void;
}) {
  const [draftName, setDraftName] = useState<string | null>(null);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const color = playerColorOf(player.color);

  const commitName = () => {
    const trimmed = (draftName ?? '').trim();
    if (trimmed && trimmed !== player.name) onUpdate({ name: trimmed });
    setDraftName(null);
  };

  return (
    <li className="flex min-w-0 items-center gap-2.5 rounded-md border bg-card/70 px-3 py-2">
      <span className={cn('h-3.5 w-3.5 shrink-0 rounded-full', PLAYER_COLOR_CLASSES[color].dot)} />
      {draftName === null ? (
        <button
          type="button"
          onClick={() => setDraftName(player.name)}
          title="Rename"
          className="min-w-0 flex-1 truncate rounded px-1 py-1.5 text-left text-sm font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {player.name}
        </button>
      ) : (
        <input
          autoFocus
          value={draftName}
          maxLength={40}
          onChange={(e) => setDraftName(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitName();
            if (e.key === 'Escape') setDraftName(null);
          }}
          className="min-w-0 flex-1 rounded-md border border-border/70 bg-background/60 px-2 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      )}

      <FactionPicker
        enabledContent={enabledContent}
        factionId={player.factionId}
        onSelect={(factionId) => onUpdate({ factionId })}
      />

      {confirmingRemove ? (
        <Button
          variant="outline"
          size="sm"
          onClick={onRemove}
          onBlur={() => setConfirmingRemove(false)}
          className="border-red-500/60 text-red-400 hover:bg-red-500/10 hover:text-red-300"
        >
          Remove?
        </Button>
      ) : (
        <button
          type="button"
          aria-label={`Remove ${player.name}`}
          onClick={() => setConfirmingRemove(true)}
          className="rounded p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </li>
  );
}

function FactionPicker({
  enabledContent,
  factionId,
  onSelect,
}: {
  enabledContent: EnabledContent;
  factionId: string | null;
  onSelect: (factionId: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const factions = activeEntities(FACTIONS, enabledContent).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  const current = factions.find((f) => f.id === factionId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-9 max-w-[150px] justify-between gap-1 border-border/60 bg-transparent px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <span className="truncate">{current ? current.name : 'Faction…'}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[240px] p-0">
        <Command>
          <CommandInput placeholder="Search factions…" />
          <CommandList>
            <CommandEmpty>No faction found.</CommandEmpty>
            {current ? (
              <CommandItem
                value="__none"
                onSelect={() => {
                  onSelect(null);
                  setOpen(false);
                }}
              >
                <X className="h-4 w-4" />
                Clear faction
              </CommandItem>
            ) : null}
            {factions.map((f) => (
              <CommandItem
                key={f.id}
                value={f.name}
                onSelect={() => {
                  onSelect(f.id);
                  setOpen(false);
                }}
              >
                <Check className={cn('h-4 w-4', f.id === factionId ? 'opacity-100' : 'opacity-0')} />
                {f.name}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
