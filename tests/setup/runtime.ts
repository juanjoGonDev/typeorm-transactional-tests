import { afterAll, afterEach, beforeAll, beforeEach } from "@jest/globals";
import { TypeormTestDB } from "../../dist/index";
import { prepareTestDatabase, testDataSource } from "./test-data-source";

const initializationErrorMessage =
  "Failed to initialize the shared test data source.";
const destructionErrorMessage =
  "Failed to destroy the shared test data source.";
const fallbackErrorMessage = "Unknown error";
const causePrefix = "Cause: ";
const detailSeparator = " ";
const concurrencySuiteTitle = "TypeORM test database concurrent isolation";
const concurrencyTestFileSuffix = "transactional-concurrency.test.ts";

type JestState = {
  readonly currentTestName?: unknown;
  readonly testPath?: unknown;
};

type ResolvedTestContext = {
  readonly name: string | null;
  readonly path: string | null;
};

const toError = (value: unknown): Error => {
  if (value instanceof Error) {
    return value;
  }
  if (typeof value === "string") {
    return new Error(value);
  }
  return new Error(fallbackErrorMessage);
};

const composeErrorMessage = (message: string, cause: Error): string => {
  return `${message}${detailSeparator}${causePrefix}${cause.message}`;
};

const resolveTestContext = (): ResolvedTestContext => {
  const maybeExpect = (globalThis as Record<string, unknown>).expect;
  if (maybeExpect !== undefined && maybeExpect !== null) {
    const getState = (maybeExpect as { getState?: () => JestState }).getState;
    if (typeof getState === "function") {
      const state = getState();
      if (state !== undefined && state !== null) {
        const { currentTestName, testPath } = state as JestState;
        return {
          name:
            typeof currentTestName === "string" && currentTestName.length > 0
              ? currentTestName
              : null,
          path:
            typeof testPath === "string" && testPath.length > 0
              ? testPath
              : null,
        };
      }
    }
  }
  return { name: null, path: null };
};

const isConcurrencyTest = ({ name, path }: ResolvedTestContext): boolean => {
  if (name !== null && name.startsWith(concurrencySuiteTitle)) {
    return true;
  }
  if (path !== null && path.endsWith(concurrencyTestFileSuffix)) {
    return true;
  }
  return false;
};

export const registerTypeormTestDbEnvironment = (): void => {
  const lifecycle = TypeormTestDB(testDataSource);

  beforeEach(async () => {
    if (isConcurrencyTest(resolveTestContext())) {
      return;
    }
    await lifecycle.init();
  });

  afterEach(async () => {
    if (isConcurrencyTest(resolveTestContext())) {
      return;
    }
    await lifecycle.finish();
  });

  beforeAll(async () => {
    try {
      await prepareTestDatabase();
      if (!testDataSource.isInitialized) {
        await testDataSource.initialize();
      }
    } catch (error) {
      throw new Error(
        composeErrorMessage(initializationErrorMessage, toError(error))
      );
    }
  });

  afterAll(async () => {
    try {
      if (testDataSource.isInitialized) {
        await testDataSource.destroy();
      }
    } catch (error) {
      throw new Error(
        composeErrorMessage(destructionErrorMessage, toError(error))
      );
    }
  });
};
