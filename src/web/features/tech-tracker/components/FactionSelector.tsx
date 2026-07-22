import { useState } from 'react';
import { Check, ChevronsUpDown, RotateCcw } from 'lucide-react';
import { activeEntities, FACTIONS, type EnabledContent } from '@domain';
import { Button } from '@web/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@web/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@web/components/ui/popover';
import { cn } from '@web/lib/utils';

interface FactionSelectorProps {
  enabledContent: EnabledContent;
  currentFactionId: string | null;
  onSelect: (factionId: string | null) => void;
}

export function FactionSelector({
  enabledContent,
  currentFactionId,
  onSelect,
}: FactionSelectorProps) {
  const [open, setOpen] = useState(false);
  const factions = activeEntities(FACTIONS, enabledContent).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  const current = factions.find((f) => f.id === currentFactionId);

  return (
    <div className="w-full">
      <div className="mb-2 font-display text-xs font-semibold uppercase tracking-[0.16em] text-foreground">
        Faction
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-label="Select faction"
            aria-expanded={open}
            className="h-[42px] w-full justify-between rounded-lg border-border/80 bg-card/75 px-3 shadow-[0_12px_35px_-24px_hsl(var(--primary)/0.35)] hover:bg-card hover:text-foreground"
          >
            <span className="truncate font-display text-sm font-semibold tracking-[0.02em]">
              {current ? current.name : 'Select faction…'}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[260px] max-w-[calc(100vw-1.5rem)] p-0">
          <Command>
            <CommandInput placeholder="Search factions…" />
            <CommandList>
              <CommandEmpty>No faction found.</CommandEmpty>
              {currentFactionId ? (
                <CommandItem
                  value="No faction"
                  onSelect={() => {
                    onSelect(null);
                    setOpen(false);
                  }}
                  className="border-b border-border/60 text-muted-foreground"
                >
                  <RotateCcw className="h-4 w-4" />
                  Clear faction
                </CommandItem>
              ) : null}
              {factions.map((f) => (
                <CommandItem
                  key={f.id}
                  value={f.name}
                  onSelect={() => {
                    // Re-selecting the active faction would re-run setFaction and wipe owned
                    // techs back to the starting set — so only fire on an actual change.
                    if (f.id !== currentFactionId) onSelect(f.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'h-4 w-4',
                      f.id === currentFactionId ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  {f.name}
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
