module.exports = {
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/eslint-recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:prettier/recommended',
      'plugin:react/recommended'
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
      project: 'tsconfig.json',
      sourceType: 'module'
    },
    plugins: ['@typescript-eslint'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      "@typescript-eslint/naming-convention": [
        "error",
        {
          "selector": "interface",
          "format": ["PascalCase"],
          "custom": {
            "regex": "^I[A-Z]",
            "match": true
          }
        }
      ],
      '@typescript-eslint/no-unused-vars': ['warn', { args: 'none' }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-this-alias': [
        'error',
        {
          allowedNames: ['self'], // Allow `const self = this`
        },
      ],
      '@typescript-eslint/no-use-before-define': 'off',
      '@typescript-eslint/quotes': [
        'error',
        'single',
        { avoidEscape: true, allowTemplateLiterals: false }
      ],
      curly: ['error', 'all'],
      eqeqeq: 'error',
      'prefer-arrow-callback': 'error'
    },
    settings: {
      react: {
        version: 'detect'
      }
    }
  };
