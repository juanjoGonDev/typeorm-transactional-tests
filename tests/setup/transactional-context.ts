import { createTransactionalTestContext } from 'typeorm-transactional-tests';
import { testDataSource } from './test-data-source';

export const transactionalContext = createTransactionalTestContext(testDataSource);
