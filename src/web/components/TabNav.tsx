import { NavLink } from 'react-router-dom';
import { TABS } from '@web/app/tabs';
import { cn } from '@web/lib/utils';

/**
 * Tool switcher. The active tool reads as the prominent page title (large, gold icon); the
 * other tools sit beside it as compact links. No borders/underlines.
 */
export function TabNav() {
  return (
    <nav className="flex flex-wrap items-end gap-x-5 gap-y-1">
      {TABS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2 transition-colors',
              isActive
                ? 'text-2xl font-bold tracking-tight text-foreground'
                : 'pb-1 text-sm font-medium text-muted-foreground hover:text-foreground',
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon className={cn(isActive ? 'h-6 w-6 text-primary' : 'h-4 w-4')} />
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
