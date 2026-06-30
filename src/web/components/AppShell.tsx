import { Outlet } from 'react-router-dom';
import { TabNav } from '@web/components/TabNav';

/** App frame: the active tool's tab reads as the title; other tools sit beside it. */
export function AppShell() {
  return (
    <div className="mx-auto max-w-[1480px] px-4 py-4 sm:px-5 sm:py-5 lg:px-6">
      <header className="mb-5 sm:mb-6">
        <TabNav />
      </header>
      <div className="console-enter">
        <Outlet />
      </div>
    </div>
  );
}
