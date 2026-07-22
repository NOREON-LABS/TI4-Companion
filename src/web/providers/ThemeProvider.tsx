import { useLayoutEffect, type ReactNode } from 'react';
import type { Theme } from '@web/lib/theme';
import { ti4DesignTheme } from '@web/lib/themes';

const STORAGE_KEY = 'theme';
const STYLE_ID = 'ti4-theme-vars';
const FONT_LINK_ID = 'ti4-theme-font';

function buildCSS(theme: Theme): string {
  const vars = Object.entries(theme.cssVariables)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join('\n');

  // scopedCSS is injected as-is at the top level — theme authors write full selectors
  // (e.g. `[data-theme="x"] body { ... }`). This avoids a dependency on CSS nesting
  // since the <style> tag is injected at runtime and not processed by PostCSS.
  let css = `:root {\n${vars}\n}`;
  if (theme.scopedCSS) {
    css += `\n${theme.scopedCSS}`;
  }
  return css;
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme.id);

  let styleEl = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = STYLE_ID;
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = buildCSS(theme);

  let linkEl = document.getElementById(FONT_LINK_ID) as HTMLLinkElement | null;
  if (theme.fontImportUrl) {
    if (!linkEl) {
      linkEl = document.createElement('link');
      linkEl.id = FONT_LINK_ID;
      linkEl.rel = 'stylesheet';
      document.head.appendChild(linkEl);
    }
    linkEl.href = theme.fontImportUrl;
  } else {
    linkEl?.remove();
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // useLayoutEffect fires synchronously before the browser paints — no FOUC.
  useLayoutEffect(() => {
    localStorage.removeItem(STORAGE_KEY);
    applyTheme(ti4DesignTheme);
  }, []);

  return children;
}
