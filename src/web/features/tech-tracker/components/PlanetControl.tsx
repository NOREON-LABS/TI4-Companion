import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { activeEntities, PLANETS, type EnabledContent, type Planet } from '@domain';
import { Button } from '@web/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@web/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@web/components/ui/popover';
import { LegendaryIcon, TechSkipIcon } from './Icons';

interface PlanetControlProps {
  enabledContent: EnabledContent;
  controlledIds: ReadonlySet<string>;
  onToggle: (planetId: string) => void;
}

function PlanetMeta({ planet }: { planet: Planet }) {
  return (
    <span className="flex items-center gap-2">
      {/* Only the tech-skip affects research. Trait and resources/influence are intentionally
          not shown in the Tech Tracker (kept in the data for other tools). */}
      {planet.legendary ? <LegendaryIcon /> : null}
      {planet.techSpecialty ? <TechSkipIcon color={planet.techSpecialty} /> : null}
    </span>
  );
}

export function PlanetControl({ enabledContent, controlledIds, onToggle }: PlanetControlProps) {
  const [open, setOpen] = useState(false);
  const planets = activeEntities(PLANETS, enabledContent);
  const byId = new Map(planets.map((p) => [p.id, p]));

  const controlled = [...controlledIds]
    .map((id) => byId.get(id))
    .filter((p): p is Planet => Boolean(p))
    .sort((a, b) => a.name.localeCompare(b.name));
  const available = planets
    .filter((p) => !controlledIds.has(p.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start">
            <Plus className="h-4 w-4" />
            Add a planet you control…
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Search planets…" />
            <CommandList>
              <CommandEmpty>No planet found.</CommandEmpty>
              {available.map((p) => (
                <CommandItem
                  key={p.id}
                  value={p.name}
                  onSelect={() => {
                    onToggle(p.id);
                    setOpen(false);
                  }}
                  className="justify-between"
                >
                  <span className="font-medium">{p.name}</span>
                  <PlanetMeta planet={p} />
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {controlled.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {controlled.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-2 rounded-md border bg-card px-3 py-2"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="truncate text-sm font-medium">{p.name}</span>
              </span>
              <span className="flex items-center gap-2">
                <PlanetMeta planet={p} />
                <button
                  type="button"
                  aria-label={`Remove ${p.name}`}
                  onClick={() => onToggle(p.id)}
                  className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
