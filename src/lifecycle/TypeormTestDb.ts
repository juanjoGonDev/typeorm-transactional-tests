import type { DataSource } from "typeorm";
import type { IsolationLevel } from "typeorm/driver/types/IsolationLevel";
import { errorMessages } from "../constants/messages";
import {
  resolveIsolationContext,
  type TransactionStore,
} from "./isolation-context";

export interface TypeormTestDbOptions {
  readonly isolationLevel?: IsolationLevel;
}

export class TypeormTestDb {
  private readonly dataSource: DataSource;
  private readonly isolationLevel: IsolationLevel | undefined;
  private readonly isolationContext: ReturnType<typeof resolveIsolationContext>;

  constructor(dataSource: DataSource, options?: TypeormTestDbOptions) {
    this.dataSource = dataSource;
    this.isolationLevel = options?.isolationLevel;
    this.isolationContext = resolveIsolationContext(dataSource);
  }

  public readonly init = async (): Promise<void> => {
    if (!this.dataSource.isInitialized) {
      throw new Error(errorMessages.dataSourceNotInitialized);
    }

    const activeStore = this.isolationContext.getStore();
    if (activeStore?.active === true) {
      throw new Error(errorMessages.transactionAlreadyStarted);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction(this.isolationLevel);

    const store: TransactionStore = {
      queryRunner,
      manager: this.isolationContext.createTransactionalManager(
        queryRunner.manager,
        queryRunner
      ),
      active: false,
      savepointCounter: 0,
    };

    this.isolationContext.useStore(store);
  };

  public readonly finish = async (): Promise<void> => {
    const store = this.isolationContext.getStore();

    if (store === undefined) {
      return;
    }

    const { queryRunner } = store;

    try {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
    } finally {
      this.isolationContext.clearStore(store);
      await queryRunner.release();
    }
  };
}
