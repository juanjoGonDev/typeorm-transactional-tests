import { createTransactionalTestContext } from '../../src';
import { testDataSource } from './test-data-source';

export const transactionalContext = createTransactionalTestContext(testDataSource);
