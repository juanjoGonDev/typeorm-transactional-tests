const tsEslint = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const prettierConfig = require('eslint-config-prettier');

const ignoreDirectories = ['dist', 'node_modules', 'coverage'];
const tsFilePatterns = ['**/*.ts', '**/*.tsx'];
const ecmaVersionTarget = 2021;
const moduleSourceType = 'module';
const tsconfigPath = './tsconfig.json';
const configKeyCandidates = ['recommended-type-checked', 'recommendedTypeChecked'];
const missingConfigMessage = 'Missing recommended type-checked configuration for @typescript-eslint/eslint-plugin';
const importNoDefaultExportRule = 'import/no-default-export';
const disabledRuleState = 'off';
const disabledTypeSafetyRules = {
  '@typescript-eslint/no-unsafe-assignment': disabledRuleState,
  '@typescript-eslint/no-unsafe-call': disabledRuleState,
  '@typescript-eslint/no-unsafe-member-access': disabledRuleState,
  '@typescript-eslint/no-unsafe-return': disabledRuleState,
  '@typescript-eslint/no-unsafe-argument': disabledRuleState,
  '@typescript-eslint/no-redundant-type-constituents': disabledRuleState
};

const recommendedConfig = configKeyCandidates
  .map((key) => (tsEslint.configs ? tsEslint.configs[key] : undefined))
  .find((config) => Boolean(config));

if (!recommendedConfig) {
  throw new Error(missingConfigMessage);
}

const prettierRules = prettierConfig && prettierConfig.rules ? prettierConfig.rules : {};

module.exports = [
  {
    ignores: ignoreDirectories
  },
  {
    files: tsFilePatterns,
    languageOptions: {
      ecmaVersion: ecmaVersionTarget,
      sourceType: moduleSourceType,
      parser: tsParser,
      parserOptions: {
        project: tsconfigPath,
        tsconfigRootDir: __dirname
      }
    },
    plugins: {
      '@typescript-eslint': tsEslint
    },
    rules: {
      ...recommendedConfig.rules,
      ...prettierRules,
      ...disabledTypeSafetyRules,
      [importNoDefaultExportRule]: disabledRuleState
    }
  }
];
