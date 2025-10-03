import { defineConfig } from 'eslint/config';

import crycode from '@crycode/eslint-config';

export default defineConfig(
  ...crycode.configs.ts,
  ...crycode.configs.stylistic,

  {
    ignores: [
      '.dev-server/',
      '.vscode/',
      '*.test.js',
      'test/**/*.js',
      '*.config.mjs',
      'build',
      'dist',
      'admin/build',
      'admin/words.js',
      'admin/admin.d.ts',
      'admin/blockly.js',
      '**/adapter-config.d.ts',
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

  {
    files: [
      '**/*.mjs',
    ],

    rules: {
      'no-console': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
);
