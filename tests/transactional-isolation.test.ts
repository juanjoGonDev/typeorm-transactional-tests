import { describe, expect, it, jest } from "@jest/globals";
import { DataSource } from "typeorm";
import type { IsolationLevel } from "typeorm/driver/types/IsolationLevel";
import { TypeormTestDB } from "typeorm-test-db";

const suiteTitle = "TypeORM test database isolation level";
const sqliteDriver = "sqlite" as const;
const sqliteDatabase = ":memory:" as const;
const isolationUnderTest: IsolationLevel = "SERIALIZABLE";

const buildIsolatedDataSource = (): DataSource => {
  return new DataSource({
    type: sqliteDriver,
    database: sqliteDatabase,
    entities: [],
    synchronize: false,
  });
};

describe(suiteTitle, () => {
  it("respects the configured isolation level when starting the transaction", async () => {
    const dataSource = buildIsolatedDataSource();
    await dataSource.initialize();
    let capturedIsolation: IsolationLevel | undefined;
    const originalCreateQueryRunner = dataSource.createQueryRunner.bind(dataSource);

    jest
      .spyOn(dataSource, "createQueryRunner")
      .mockImplementation(() => {
        const queryRunner = originalCreateQueryRunner();
        const originalStartTransaction = queryRunner.startTransaction.bind(queryRunner);
        jest
          .spyOn(queryRunner, "startTransaction")
          .mockImplementation(async (isolationLevel?: IsolationLevel) => {
            capturedIsolation = isolationLevel;
            await originalStartTransaction(isolationLevel);
          });
        return queryRunner;
      });

    const lifecycle = TypeormTestDB(dataSource, {
      isolationLevel: isolationUnderTest,
    });

    try {
      await lifecycle.init();
      await lifecycle.finish();
    } finally {
      jest.restoreAllMocks();
      if (dataSource.isInitialized) {
        await dataSource.destroy();
      }
    }

    expect(capturedIsolation).toBe(isolationUnderTest);
  });
});
