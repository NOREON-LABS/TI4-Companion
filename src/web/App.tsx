import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppShell } from '@web/components/AppShell';
import { ComingSoon } from '@web/components/ComingSoon';
import { queryClient } from '@web/lib/queryClient';
import { ObjectivesPage } from '@web/features/objectives/ObjectivesPage';
import { TechTrackerPage } from '@web/features/tech-tracker/TechTrackerPage';

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Tabbed shell: each tool is a tab/route rendered into the shell's outlet. */}
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/tech" replace />} />
            <Route path="/tech" element={<TechTrackerPage />} />
            <Route path="/objectives" element={<ObjectivesPage />} />
            <Route path="/coming-soon" element={<ComingSoon />} />
            <Route path="*" element={<Navigate to="/tech" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster theme="dark" position="top-center" richColors closeButton />
    </QueryClientProvider>
  );
}
