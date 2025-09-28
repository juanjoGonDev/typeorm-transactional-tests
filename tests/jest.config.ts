import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["."],
  testRegex: "^.+\\.(test|spec)\\.ts$",
  moduleFileExtensions: ["ts", "js"],
  setupFilesAfterEnv: ["./setup/environment.ts"],
  collectCoverage: true,
  collectCoverageFrom: ["src/**/*.ts"],
  coverageDirectory: "coverage",
  testSequencer: "./setup/test-sequencer.js",
  moduleNameMapper: {
    ["^typeorm-test-db$"]: "<rootDir>/dist",
  },
};

export default config;
