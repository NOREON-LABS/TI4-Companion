import { Outlet } from 'react-router-dom';
import { TabNav } from '@web/components/TabNav';

/** App frame: the active tool's tab reads as the title; other tools sit beside it. */
export function AppShell() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-5 sm:py-6">
      <header className="mb-5">
        <TabNav />
      </header>
      <Outlet />
    </div>
  );
}
