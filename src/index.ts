import type { DataSource } from 'typeorm';
import { TransactionalTestContext, type TransactionalTestLifecycle } from './lifecycle/TransactionalTestContext';

export const createTransactionalTestContext = (dataSource: DataSource): TransactionalTestLifecycle => {
  return new TransactionalTestContext(dataSource);
};

export type { TransactionalTestLifecycle };
