import { configs, plugins } from 'eslint-config-airbnb-extended'
import prettier from 'eslint-config-prettier'
import globals from 'globals'

export default [
  // Ігнорування директорій
  {
    ignores: ['node_modules/', '.idea/'],
  },

  // Реєстрація плагінів (необхідні для configs.base.recommended)
  plugins.importX,
  plugins.stylistic,

  // Airbnb Extended — base recommended (JS-only, без TypeScript правил)
  ...configs.base.recommended,

  // Prettier — завжди останнім, вимикає конфліктуючі правила ESLint
  prettier,

  // Кастомні правила проєкту (перенесені з .eslintrc)
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaVersion: 'latest',
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      'no-console': 'off',
      'no-nested-ternary': 'off',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-debugger': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
      'no-param-reassign': ['error', { props: false }],
      'func-names': ['error', 'never'],
      'no-plusplus': 'off',
      'no-underscore-dangle': 'off',
      'no-unused-expressions': 'off',
      'no-restricted-syntax': 'off',
      'prefer-destructuring': 'off',
      'max-classes-per-file': 'off',
      'class-methods-use-this': 'off',
      'no-restricted-exports': 'off',
      'max-len': 'off',
      'no-return-assign': 'off',
      // import-x правила (замість застарілого import/)
      'import-x/extensions': 'off',
      'import-x/prefer-default-export': 'off',
    },
  },
]
