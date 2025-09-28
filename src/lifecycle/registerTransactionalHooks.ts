import type { DataSource } from 'typeorm';
import { TransactionalTestContext, type TransactionalTestLifecycle } from './TransactionalTestContext';

type HookCallback = () => Promise<void> | void;

export interface TransactionalTestHooks {
  readonly beforeEach: (callback: HookCallback) => unknown;
  readonly afterEach: (callback: HookCallback) => unknown;
}

export interface RegisterTransactionalTestHooksOptions {
  readonly dataSource: DataSource;
  readonly hooks: TransactionalTestHooks;
}

export interface RegisteredTransactionalTestHooks {
  readonly lifecycle: TransactionalTestLifecycle;
}

export const registerTransactionalTestHooks = (
  options: RegisterTransactionalTestHooksOptions
): RegisteredTransactionalTestHooks => {
  const context = new TransactionalTestContext(options.dataSource);

  options.hooks.beforeEach(async () => {
    await context.init();
  });

  options.hooks.afterEach(async () => {
    await context.finish();
  });

  return { lifecycle: context };
};
