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
import { cn } from '@web/lib/utils';

interface RevealObjectivePickerProps {
  stage: 1 | 2;
  /** Content-gated publics of this stage not yet on the table. */
  candidates: Objective[];
  onReveal: (objectiveId: string) => void;
  prominent?: boolean;
}

/** "+ Reveal stage N objective" — a cmdk picker of the remaining publics for a stage. */
export function RevealObjectivePicker({
  stage,
  candidates,
  onReveal,
  prominent = false,
}: RevealObjectivePickerProps) {
  const [open, setOpen] = useState(false);
  if (candidates.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          aria-label={`Reveal stage ${stage === 1 ? 'I' : 'II'} objective`}
          className={cn(
            'h-10 justify-start gap-2 px-3.5 text-sm font-semibold shadow-[0_10px_28px_-20px_currentColor]',
            prominent
              ? stage === 1
                ? 'border-amber-300/70 bg-amber-300/[0.12] text-amber-100 hover:bg-amber-300/[0.2]'
                : 'border-sky-300/70 bg-sky-300/[0.12] text-sky-100 hover:bg-sky-300/[0.2]'
              : 'border-primary/60 bg-primary/[0.1] text-foreground hover:bg-primary/[0.16]',
          )}
        >
          <Plus className="h-4 w-4" />
          Reveal objective
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[320px] p-0">
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
                <span className="line-clamp-2 text-xs text-foreground/65">{o.text}</span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
