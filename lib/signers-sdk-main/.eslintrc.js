module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js', '**/*.spec.ts', 'src/migrations'],
  rules: {
    'prettier/prettier': ['error', { singleQuote: true }],
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', {args: 'none'}],
    '@typescript-eslint/no-duplicate-enum-values': 'off',
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-var-requires': 'error',
    '@typescript-eslint/ban-types': 'off',
  },
};
