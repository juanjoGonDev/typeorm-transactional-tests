const typescriptParser = '@typescript-eslint/parser';
const typescriptPlugin = '@typescript-eslint';
const recommendedConfig = 'plugin:@typescript-eslint/recommended';
const prettierConfig = 'prettier';

module.exports = {
  root: true,
  parser: typescriptParser,
  parserOptions: {
    project: ['./tsconfig.json']
  },
  env: {
    node: true,
    jest: true,
    es2021: true
  },
  plugins: [typescriptPlugin],
  extends: [recommendedConfig, prettierConfig],
  rules: {
    'import/no-default-export': 'off'
  }
};
