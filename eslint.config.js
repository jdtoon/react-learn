import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['**/dist/**', '**/coverage/**', '**/test-results/**', '**/playwright-report/**']),
  js.configs.recommended,
  tseslint.configs.strict,
  {
    files: ['apps/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat.recommended],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['scripts/**/*.mjs', 'eslint.config.js', 'apps/*/*.config.ts', 'apps/*/e2e/**/*.ts'],
    languageOptions: { globals: globals.node },
  },
]);
