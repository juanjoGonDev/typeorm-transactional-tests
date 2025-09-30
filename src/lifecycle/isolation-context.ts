import { AsyncLocalStorage } from "node:async_hooks";
import type { DataSource, EntityManager, EntityTarget, ObjectLiteral, QueryRunner, Repository } from "typeorm";
import { EntityManager as TypeormEntityManager } from "typeorm";
import { errorMessages } from "../constants/messages";

type TransactionCallback<TResult> = (
  manager: EntityManager
) => Promise<TResult> | TResult;

type TransactionArgs = ReadonlyArray<unknown>;

export type TransactionStore = {
  readonly queryRunner: QueryRunner;
  readonly manager: EntityManager;
  active: boolean;
  savepointCounter: number;
};

const savepointPrefix = "ttdb_savepoint_";
const maxTransactionAttempts = 5;
const retryDelayBaseMs = 5;
const retryableMessageFragments = [
  "deadlock found when trying to get lock",
  "lock wait timeout exceeded",
  "record has changed since last read",
  "database is locked",
  "busy",
];

class DataSourceIsolationContext {
    private readonly lockingDrivers = new Set(["mysql", "mariadb", "postgres"]);
  private readonly storage = new AsyncLocalStorage<TransactionStore | undefined>();
  private readonly namedStores = new Map<string, TransactionStore>();
  private readonly pendingStores: TransactionStore[] = [];
  private readonly managerDescriptor:
    | PropertyDescriptor
    | null = Object.getOwnPropertyDescriptor(this.dataSource, "manager") ?? null;
  private fallbackManager: EntityManager = this.resolveInitialManager();
  private readonly originalDataSourceTransaction: (
    ...args: unknown[]
  ) => Promise<unknown>;

  constructor(private readonly dataSource: DataSource) {
    this.originalDataSourceTransaction = this.dataSource.transaction.bind(
      this.dataSource
    ) as (...args: unknown[]) => Promise<unknown>;
    this.patchManagerProperty();
    this.patchDataSourceTransaction();
  }

  public useStore(store: TransactionStore): void {
    store.active = true;
    this.storage.enterWith(store);
    const testKey = resolveCurrentTestKey();
    if (testKey !== null) {
      this.namedStores.set(testKey, store);
      return;
    }
    this.pendingStores.push(store);
  }

  public clearStore(store: TransactionStore): void {
    store.active = false;
    const current = this.storage.getStore();
    if (current === store) {
      this.storage.enterWith(undefined);
    }
    const testKey = resolveCurrentTestKey();
    if (testKey !== null) {
      const mappedStore = this.namedStores.get(testKey);
      if (mappedStore === store) {
        this.namedStores.delete(testKey);
      }
    } else {
      const index = this.pendingStores.indexOf(store);
      if (index !== -1) {
        this.pendingStores.splice(index, 1);
      }
    }
  }

  public getStore(): TransactionStore | undefined {
    const activeStore = this.storage.getStore();
    if (activeStore?.active === true) {
      return activeStore;
    }

    const testKey = resolveCurrentTestKey();
    if (testKey !== null) {
      let namedStore = this.namedStores.get(testKey);
      if (namedStore === undefined && this.pendingStores.length > 0) {
        const pending = this.pendingStores.shift();
        if (pending !== undefined) {
          this.namedStores.set(testKey, pending);
          namedStore = pending;
        }
      }
      if (namedStore?.active === true) {
        this.storage.enterWith(namedStore);
        return namedStore;
      }
    }

    return activeStore;
  }

  private resolveInitialManager(): EntityManager {
    if (this.managerDescriptor?.get !== undefined) {
      const resolved = this.managerDescriptor.get.call(this.dataSource);
      if (resolved !== undefined) {
        return resolved as EntityManager;
      }
    }
    return this.dataSource.manager;
  }

  private patchManagerProperty(): void {
    const context = this;
    const descriptor = this.managerDescriptor;

    Object.defineProperty(this.dataSource, "manager", {
      configurable: true,
      enumerable: true,
      get(): EntityManager {
        const store = context.storage.getStore();
        if (store?.active === true) {
          return store.manager;
        }
        const testKey = resolveCurrentTestKey();
        if (testKey !== null) {
          const namedStore = context.namedStores.get(testKey);
          if (namedStore?.active === true) {
            context.storage.enterWith(namedStore);
            return namedStore.manager;
          }
        }
        if (descriptor?.get !== undefined) {
          return descriptor.get.call(this) as EntityManager;
        }
        return context.fallbackManager;
      },
      set(manager: EntityManager) {
        if (descriptor?.set !== undefined) {
          descriptor.set.call(this, manager);
        }
        context.fallbackManager = manager;
      },
    });
  }

  private patchDataSourceTransaction(): void {
    const context = this;

    this.dataSource.transaction = (async function patchedTransaction<TResult>(
      this: DataSource,
      ...args: unknown[]
    ): Promise<TResult> {
      const store = context.getStore();
      if (store?.active === true) {
        const callback = findTransactionCallback<TResult>(args);
        if (callback === null) {
          throw new Error(errorMessages.transactionCallbackMissing);
        }
        return await context.runWithStoreTransaction(store, async () => {
          return await callback(store.manager);
        });
      }
      return context.originalDataSourceTransaction(...args) as Promise<TResult>;
    }) as DataSource["transaction"];
  }


public createTransactionalManager(
  originalManager: EntityManager,
  queryRunner: QueryRunner
): EntityManager {
  const driver = (queryRunner.connection.options.type ?? "").toLowerCase();
  if (!this.lockingDrivers.has(driver)) {
    return originalManager;
  }

  const repositoryCache = new WeakMap<object, unknown>();
  const wrapRepository = (repository: unknown): unknown => {
    if (repository === null || typeof repository !== "object") {
      return repository;
    }
    const cached = repositoryCache.get(repository as object);
    if (cached !== undefined) {
      return cached;
    }
    const proxy = new Proxy(repository as Record<string, unknown>, {
      get: (target, property, receiver) => {
        if (
          property === "findOne" ||
          property === "findOneOrFail" ||
          property === "findOneBy" ||
          property === "findOneByOrFail"
        ) {
          const original = Reflect.get(target, property, receiver) as (
            ...args: any[]
          ) => unknown;
          if (typeof original !== "function") {
            return original;
          }
          return (...fnArgs: unknown[]) => {
            return this.withPessimisticLock(
              queryRunner,
              target as Record<string, unknown>,
              property.toString(),
              fnArgs,
              () => original.apply(target, fnArgs as any[])
            );
          };
        }
        return Reflect.get(target, property, receiver);
      },
    });
    repositoryCache.set(repository as object, proxy);
    return proxy;
  };

  return new Proxy(originalManager, {
    get: (target, property, receiver) => {
      if (
        property === "findOne" ||
        property === "findOneOrFail" ||
        property === "findOneBy" ||
        property === "findOneByOrFail"
      ) {
        const original = Reflect.get(target, property, receiver) as (
          ...args: any[]
        ) => unknown;
        if (typeof original !== "function") {
          return original;
        }
        return (...fnArgs: unknown[]) => {
          if (fnArgs.length === 0) {
            return original.apply(target, fnArgs as any[]);
          }
          const [entity, ...rest] = fnArgs;
          const repository = target.getRepository(
            entity as EntityTarget<ObjectLiteral>
          );
          return this.withPessimisticLock(
            queryRunner,
            repository as unknown as Record<string, unknown>,
            property.toString(),
            rest,
            () => original.apply(target, fnArgs as any[])
          );
        };
      }
      if (property === "getRepository") {
        const original = Reflect.get(target, property, receiver) as (
          ...args: any[]
        ) => unknown;
        if (typeof original !== "function") {
          return original;
        }
        return (...repoArgs: unknown[]) => {
          const repository = original.apply(target, repoArgs as any[]);
          return wrapRepository(repository);
        };
      }
      return Reflect.get(target, property, receiver);
    },
  });
}

  public async runWithStoreTransaction<TResult>(
    store: TransactionStore,
    operation: () => Promise<TResult>
  ): Promise<TResult> {
    const runner = store.queryRunner;
    if (!runner.isTransactionActive || runner.isReleased) {
      return await operation();
    }

    let attempt = 0;
    while (attempt < maxTransactionAttempts) {
      const savepoint = this.generateSavepointName(store);
      await this.createSavepoint(runner, savepoint);
      try {
        const result = await operation();
        await this.releaseSavepoint(runner, savepoint);
        return result;
      } catch (error) {
        await this.rollbackToSavepoint(runner, savepoint);
        await this.releaseSavepoint(runner, savepoint);
        attempt += 1;
        if (!this.shouldRetry(error) || attempt >= maxTransactionAttempts) {
          throw error;
        }
        await this.delayForRetry(attempt);
      }
    }

    throw new Error("Exceeded maximum transaction retry attempts.");
  }

  private generateSavepointName(store: TransactionStore): string {
    store.savepointCounter += 1;
    return `${savepointPrefix}${store.savepointCounter}`;
  }

  private async createSavepoint(
    queryRunner: QueryRunner,
    name: string
  ): Promise<void> {
    await queryRunner.query(`SAVEPOINT ${name}`);
  }

  private async rollbackToSavepoint(
    queryRunner: QueryRunner,
    name: string
  ): Promise<void> {
    try {
      await queryRunner.query(`ROLLBACK TO SAVEPOINT ${name}`);
    } catch {
      // ignore failures so that retries can continue
    }
  }

  private async releaseSavepoint(
    queryRunner: QueryRunner,
    name: string
  ): Promise<void> {
    try {
      await queryRunner.query(`RELEASE SAVEPOINT ${name}`);
    } catch {
      // ignore
    }
  }

  private async withPessimisticLock<TResult>(
    queryRunner: QueryRunner,
    repositoryTarget: Record<string, unknown>,
    method: string,
    args: ReadonlyArray<unknown>,
    invocation: () => Promise<TResult> | TResult
  ): Promise<TResult> {
    const driver = (queryRunner.connection.options.type ?? "").toLowerCase();
    if (!this.lockingDrivers.has(driver)) {
      return await Promise.resolve(invocation());
    }

    const repository = repositoryTarget as unknown as Repository<ObjectLiteral>;
    const criteria = this.extractLockCriteria(method, args);
    if (criteria === null) {
      return await Promise.resolve(invocation());
    }

    try {
      await this.acquirePessimisticLock(queryRunner, repository, criteria);
    } catch {
      // Best-effort locking; continue even if lock acquisition fails.
    }

    return await Promise.resolve(invocation());
  }

  private extractLockCriteria(
    method: string,
    args: ReadonlyArray<unknown>
  ): Record<string, unknown> | null {
    if (method === "findOne" || method === "findOneOrFail") {
      const [options] = args;
      if (
        options !== null &&
        typeof options === "object" &&
        !Array.isArray(options) &&
        "where" in (options as Record<string, unknown>)
      ) {
        return this.normalizeWhere(
          (options as Record<string, unknown>).where
        );
      }
      return null;
    }

    if (method === "findOneBy" || method === "findOneByOrFail") {
      const [where] = args;
      return this.normalizeWhere(where);
    }

    return null;
  }

  private normalizeWhere(value: unknown): Record<string, unknown> | null {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      return null;
    }

    const entries = Object.entries(value as Record<string, unknown>);
    const normalized: Record<string, unknown> = {};
    for (const [key, candidate] of entries) {
      if (
        typeof candidate === "string" ||
        typeof candidate === "number" ||
        typeof candidate === "boolean" ||
        candidate === null
      ) {
        normalized[key] = candidate;
      } else {
        return null;
      }
    }

    return Object.keys(normalized).length > 0 ? normalized : null;
  }

  private async acquirePessimisticLock(
    queryRunner: QueryRunner,
    repository: Repository<ObjectLiteral>,
    criteria: Record<string, unknown>
  ): Promise<void> {
    const alias = "lock_target";
    const qb = queryRunner.manager
      .createQueryBuilder(
        repository.metadata.target as EntityTarget<ObjectLiteral>,
        alias
      )
      .select("1")
      .setLock("pessimistic_write")
      .limit(1);

    const parameters: Record<string, unknown> = {};
    let index = 0;
    for (const [property, value] of Object.entries(criteria)) {
      const column = repository.metadata.findColumnWithPropertyPath(property);
      if (column === undefined) {
        return;
      }
      index += 1;
      const paramName = `lock_param_${index}`;
      const escapedColumn = `${alias}.${queryRunner.connection.driver.escape(
        column.databaseName
      )}`;
      if (index === 1) {
        qb.where(`${escapedColumn} = :${paramName}`);
      } else {
        qb.andWhere(`${escapedColumn} = :${paramName}`);
      }
      parameters[paramName] = value;
    }

    if (index === 0) {
      return;
    }

    qb.setParameters(parameters);
    await qb.getRawOne();
  }

  private shouldRetry(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }
    const message = error.message.toLowerCase();
    if (retryableMessageFragments.some((fragment) => message.includes(fragment))) {
      return true;
    }
    const anyError = error as { code?: unknown };
    if (typeof anyError.code === "string") {
      const code = anyError.code.toUpperCase();
      if (code === "ER_LOCK_DEADLOCK" || code === "ER_LOCK_WAIT_TIMEOUT") {
        return true;
      }
    }
    return false;
  }

  private async delayForRetry(attempt: number): Promise<void> {
    const delay = retryDelayBaseMs * attempt * attempt;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}

const resolveCurrentTestKey = (): string | null => {
  const maybeExpect = (globalThis as Record<string, unknown>).expect;
  if (maybeExpect !== undefined && maybeExpect !== null) {
    const getState = (
      maybeExpect as {
        getState?: () => { currentTestName?: unknown; testPath?: unknown };
      }
    ).getState;
    if (typeof getState === "function") {
      const state = getState();
      if (state !== undefined && state !== null) {
        const { currentTestName, testPath } = state as {
          currentTestName?: unknown;
          testPath?: unknown;
        };
        const keyParts: string[] = [];
        if (typeof testPath === "string" && testPath.length > 0) {
          keyParts.push(testPath);
        }
        if (typeof currentTestName === "string" && currentTestName.length > 0) {
          keyParts.push(currentTestName);
        }
        if (keyParts.length > 0) {
          return keyParts.join("::");
        }
      }
    }
  }
  return null;
};

const dataSourceContexts = new WeakMap<DataSource, DataSourceIsolationContext>();

const originalEntityManagerTransaction =
  TypeormEntityManager.prototype.transaction as (
    ...args: unknown[]
  ) => Promise<unknown>;
let entityManagerTransactionPatched = false;

const findTransactionCallback = <T>(
  args: TransactionArgs
): TransactionCallback<T> | null => {
  const [first, second] = args;
  if (typeof first === "function") {
    return first as TransactionCallback<T>;
  }
  if (typeof second === "function") {
    return second as TransactionCallback<T>;
  }
  return null;
};

const ensureEntityManagerTransactionPatched = (): void => {
  if (entityManagerTransactionPatched) {
    return;
  }

  TypeormEntityManager.prototype.transaction = async function patchedManagerTransaction<TResult>(
    this: EntityManager,
    ...args: unknown[]
  ): Promise<TResult> {
    const context = dataSourceContexts.get(this.connection);
    const store = context?.getStore();
    if (context !== undefined && store?.active === true) {
      const callback = findTransactionCallback<TResult>(args);
      if (callback === null) {
        throw new Error(errorMessages.transactionCallbackMissing);
      }
      return await context.runWithStoreTransaction(store, async () => {
        return await callback(store.manager);
      });
    }
    return originalEntityManagerTransaction.apply(this, args) as Promise<TResult>;
  };

  entityManagerTransactionPatched = true;
};

export const resolveIsolationContext = (
  dataSource: DataSource
): DataSourceIsolationContext => {
  let context = dataSourceContexts.get(dataSource);
  if (context === undefined) {
    ensureEntityManagerTransactionPatched();
    context = new DataSourceIsolationContext(dataSource);
    dataSourceContexts.set(dataSource, context);
  }
  return context;
};
