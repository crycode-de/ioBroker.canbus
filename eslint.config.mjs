import tseslint from 'typescript-eslint';

import crycode from '@crycode/eslint-config';

export default tseslint.config(
  ...crycode.configs.ts,
  ...crycode.configs.stylistic,

  {
    ignores: [
      'admin/build/',
      'build/',
      'test/',
    ],
  },

  {
    files: [
      'src/**/*',
      'admin/src/**/*',
    ],

    languageOptions: {
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: [
          './tsconfig.json',
          './admin/tsconfig.json',
        ],
      },
    },

    rules: {
      '@typescript-eslint/prefer-regexp-exec': 'off',
      '@stylistic/multiline-ternary': 'off',
    },

  },

  {
    files: [
      'admin/src/**/*',
    ],

    rules: {
      '@stylistic/jsx-one-expression-per-line': 'off',
      'no-console': 'off',
    },
  },
);
