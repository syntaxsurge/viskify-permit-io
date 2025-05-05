import typescriptEslint from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import eslintConfigPrettier from 'eslint-config-prettier'
import eslintPluginImport from 'eslint-plugin-import'
import eslintPluginPrettier from 'eslint-plugin-prettier'
import unusedImports from 'eslint-plugin-unused-imports'
import yamlParser from 'yaml-eslint-parser'
import eslintPluginYml from 'eslint-plugin-yml'

export default [
  /* ----------------------------------------------------- */
  /* Global settings                                       */
  /* ----------------------------------------------------- */
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/out/**',
      '**/public/**',
      '**/artifacts/**',
      '**/cache/**',
      '**/typechain-types/**',
      '**/.git/**',
      '**/.vscode/**',
      '**/.idea/**',
      '**/.husky/**',
      '**/.vercel/**',
      '**/.turbo/**',
      '**/.output/**',
      '**/.cache/**',
      '**/.DS_Store',
    ],
  },

  /* Prettier config-turnoff to let Prettier handle style */
  eslintConfigPrettier,

  /* ----------------------------------------------------- */
  /* TypeScript / TSX rules                                */
  /* ----------------------------------------------------- */
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
      'unused-imports': unusedImports,
      import: eslintPluginImport,
      prettier: eslintPluginPrettier,
    },
    rules: {
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'import/no-duplicates': 'error',
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
          pathGroups: [
            {
              pattern: '{react,next/**,@next/**}',
              group: 'external',
              position: 'before',
            },
            {
              pattern: '{@/components/**,@/lib/**,@/**}',
              group: 'internal',
              position: 'after',
            },
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
          'newlines-between': 'always',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'prettier/prettier': 'warn',
    },
  },

  /* ----------------------------------------------------- */
  /* YAML (Permit policy) rules                            */
  /* ----------------------------------------------------- */
  {
    files: ['permit/**/*.y?(a)ml'],
    languageOptions: {
      parser: yamlParser,
    },
    plugins: {
      yml: eslintPluginYml,
      prettier: eslintPluginPrettier,
    },
    rules: {
      /* Use Prettier for formatting; enable any yml-specific rules as needed */
      'prettier/prettier': 'warn',
    },
  },
]