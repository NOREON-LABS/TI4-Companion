import { defaultTheme } from './default'
import { ti4DesignTheme } from './ti4-design'
import type { Theme } from '../theme'

export { defaultTheme, ti4DesignTheme }

/** All registered themes. Add new themes here — they appear in the ThemeSwitcher automatically. */
export const themes: Theme[] = [defaultTheme, ti4DesignTheme]

export function getTheme(id: string): Theme {
  return themes.find(t => t.id === id) ?? defaultTheme
}
