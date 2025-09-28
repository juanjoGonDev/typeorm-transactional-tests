import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testRegex: "^.+\\.(test|spec)\\.ts$",
  moduleFileExtensions: ["ts", "js"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup/environment.ts"],
  collectCoverage: true,
  collectCoverageFrom: ["src/**/*.ts"],
  coverageDirectory: "coverage",
  testSequencer: "<rootDir>/tests/setup/test-sequencer.js",
  moduleNameMapper: {
    ["^typeorm-transactional-tests$"]: "<rootDir>/dist",
  },
};

export default config;
