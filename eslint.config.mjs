import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import react from 'eslint-plugin-react';
import jupyter from '@jupyter/eslint-plugin';

export default tseslint.config(
  {
    ignores: [
      'node_modules',
      'dist',
      'lib',
      'coverage',
      '**/*.d.ts',
      'tests',
      '**/__tests__',
      'ui-tests',
      'packages',
      'testutils'
    ]
  },
  { plugins: { jupyter } },
  ...jupyter.configs.recommended,
  {
    rules: {
      // Enabling these would require defining a `describedBy` argument
      // schema for every command and threading a translator through every
      // component (several flagged strings are CLI snippets / product names).
      'jupyter/command-described-by': 'off',
      'jupyter/no-untranslated-string': 'off'
    }
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      react.configs.flat.recommended,
      prettierRecommended
    ],
    languageOptions: {
      parserOptions: {
        project: 'tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
        sourceType: 'module'
      }
    },
    plugins: {
      '@stylistic': stylistic
    },
    settings: {
      react: { version: 'detect' }
    },
    rules: {
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'interface',
          format: ['PascalCase'],
          custom: { regex: '^I[A-Z]', match: true }
        }
      ],
      '@typescript-eslint/no-unused-vars': ['warn', { args: 'none' }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-use-before-define': 'off',
      '@stylistic/quotes': [
        'error',
        'single',
        { avoidEscape: true, allowTemplateLiterals: false }
      ],
      curly: ['error', 'all'],
      eqeqeq: 'error',
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@mui/icons-material',
              message:
                "Please import icons using path imports, e.g. import AddIcon from '@mui/icons-material/Add'"
            }
          ],
          patterns: [
            {
              group: ['@mui/*/*/*'],
              message: '3rd level imports in mui are considered private'
            }
          ]
        }
      ],
      'prefer-arrow-callback': 'error'
    }
  }
);
