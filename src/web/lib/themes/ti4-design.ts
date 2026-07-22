import type { Theme } from '../theme';

export const ti4DesignTheme: Theme = {
  id: 'ti4-design',
  label: 'TI4 Design',
  fontImportUrl:
    'https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;500;600&family=Michroma&display=swap',
  cssVariables: {
    '--background': '220 46% 5%',
    '--foreground': '215 55% 96%',
    '--card': '224 33% 7%',
    '--card-foreground': '215 55% 96%',
    '--popover': '222 45% 4%',
    '--popover-foreground': '215 55% 96%',
    // Primary action: propulsion blue instead of amber
    '--primary': '212 100% 68%',
    '--primary-foreground': '220 60% 4%',
    '--secondary': '219 36% 9%',
    '--secondary-foreground': '215 55% 96%',
    '--muted': '224 33% 7%',
    '--muted-foreground': '218 15% 62%',
    '--accent': '225 37% 13%',
    '--accent-foreground': '215 55% 96%',
    '--destructive': '355 100% 69%',
    '--destructive-foreground': '220 60% 4%',
    '--border': '221 26% 20%',
    '--input': '222 30% 22%',
    '--ring': '212 100% 68%',
    '--radius': '0.5rem',
    // Tech track colours — slightly more vivid than the default
    '--tech-blue': '212 100% 68%',
    '--tech-green': '157 69% 53%',
    '--tech-yellow': '45 86% 62%',
    '--tech-red': '355 100% 69%',
    '--tech-unit': '221 16% 61%',
  },
  scopedCSS: `
[data-theme="ti4-design"] body {
  font-family: 'Chakra Petch', ui-sans-serif, system-ui, sans-serif;
  background-image:
    radial-gradient(1000px 480px at 50% -5%, hsl(220 70% 14% / 0.45), transparent 65%),
    radial-gradient(700px 500px at 100% 0%, hsl(256 45% 14% / 0.2), transparent 60%);
}
[data-theme="ti4-design"] .font-display {
  font-family: 'Michroma', ui-sans-serif, sans-serif;
}
[data-theme="ti4-design"] [data-prereq-pip] {
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  border-radius: 0;
  box-shadow: none;
}
  `,
};
