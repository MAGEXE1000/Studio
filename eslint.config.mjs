import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import prettierConfig from 'eslint-config-prettier';
import livexPlugin from 'eslint-plugin-livex';
import globals from 'globals';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/node_modules/**',
      '**/.android/**',
      '**/.ios/**',
      '**/coverage/**',
      'apps/studio-android/android/**',
      'artifacts/**',
      'scratch/**',
      'scripts/**',
      'docs/**',
      'firebase-public*/**',
      'screenshots/**',
      'session_logs/**',
      '**/public/**',
    ],
  },
  {
    files: ['**/*.{ts,tsx,js,jsx,mjs,cjs}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      livex: livexPlugin,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off', // Not needed in React 17+
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/refs': 'warn',
      'no-undef': 'warn',
      'no-useless-escape': 'warn',
      'no-empty': 'warn',
      'prefer-const': 'warn',
      'react-hooks/set-state-in-effect': 'warn',

      '@typescript-eslint/no-unused-expressions': 'warn',
      'no-redeclare': 'warn',
      'no-self-assign': 'warn',
      'no-cond-assign': 'warn',
      '@typescript-eslint/no-this-alias': 'warn',
      'no-duplicate-case': 'warn',
      'no-fallthrough': 'warn',
      'no-sparse-arrays': 'warn',
      'no-func-assign': 'warn',
      'no-control-regex': 'warn',
      'no-prototype-builtins': 'warn',
      'getter-return': 'warn',
      '@typescript-eslint/no-array-constructor': 'warn',
      'no-constant-binary-expression': 'warn',
      'no-case-declarations': 'warn',
      'no-irregular-whitespace': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/rules-of-hooks': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      'no-extra-boolean-cast': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/purity': 'warn',
      'react/no-unescaped-entities': 'warn',
      'react/jsx-no-comment-textnodes': 'warn',
      'react/display-name': 'warn',

      // Livex Custom Architectural Rules
      // Set to 'warn' initially to prevent breaking the build on existing violations
      'livex/no-hardcoded-colors': 'warn',
      'livex/no-inline-springs': 'warn',
      'livex/no-stores-outside-core': 'warn',
      'livex/no-cross-feature-imports': 'error',
      'livex/no-raw-ui-primitives': 'warn',
    },
  },
  prettierConfig // Must be last to disable conflicting rules
);
