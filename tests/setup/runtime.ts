import { afterAll, afterEach, beforeAll, beforeEach } from "@jest/globals";
import { registerTransactionalTestHooks } from "../../dist/index";
import { prepareTestDatabase, testDataSource } from "./test-data-source";

const initializationErrorMessage =
  "Failed to initialize the shared test data source.";
const destructionErrorMessage =
  "Failed to destroy the shared test data source.";
const fallbackErrorMessage = "Unknown error";
const causePrefix = "Cause: ";
const detailSeparator = " ";
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

export const registerTransactionalEnvironment = (): void => {
  registerTransactionalTestHooks({
    dataSource: testDataSource,
    hooks: {
      beforeEach,
      afterEach,
    },
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
