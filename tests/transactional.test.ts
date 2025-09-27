import { describe, expect, it } from '@jest/globals';
import { TestUser } from './entities';
import { testDataSource } from './setup/test-data-source';

const insertedUserName = 'User One';
const expectedPersistedCount = 1;
const expectedResetCount = 0;

describe('TransactionalTestContext', () => {
  it('rolls back persisted entities between tests', async () => {
    const repository = testDataSource.getRepository(TestUser);
    const entity = repository.create({ name: insertedUserName });
    await repository.save(entity);
    const count = await repository.count();
    expect(count).toBe(expectedPersistedCount);
  });

  it('starts with a clean state after rollback', async () => {
    const repository = testDataSource.getRepository(TestUser);
    const count = await repository.count();
    expect(count).toBe(expectedResetCount);
  });
});
