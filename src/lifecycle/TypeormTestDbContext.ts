import type { DataSource, EntityManager, QueryRunner } from 'typeorm';
import { errorMessages } from '../constants/messages';

export interface TypeormTestDbLifecycle {
  readonly init: () => Promise<void>;
  readonly finish: () => Promise<void>;
}

type LifecycleCallback<TResult> = (runManager: EntityManager) => Promise<TResult> | TResult;

export class TypeormTestDbContext implements TypeormTestDbLifecycle {
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

  private extractLifecycleCallback<T>(args: ReadonlyArray<unknown>): LifecycleCallback<T> {
    const [first, second] = args;
    if (this.isLifecycleCallback<T>(first)) {
      return first;
    }
    if (this.isLifecycleCallback<T>(second)) {
      return second;
    }
    throw new Error(errorMessages.transactionCallbackMissing);
  }

  private isLifecycleCallback<T>(candidate: unknown): candidate is LifecycleCallback<T> {
    return typeof candidate === 'function';
  }

  private patchTransactions(manager: EntityManager): void {
    this.patchedManager = manager;
    this.originalDataSourceTransaction = this.dataSource.transaction.bind(this.dataSource);
    this.originalManagerTransaction = manager.transaction.bind(manager);

    const patched = async <T>(...args: ReadonlyArray<unknown>): Promise<T> => {
      const callback = this.extractLifecycleCallback<T>(args);
      const result = callback(manager);
      return Promise.resolve(result);
    };

    const patchedWithIsolation = async <T>(...args: ReadonlyArray<unknown>): Promise<T> => {
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
