import { NavLink } from 'react-router-dom';
import { TABS } from '@web/app/tabs';
import { cn } from '@web/lib/utils';

/**
 * Browser-style tool tabs. A baseline runs under the strip; the active tab "punches through"
 * it — bordered on three sides with a transparent bottom (and -mb-px to overlap the baseline)
 * — so it connects to the content below with no line beneath it.
 */
export function TabNav() {
  return (
    <nav className="flex items-end gap-1 border-b border-border">
      <div className="mr-2 flex h-11 shrink-0 items-center sm:mr-4">
        <span className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-foreground">
          TI4 <span className="hidden text-muted-foreground sm:inline">Companion</span>
        </span>
      </div>
      {TABS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              '-mb-px flex min-h-11 items-center gap-2 rounded-t-lg border px-3 py-2.5 text-sm transition-colors sm:px-4',
              isActive
                ? 'border-border border-b-transparent bg-background font-semibold text-foreground'
                : 'border-transparent font-medium text-muted-foreground hover:bg-card/40 hover:text-foreground',
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon className={cn('h-4 w-4', isActive && 'text-primary')} />
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
