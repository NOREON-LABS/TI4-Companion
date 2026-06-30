import type { Faction, Tech } from '@domain';
import { cn } from '@web/lib/utils';

interface StartingTechChoiceProps {
  faction: Faction;
  ownedIds: ReadonlySet<string>;
  techById: ReadonlyMap<string, Tech>;
  onToggleTech: (id: string) => void;
}

/** Choose-N starting-tech picker shown for factions like Winnu / Argent Flight. */
export function StartingTechChoice({
  faction,
  ownedIds,
  techById,
  onToggleTech,
}: StartingTechChoiceProps) {
  const choice = faction.startingTechChoice;
  if (!choice) return null;

  const selectedCount = choice.options.filter((id) => ownedIds.has(id)).length;
  // Once the required number are owned, the picker has served its setup purpose — hide it
  // so it can't read "3/1" or lock up once the player researches these techs normally.
  if (selectedCount >= choice.count) return null;

  return (
    <div className="mb-6 rounded-md border border-primary/40 bg-primary/5 p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">
          {faction.name}: choose {choice.count} starting tech{choice.count > 1 ? 's' : ''}
        </h2>
        <span className="text-xs text-muted-foreground">
          {selectedCount}/{choice.count} chosen
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {choice.options.map((id) => {
          const tech = techById.get(id);
          if (!tech) return null;
          const isSelected = ownedIds.has(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => onToggleTech(id)}
              className={cn(
                'min-h-[2.5rem] rounded-md border px-3 py-2 text-sm transition-colors',
                isSelected ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent',
              )}
            >
              {tech.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
