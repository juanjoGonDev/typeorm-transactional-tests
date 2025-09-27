import type { Config } from 'jest';

const nodeEnvironment = 'node';
const projectRoot = '<rootDir>/tests';
const presetName = 'ts-jest';
const testPattern = '^.+\\.(test|spec)\\.ts$';

const config: Config = {
  preset: presetName,
  testEnvironment: nodeEnvironment,
  roots: [projectRoot],
  testRegex: testPattern,
  moduleFileExtensions: ['ts', 'js'],
  collectCoverageFrom: ['src/**/*.ts'],
  coverageDirectory: 'coverage'
};

export default config;
