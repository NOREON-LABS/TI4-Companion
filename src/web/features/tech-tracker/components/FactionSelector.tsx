import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
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
  onSelect: (factionId: string) => void;
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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between sm:w-[260px]"
        >
          <span className="truncate">{current ? current.name : 'Select faction…'}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-0">
        <Command>
          <CommandInput placeholder="Search factions…" />
          <CommandList>
            <CommandEmpty>No faction found.</CommandEmpty>
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
                  className={cn('h-4 w-4', f.id === currentFactionId ? 'opacity-100' : 'opacity-0')}
                />
                {f.name}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
