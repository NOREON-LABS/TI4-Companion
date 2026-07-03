import { Hexagon, Sparkles, Trophy } from 'lucide-react';
import type { ComponentType } from 'react';

export interface TabDef {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

/**
 * The tool tabs. Adding a new tool = build its feature page, add a <Route> in App.tsx, and
 * add an entry here. The order here is the order shown in the tab bar.
 */
export const TABS: readonly TabDef[] = [
  { to: '/tech', label: 'Tech Tracker', icon: Hexagon },
  { to: '/objectives', label: 'Objectives', icon: Trophy },
  { to: '/coming-soon', label: 'Coming soon', icon: Sparkles },
];
