import type { DataSource, EntityManager, QueryRunner } from 'typeorm';
import { errorMessages } from '../constants/messages';

export interface TransactionalTestLifecycle {
  readonly beforeEach: () => Promise<void>;
  readonly afterEach: () => Promise<void>;
}

export class TransactionalTestContext implements TransactionalTestLifecycle {
  private readonly dataSource: DataSource;
  private originalManager: EntityManager | null = null;
  private queryRunner: QueryRunner | null = null;
  private managerDescriptor: PropertyDescriptor | null = null;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  public readonly beforeEach = async (): Promise<void> => {
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

    this.queryRunner = queryRunner;
  };

  public readonly afterEach = async (): Promise<void> => {
    if (this.queryRunner === null) {
      return;
    }

    try {
      if (this.queryRunner.isTransactionActive) {
        await this.queryRunner.rollbackTransaction();
      }
    } finally {
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
}
