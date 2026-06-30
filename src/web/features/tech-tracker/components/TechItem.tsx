import { Pin } from 'lucide-react';
import type { Tech } from '@domain';
import { Badge } from '@web/components/ui/badge';
import { Checkbox } from '@web/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@web/components/ui/popover';
import { cn } from '@web/lib/utils';
import { CATEGORY_ACCENT } from '../colors';
import { STATUS_BADGE, type TechStatus } from '../status';
import { PrereqPips } from './PrereqPips';
import { TechDetail } from './TechDetail';

interface TechItemProps {
  tech: Tech;
  status: TechStatus;
  isPinned: boolean;
  isQueued: boolean;
  onToggleOwned: () => void;
  onTogglePin: () => void;
  onToggleQueue: () => void;
}

/**
 * A tech row: the checkbox toggles ownership; tapping the name opens the detail popover
 * (card text + pin/queue actions). A pin glyph shows when the tech is pinned.
 */
export function TechItem({
  tech,
  status,
  isPinned,
  isQueued,
  onToggleOwned,
  onTogglePin,
  onToggleQueue,
}: TechItemProps) {
  const badge = STATUS_BADGE[status];
  const accent = CATEGORY_ACCENT[tech.category];
  return (
    <div
      className={cn(
        // Hierarchy is carried by opacity (locked recedes) + the gold "Available" badge,
        // so the row itself stays calm — gold is reserved for the one actionable signal.
        // Roomy, touch-friendly rows (iPad is the primary device).
        'flex min-h-[3.25rem] items-center gap-3 rounded-lg border border-l-[3px] bg-card/40 px-3 py-2.5 transition-all hover:bg-card/70',
        accent.border,
        status === 'owned' && 'bg-emerald-500/[0.06]',
        status === 'locked' && 'opacity-50 hover:opacity-100',
      )}
    >
      <Checkbox
        checked={status === 'owned'}
        onCheckedChange={onToggleOwned}
        aria-label={`Mark ${tech.name} owned`}
        className="h-6 w-6 shrink-0"
      />
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className="flex min-w-0 flex-1 flex-col items-start gap-0.5 py-1 text-left">
            <span className="flex items-center gap-2 text-base font-medium leading-tight">
              {tech.name}
              {tech.factionId ? (
                <span className="text-xs uppercase text-muted-foreground">{tech.factionId}</span>
              ) : null}
              {isPinned ? <Pin className="h-3.5 w-3.5 fill-current text-primary" /> : null}
            </span>
            <PrereqPips prerequisites={tech.prerequisites} />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80">
          <TechDetail
            tech={tech}
            status={status}
            isPinned={isPinned}
            isQueued={isQueued}
            onToggleOwned={onToggleOwned}
            onTogglePin={onTogglePin}
            onToggleQueue={onToggleQueue}
          />
        </PopoverContent>
      </Popover>
      <Badge variant={badge.variant}>{badge.label}</Badge>
    </div>
  );
}
