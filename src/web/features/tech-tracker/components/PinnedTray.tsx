import { X } from 'lucide-react';
import type { Tech } from '@domain';

interface PinnedTrayProps {
  techs: Tech[];
  onNavigate: (tech: Tech) => void;
  onUnpin: (techId: string) => void;
}

/** Compact shortcuts to pinned technologies in the catalog. */
export function PinnedTray({ techs, onNavigate, onUnpin }: PinnedTrayProps) {
  if (techs.length === 0) {
    return (
      <p className="px-1 py-2 text-xs text-muted-foreground">
        Pin a tech to keep a shortcut to it here.
      </p>
    );
  }
  return (
    <ul className="flex min-w-0 flex-col gap-1.5">
      {techs.map((t) => (
        <li key={t.id} className="flex min-w-0 items-center rounded-md border bg-card/70">
          <button
            type="button"
            onClick={() => onNavigate(t)}
            className="min-w-0 flex-1 rounded-l-md px-3 py-2.5 text-left text-sm font-medium leading-tight transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          >
            <span className="block truncate">{t.name}</span>
          </button>
          <button
            type="button"
            aria-label={`Unpin ${t.name}`}
            onClick={() => onUnpin(t.id)}
            className="mr-1 rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}
