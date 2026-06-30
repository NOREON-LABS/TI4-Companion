import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import boundaries from 'eslint-plugin-boundaries';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: ['dist', 'node_modules', 'src/db/migrations', 'src/web/components/ui/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Architecture boundaries — the load-bearing rule for this codebase.
  // Layers: domain (pure) <- db <- server ;  domain <- web ; features are isolated.
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { boundaries },
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
    settings: {
      'boundaries/include': ['src/**/*'],
      'boundaries/elements': [
        { type: 'domain', mode: 'folder', pattern: 'src/domain' },
        { type: 'db', mode: 'folder', pattern: 'src/db' },
        { type: 'server', mode: 'folder', pattern: 'src/server' },
        { type: 'feature', mode: 'folder', pattern: 'src/web/features/*', capture: ['feature'] },
        { type: 'web', mode: 'folder', pattern: 'src/web' },
      ],
      'import/resolver': {
        typescript: { project: './tsconfig.json' },
      },
    },
    rules: {
      'boundaries/no-unknown': 'off',
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          message: '${file.type} is not allowed to import ${dependency.type} (architecture boundary)',
          rules: [
            { from: 'domain', allow: ['domain'] },
            { from: 'db', allow: ['domain', 'db'] },
            { from: 'server', allow: ['domain', 'db', 'server'] },
            { from: 'web', allow: ['domain', 'server', 'web', 'feature'] },
            {
              from: 'feature',
              allow: [
                'domain',
                'server',
                'web',
                ['feature', { feature: '${from.feature}' }],
              ],
            },
          ],
        },
      ],
    },
  },

  // React-specific rules for the web client.
  {
    files: ['src/web/**/*.{ts,tsx}'],
    plugins: { 'react-refresh': reactRefresh, 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },

  // Config files and Node scripts run in Node and aren't part of the layered source.
  {
    files: ['*.{js,ts}', 'scripts/**/*.{js,mjs,ts}'],
    languageOptions: { globals: { ...globals.node } },
  },
);
