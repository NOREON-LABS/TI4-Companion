import { Check, Paintbrush } from 'lucide-react'
import { themes } from '@web/lib/themes'
import { useTheme } from '@web/hooks/useTheme'
import { Popover, PopoverContent, PopoverTrigger } from '@web/components/ui/popover'
import { cn } from '@web/lib/utils'

export function ThemeSwitcher() {
  const { theme, setThemeId } = useTheme()

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          'flex min-h-9 items-center gap-2 rounded-md border border-transparent px-3 py-2 text-sm font-medium text-muted-foreground transition-colors',
          'hover:bg-card/40 hover:text-foreground',
        )}
        aria-label="Switch theme"
      >
        <Paintbrush className="h-4 w-4" />
        <span className="hidden sm:inline">{theme.label}</span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-44 p-1">
        <ul role="listbox" aria-label="Themes">
          {themes.map(t => (
            <li key={t.id}>
              <button
                role="option"
                aria-selected={t.id === theme.id}
                onClick={() => setThemeId(t.id)}
                className={cn(
                  'flex w-full items-center gap-2 rounded px-3 py-2 text-sm transition-colors',
                  t.id === theme.id
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                )}
              >
                <Check
                  className={cn('h-3.5 w-3.5 shrink-0', t.id !== theme.id && 'invisible')}
                />
                {t.label}
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
