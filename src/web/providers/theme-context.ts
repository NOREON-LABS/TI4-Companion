import { createContext } from 'react'
import type { Theme } from '@web/lib/theme'

export interface ThemeContextValue {
  theme: Theme
  setThemeId: (id: string) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)
