import type { DataSource, EntityManager, IsolationLevel, QueryRunner } from 'typeorm';
import { errorMessages } from '../constants/messages';

export interface TransactionalTestLifecycle {
  readonly init: () => Promise<void>;
  readonly finish: () => Promise<void>;
}

export class TransactionalTestContext implements TransactionalTestLifecycle {
  private readonly dataSource: DataSource;
  private originalManager: EntityManager | null = null;
  private queryRunner: QueryRunner | null = null;
  private managerDescriptor: PropertyDescriptor | null = null;
  private originalDataSourceTransaction: DataSource['transaction'] | null = null;
  private originalManagerTransaction: EntityManager['transaction'] | null = null;
  private patchedManager: EntityManager | null = null;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  public readonly init = async (): Promise<void> => {
    if (!this.dataSource.isInitialized) {
      throw new Error(errorMessages.dataSourceNotInitialized);
    }

    if (this.queryRunner !== null) {
      throw new Error(errorMessages.transactionAlreadyStarted);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    this.originalManager = this.dataSource.manager;
    this.managerDescriptor = Object.getOwnPropertyDescriptor(this.dataSource, 'manager') ?? null;

    Object.defineProperty(this.dataSource, 'manager', {
      configurable: true,
      enumerable: true,
      get: () => queryRunner.manager
    });

    this.patchTransactions(queryRunner.manager);

    this.queryRunner = queryRunner;
  };

  public readonly finish = async (): Promise<void> => {
    if (this.queryRunner === null) {
      return;
    }

    try {
      if (this.queryRunner.isTransactionActive) {
        await this.queryRunner.rollbackTransaction();
      }
    } finally {
      this.restoreTransactions();
      await this.queryRunner.release();
      this.restoreManager();
      this.queryRunner = null;
      this.originalManager = null;
      this.managerDescriptor = null;
    }
  };

  private restoreManager(): void {
    if (this.originalManager === null) {
      return;
    }

    const descriptor = this.managerDescriptor;

    if (descriptor !== null) {
      Object.defineProperty(this.dataSource, 'manager', descriptor);
      return;
    }

    Object.defineProperty(this.dataSource, 'manager', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: this.originalManager
    });
  }

  private extractTransactionCallback<T>(args: unknown[]): (manager: EntityManager) => Promise<T> | T {
    const [first, second] = args;
    if (this.isTransactionCallback<T>(first)) {
      return first;
    }
    if (this.isTransactionCallback<T>(second)) {
      return second;
    }
    throw new Error(errorMessages.transactionCallbackMissing);
  }

  private isTransactionCallback<T>(candidate: unknown): candidate is (manager: EntityManager) => Promise<T> | T {
    return typeof candidate === 'function';
  }

  private patchTransactions(manager: EntityManager): void {
    this.patchedManager = manager;
    this.originalDataSourceTransaction = this.dataSource.transaction.bind(this.dataSource);
    this.originalManagerTransaction = manager.transaction.bind(manager);

    const patched = async <T>(...args: unknown[]): Promise<T> => {
      const callback = this.extractTransactionCallback<T>(args);
      const result = callback(manager);
      return Promise.resolve(result);
    };

    const patchedWithIsolation = async <T>(
      isolationOrCallback: IsolationLevel | ((runManager: EntityManager) => Promise<T> | T),
      maybeCallback?: (runManager: EntityManager) => Promise<T> | T
    ): Promise<T> => {
      const args = maybeCallback === undefined ? [isolationOrCallback] : [isolationOrCallback, maybeCallback];
      return patched<T>(...args);
    };

    (this.dataSource as unknown as Record<'transaction', DataSource['transaction']>).transaction = patchedWithIsolation;
    (manager as unknown as Record<'transaction', EntityManager['transaction']>).transaction = patchedWithIsolation;
  }

  private restoreTransactions(): void {
    if (this.originalDataSourceTransaction !== null) {
      (this.dataSource as unknown as Record<'transaction', DataSource['transaction']>).transaction = this.originalDataSourceTransaction;
      this.originalDataSourceTransaction = null;
    }

    if (this.patchedManager !== null && this.originalManagerTransaction !== null) {
      (this.patchedManager as unknown as Record<'transaction', EntityManager['transaction']>).transaction = this.originalManagerTransaction;
    }

    this.patchedManager = null;
    this.originalManagerTransaction = null;
  }
}
