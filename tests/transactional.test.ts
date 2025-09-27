import { beforeAll, afterAll, describe, expect, it, beforeEach, afterEach } from '@jest/globals';
import { Entity, Column, PrimaryGeneratedColumn, DataSource } from 'typeorm';
import { createTransactionalTestContext, type TransactionalTestLifecycle } from '../src';

const sqliteType = 'sqlite' as const;
const memoryDatabase = ':memory:';
const entityName = 'test_user';
const firstUserName = 'User One';

@Entity({ name: entityName })
class TestUser {
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @Column({ type: 'text' })
  public name!: string;
}

describe('TransactionalTestContext', () => {
  let dataSource: DataSource;
  let transactionalLifecycle: TransactionalTestLifecycle;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: sqliteType,
      database: memoryDatabase,
      synchronize: true,
      entities: [TestUser]
    });
    await dataSource.initialize();
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    transactionalLifecycle = createTransactionalTestContext(dataSource);
    await transactionalLifecycle.beforeEach();
  });

  afterEach(async () => {
    await transactionalLifecycle.afterEach();
  });

  it('rolls back persisted entities between tests', async () => {
    const repository = dataSource.getRepository(TestUser);
    const entity = repository.create({ name: firstUserName });
    await repository.save(entity);
    const count = await repository.count();
    expect(count).toBe(1);
  });

  it('starts with a clean state after rollback', async () => {
    const repository = dataSource.getRepository(TestUser);
    const count = await repository.count();
    expect(count).toBe(0);
  });
});
