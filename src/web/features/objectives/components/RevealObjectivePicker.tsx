import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { Objective } from '@domain';
import { Button } from '@web/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@web/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@web/components/ui/popover';

interface RevealObjectivePickerProps {
  stage: 1 | 2;
  /** Content-gated publics of this stage not yet on the table. */
  candidates: Objective[];
  onReveal: (objectiveId: string) => void;
}

/** "+ Reveal stage N objective" — a cmdk picker of the remaining publics for a stage. */
export function RevealObjectivePicker({ stage, candidates, onReveal }: RevealObjectivePickerProps) {
  const [open, setOpen] = useState(false);
  if (candidates.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-10 justify-start gap-1.5 border-dashed border-border/70 bg-transparent text-xs text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
          Reveal stage {stage === 1 ? 'I' : 'II'} objective
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[320px] p-0">
        <Command>
          <CommandInput placeholder="Search objectives…" />
          <CommandList>
            <CommandEmpty>No objective found.</CommandEmpty>
            {candidates.map((o) => (
              <CommandItem
                key={o.id}
                value={o.name}
                onSelect={() => {
                  onReveal(o.id);
                  setOpen(false);
                }}
                className="flex flex-col items-start gap-0.5"
              >
                <span className="font-medium">{o.name}</span>
                <span className="line-clamp-2 text-xs text-muted-foreground">{o.text}</span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
