import { Check, Pin } from 'lucide-react';
import type { Tech } from '@domain';
import { Badge } from '@web/components/ui/badge';
import { Button } from '@web/components/ui/button';
import { cn } from '@web/lib/utils';
import { CATEGORY_ACCENT, CATEGORY_LABEL } from '../colors';
import type { TechStatus } from '../status';
import { PrereqPips } from './PrereqPips';

interface TechDetailProps {
  tech: Tech;
  status: TechStatus;
  isPinned: boolean;
  onToggleOwned: () => void;
  onTogglePin: () => void;
}

/** Card-text reader + quick actions, shown in a popover when a tech is tapped. */
export function TechDetail({
  tech,
  status,
  isPinned,
  onToggleOwned,
  onTogglePin,
}: TechDetailProps) {
  return (
    <div className="flex flex-col gap-3 p-3">
      <div>
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight">{tech.name}</h3>
          <Badge variant="secondary">
            {tech.source}
            {tech.errata === 'omega' ? ' Ω' : ''}
          </Badge>
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <span className={cn('h-2 w-2 rounded-full', CATEGORY_ACCENT[tech.category].dot)} />
          <span>{CATEGORY_LABEL[tech.category]}</span>
          <PrereqPips prerequisites={tech.prerequisites} />
        </div>
      </div>

      <p className="whitespace-pre-line text-sm leading-snug">{tech.text}</p>

      <div className="flex flex-wrap gap-2">
        <Button variant={status === 'owned' ? 'default' : 'outline'} onClick={onToggleOwned}>
          <Check className="h-4 w-4" />
          {status === 'owned' ? 'Owned' : 'Mark owned'}
        </Button>
        <Button variant={isPinned ? 'default' : 'outline'} onClick={onTogglePin}>
          <Pin className="h-4 w-4" />
          {isPinned ? 'Pinned' : 'Pin'}
        </Button>
      </div>
    </div>
  );
}
