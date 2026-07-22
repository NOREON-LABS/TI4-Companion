import { Crosshair, Hexagon, Trophy } from 'lucide-react';
import type { ComponentType } from 'react';

export interface TabDef {
  to: string;
  label: string;
  shortLabel: string;
  icon: ComponentType<{ className?: string }>;
}

/**
 * The tool tabs. Adding a new tool = build its feature page, add a <Route> in App.tsx, and
 * add an entry here. The order here is the order shown in the tab bar.
 */
export const TABS: readonly TabDef[] = [
  { to: '/tech', label: 'Tech Tracker', shortLabel: 'Tech', icon: Hexagon },
  { to: '/objectives', label: 'Objectives', shortLabel: 'Objectives', icon: Trophy },
  { to: '/combat', label: 'Combat Calculator', shortLabel: 'Combat', icon: Crosshair },
];
