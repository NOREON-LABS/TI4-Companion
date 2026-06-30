import { Sparkles } from 'lucide-react';

/** Placeholder tab — a slot for the next tool. */
export function ComingSoon() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
      <Sparkles className="h-10 w-10 text-muted-foreground/40" />
      <h2 className="text-lg font-semibold">More tools coming soon</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        A placeholder for the next tool. Each tool gets its own tab — adding one is just a new
        feature slice plus a tab entry.
      </p>
    </div>
  );
}
