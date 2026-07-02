import { Pin } from 'lucide-react';
import type { Prerequisites, Tech } from '@domain';
import { Popover, PopoverContent, PopoverTrigger } from '@web/components/ui/popover';
import { cn } from '@web/lib/utils';
import { CATEGORY_CARD } from '../colors';
import type { TechStatus } from '../status';
import { PrereqPips } from './PrereqPips';
import { TechDetail } from './TechDetail';

interface TechCardProps {
  tech: Tech;
  status: TechStatus;
  isPinned: boolean;
  available: Prerequisites;
  onToggleOwned: () => void;
  onTogglePin: () => void;
}

/**
 * A compact tech-tree card. Tapping the body toggles owned (mirrors the old row checkbox);
 * tapping the "i" glyph opens the detail popover without toggling.
 */
export function TechCard({
  tech,
  status,
  isPinned,
  available,
  onToggleOwned,
  onTogglePin,
}: TechCardProps) {
  const accent = CATEGORY_CARD[tech.category];

  return (
    <div
      id={`tech-${tech.id}`}
      tabIndex={-1}
      role="button"
      aria-pressed={status === 'owned'}
      onClick={onToggleOwned}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        onToggleOwned();
      }}
      className={cn(
        'flex min-h-[92px] w-[170px] shrink-0 scroll-mt-6 cursor-pointer flex-col gap-1.5 rounded-[10px] border p-3 outline-none transition-[opacity,filter,background-color,border-color] duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        status === 'owned' && cn(accent.border, accent.bgOwned),
        status === 'available' && cn(accent.border, 'bg-card/40'),
        status === 'locked' && 'border-border/50 bg-card/20 opacity-40 saturate-50 hover:opacity-70',
      )}
    >
      <div className="flex items-start justify-between gap-1.5">
        <span
          className={cn(
            'flex items-center gap-1 text-[13px] font-semibold leading-tight',
            status === 'locked' ? 'text-muted-foreground' : 'text-foreground',
          )}
        >
          {tech.name}
          {isPinned ? <Pin className="h-3 w-3 shrink-0 fill-current text-primary" /> : null}
        </span>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={`${tech.name} details`}
              onClick={(event) => event.stopPropagation()}
              className="-mt-px flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border border-border/70 text-[10px] font-bold italic leading-none text-muted-foreground outline-none transition-colors hover:border-foreground/50 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              i
            </button>
          </PopoverTrigger>
          {/* Radix portals this content to <body>, but React still bubbles the synthetic click
              through the *component* tree — stop it here or the buttons below also toggle the card. */}
          <PopoverContent align="start" className="w-80" onClick={(event) => event.stopPropagation()}>
            <TechDetail
              tech={tech}
              status={status}
              isPinned={isPinned}
              onToggleOwned={onToggleOwned}
              onTogglePin={onTogglePin}
            />
          </PopoverContent>
        </Popover>
      </div>

      <p
        className={cn(
          'line-clamp-2 text-[10.5px] leading-snug',
          status === 'locked' ? 'text-muted-foreground/70' : 'text-muted-foreground',
        )}
      >
        {tech.text}
      </p>

      {tech.factionId ? (
        <div className="flex items-center gap-1 text-[8.5px] font-semibold uppercase tracking-wider text-fuchsia-300/80">
          <span>◆</span>
          {tech.factionId}
        </div>
      ) : null}

      <div className="mt-auto flex items-center justify-between gap-1.5 pt-0.5">
        <PrereqPips prerequisites={tech.prerequisites} available={available} />
        {status === 'owned' ? (
          <span className={cn('text-sm leading-none', accent.text)}>✓</span>
        ) : null}
        {status === 'available' ? (
          <span
            className={cn('text-sm leading-none motion-safe:animate-pulse', accent.text)}
            aria-label="Available to research"
          >
            ○
          </span>
        ) : null}
      </div>
    </div>
  );
}
