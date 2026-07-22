import { NavLink } from 'react-router-dom';
import { TABS } from '@web/app/tabs';
import { cn } from '@web/lib/utils';

/** Quiet, transparent tool navigation that leaves the shared sky visible beneath it. */
export function TabNav() {
  return (
    <nav
      aria-label="Companion tools"
      className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-end gap-2 border-b border-border sm:gap-3"
    >
      <div className="flex h-11 shrink-0 items-center">
        <span className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-foreground">
          TI4 <span className="hidden text-muted-foreground sm:inline">Companion</span>
        </span>
      </div>
      <div className="flex min-w-0 items-end overflow-x-auto overscroll-x-contain">
        {TABS.map(({ to, label, shortLabel, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex min-h-11 shrink-0 items-center gap-2 bg-transparent px-2.5 py-2.5 text-sm transition-colors focus-visible:text-primary focus-visible:underline focus-visible:underline-offset-8 focus-visible:outline-none sm:px-4',
                isActive
                  ? 'font-semibold text-foreground'
                  : 'font-medium text-muted-foreground hover:text-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn('h-4 w-4', isActive && 'text-primary')} />
                <span className="sm:hidden">{shortLabel}</span>
                <span className="hidden sm:inline">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
