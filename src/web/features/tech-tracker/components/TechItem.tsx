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
  onToggleOwned: () => void;
  onTogglePin: () => void;
}

/**
 * A tech row: the checkbox toggles ownership; tapping the name opens the detail popover
 * (card text + pin/queue actions). A pin glyph shows when the tech is pinned.
 */
export function TechItem({ tech, status, isPinned, onToggleOwned, onTogglePin }: TechItemProps) {
  const badge = STATUS_BADGE[status];
  const accent = CATEGORY_ACCENT[tech.category];
  return (
    <div
      id={`tech-${tech.id}`}
      tabIndex={-1}
      className={cn(
        // Hierarchy is carried by opacity (locked recedes) + the gold "Available" badge,
        // so the row itself stays calm — gold is reserved for the one actionable signal.
        // Roomy, touch-friendly rows (iPad is the primary device).
        'flex min-h-[3.25rem] scroll-mt-6 items-center gap-3 rounded-lg border border-l-[3px] bg-card/35 px-3 py-2.5 outline-none transition-[background-color,opacity,transform,box-shadow] duration-200 motion-safe:hover:-translate-y-px hover:bg-card/75 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background',
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
          <button
            type="button"
            className="flex min-w-0 flex-1 flex-col items-start gap-0.5 rounded-sm py-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
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
            onToggleOwned={onToggleOwned}
            onTogglePin={onTogglePin}
          />
        </PopoverContent>
      </Popover>
      <Badge variant={badge.variant}>{badge.label}</Badge>
    </div>
  );
}
