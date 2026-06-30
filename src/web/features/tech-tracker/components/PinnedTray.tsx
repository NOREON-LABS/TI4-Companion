import { X } from 'lucide-react';
import type { Tech } from '@domain';

interface PinnedTrayProps {
  techs: Tech[];
  onUnpin: (techId: string) => void;
}

/** Keeps pinned techs' card text on-screen for quick reference during the game. */
export function PinnedTray({ techs, onUnpin }: PinnedTrayProps) {
  if (techs.length === 0) {
    return (
      <p className="px-1 py-2 text-xs text-muted-foreground">
        Pin a tech (open one and tap “Pin”) to keep its card text handy here.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {techs.map((t) => (
        <li key={t.id} className="rounded-md border bg-card p-3">
          <div className="flex items-start justify-between gap-2">
            <span className="text-sm font-medium leading-tight">{t.name}</span>
            <button
              type="button"
              aria-label={`Unpin ${t.name}`}
              onClick={() => onUnpin(t.id)}
              className="rounded p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1 whitespace-pre-line text-xs leading-snug text-muted-foreground">
            {t.text}
          </p>
        </li>
      ))}
    </ul>
  );
}
