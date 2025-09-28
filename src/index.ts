import type { DataSource } from 'typeorm';
import { TransactionalTestContext, type TransactionalTestLifecycle } from './lifecycle/TransactionalTestContext';
import { registerTransactionalTestHooks } from './lifecycle/registerTransactionalHooks';

export const createTransactionalTestContext = (dataSource: DataSource): TransactionalTestLifecycle => {
  return new TransactionalTestContext(dataSource);
};

export { registerTransactionalTestHooks };

export type { TransactionalTestLifecycle } from './lifecycle/TransactionalTestContext';
export type {
  RegisterTransactionalTestHooksOptions,
  RegisteredTransactionalTestHooks,
  TransactionalTestHooks
} from './lifecycle/registerTransactionalHooks';
