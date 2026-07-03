import type { Theme } from '../theme'

export const defaultTheme: Theme = {
  id: 'default',
  label: 'Default',
  cssVariables: {
    '--background': '226 42% 7%',
    '--foreground': '210 40% 96%',
    '--card': '224 38% 11%',
    '--card-foreground': '210 40% 96%',
    '--popover': '224 40% 10%',
    '--popover-foreground': '210 40% 96%',
    '--primary': '40 92% 56%',
    '--primary-foreground': '30 50% 9%',
    '--secondary': '222 30% 18%',
    '--secondary-foreground': '210 40% 96%',
    '--muted': '222 26% 17%',
    '--muted-foreground': '215 18% 60%',
    '--accent': '222 30% 20%',
    '--accent-foreground': '210 40% 98%',
    '--destructive': '0 63% 40%',
    '--destructive-foreground': '210 40% 98%',
    '--border': '220 26% 20%',
    '--input': '220 26% 22%',
    '--ring': '40 92% 56%',
    '--radius': '0.6rem',
    '--tech-blue': '211 95% 62%',
    '--tech-green': '145 63% 49%',
    '--tech-yellow': '45 95% 58%',
    '--tech-red': '0 80% 62%',
    '--tech-unit': '220 12% 62%',
  },
  scopedCSS: `
[data-theme="default"] body {
  background-image:
    radial-gradient(1100px 520px at 50% -8%, hsl(224 60% 18% / 0.55), transparent 68%),
    radial-gradient(800px 600px at 100% 0%, hsl(265 50% 16% / 0.35), transparent 60%);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
[data-theme="default"] .font-display {
  font-family: Bahnschrift, 'DIN Alternate', 'Arial Narrow', ui-sans-serif, sans-serif;
}
  `,
}
