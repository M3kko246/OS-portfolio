// @ts-check
import js from '@eslint/js';
import eslintReact from '@eslint-react/eslint-plugin';
import prettier from 'eslint-config-prettier';
import astro from 'eslint-plugin-astro';
import jsxA11y from 'eslint-plugin-jsx-a11y-x';
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  {
    ignores: ['dist/', '.astro/', 'art/', 'playwright-report/', 'test-results/', '.lighthouseci/'],
  },
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      // Conflicts with no-non-null-assertion (strict): explicit `as T` narrowing stays allowed.
      '@typescript-eslint/non-nullable-type-assertion-style': 'off',
    },
  },
  astro.configs['flat/recommended'],
  {
    files: ['**/*.astro', '**/*.{js,mjs,cjs}'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    files: ['**/*.tsx'],
    extends: [
      eslintReact.configs['recommended-type-checked'],
      reactHooks.configs.flat['recommended-latest'],
      jsxA11y.configs.recommended,
    ],
  },
  prettier,
);
