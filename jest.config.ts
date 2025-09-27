import type { Config } from 'jest';

const nodeEnvironment = 'node';
const projectRoot = '<rootDir>/tests';
const presetName = 'ts-jest';
const testPattern = '^.+\\.(test|spec)\\.ts$';
const setupFile = '<rootDir>/tests/setup/environment.ts';
const sequencerFile = '<rootDir>/tests/setup/test-sequencer.js';
const packageModuleMapper = '^typeorm-transactional-tests$';
const compiledOutput = '<rootDir>/dist';

const config: Config = {
  preset: presetName,
  testEnvironment: nodeEnvironment,
  roots: [projectRoot],
  testRegex: testPattern,
  moduleFileExtensions: ['ts', 'js'],
  setupFilesAfterEnv: [setupFile],
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.ts'],
  coverageDirectory: 'coverage',
  testSequencer: sequencerFile,
  moduleNameMapper: {
    [packageModuleMapper]: compiledOutput
  }
};

export default config;
