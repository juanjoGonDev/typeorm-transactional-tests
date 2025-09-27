import { afterAll, afterEach, beforeAll, beforeEach } from '@jest/globals';
import { transactionalContext } from './transactional-context';
import { testDataSource } from './test-data-source';

const initializationErrorMessage = 'Failed to initialize the shared test data source.';
const destructionErrorMessage = 'Failed to destroy the shared test data source.';
const fallbackErrorMessage = 'Unknown error';
const causePrefix = 'Cause: ';
const detailSeparator = ' ';

const toError = (value: unknown): Error => {
  if (value instanceof Error) {
    return value;
  }
  if (typeof value === 'string') {
    return new Error(value);
  }
  return new Error(fallbackErrorMessage);
};

const composeErrorMessage = (message: string, cause: Error): string => {
  return `${message}${detailSeparator}${causePrefix}${cause.message}`;
};

beforeAll(async () => {
  try {
    if (!testDataSource.isInitialized) {
      await testDataSource.initialize();
    }
  } catch (error) {
    throw new Error(composeErrorMessage(initializationErrorMessage, toError(error)));
  }
});

afterAll(async () => {
  try {
    if (testDataSource.isInitialized) {
      await testDataSource.destroy();
    }
  } catch (error) {
    throw new Error(composeErrorMessage(destructionErrorMessage, toError(error)));
  }
});

beforeEach(async () => {
  await transactionalContext.init();
});

afterEach(async () => {
  await transactionalContext.finish();
});
