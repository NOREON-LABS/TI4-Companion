export interface Theme {
  id: string;
  label: string;
  /** HSL channel values — format Tailwind expects: "226 42% 7%" (no hsl() wrapper) */
  cssVariables: Record<string, string>;
  /**
   * Raw CSS injected into a managed <style> tag at the top level (not nested).
   * Write full selectors, e.g. `[data-theme="myTheme"] body { font-family: ... }`.
   * Use for multi-value properties (background-image, font-family) and element-level
   * overrides that cannot be expressed as a single CSS variable.
   *
   * Extension point for future structural themes: target stable data attributes
   * on elements (e.g. [data-prereq-pip], [data-tech-item]) to restyle components
   * without changing their markup. Component swapping (swapping the React component
   * itself) is not supported in v1 — add a `components` key when needed.
   */
  scopedCSS?: string;
  /** External font stylesheet URL. ThemeProvider inserts/removes a <link> element. */
  fontImportUrl?: string;
}
