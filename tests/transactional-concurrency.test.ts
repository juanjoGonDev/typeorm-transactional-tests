
import { beforeAll, describe, expect, test } from "@jest/globals";
import { TypeormTestDB } from "typeorm-test-db";
import { Product } from "./entities";
import { seedDatabase } from "./seeds";
import { fixedProducts } from "./seeds/fixed-data";
import { TypeormTestDbInventoryService } from "./services/inventory-service";
import { testDataSource } from "./setup";

type ParallelCase = {
  readonly label: string;
  readonly restockQuantity: number;
};

const suiteTitle = "TypeORM test database concurrent isolation";

const parallelCases: ParallelCase[] = Array.from({ length: 12 }, (_, index) => ({
  label: `isolates concurrent restock #${index + 1}`,
  restockQuantity: index + 2,
}));

const sqliteSequentialDrivers = new Set(["sqlite", "better-sqlite3"]);
const isSqliteSequential = sqliteSequentialDrivers.has(
  (process.env.TEST_DB_TYPE ?? "sqlite").toLowerCase()
);

beforeAll(async () => {
  await seedDatabase(testDataSource.manager);
});

describe(suiteTitle, () => {
  const registerCases = parallelCases as ReadonlyArray<ParallelCase>;

  if (isSqliteSequential) {
    test.each(registerCases)(
      "$label",
      async ({ restockQuantity }) => {
        await runRestockScenario(restockQuantity);
      }
    );
  } else {
    test.concurrent.each(registerCases)(
      "$label",
      async ({ restockQuantity }) => {
        await runRestockScenario(restockQuantity);
      }
    );
  }
});

const runRestockScenario = async (restockQuantity: number): Promise<void> => {
  const lifecycle = TypeormTestDB(testDataSource);
  await lifecycle.init();
  try {
    const [targetProduct] = fixedProducts;
    if (targetProduct === undefined) {
      throw new Error("Missing deterministic product seed for concurrency tests.");
    }

    const inventoryService = new TypeormTestDbInventoryService(testDataSource);

    const restocked = await inventoryService.restock([
      { sku: targetProduct.sku, quantity: restockQuantity },
    ]);
    expect(restocked).toHaveLength(1);
    const [restockedProduct] = restocked;
    expect(restockedProduct.inventoryCount).toBe(
      targetProduct.inventoryCount + restockQuantity
    );

    const repository = testDataSource.getRepository(Product);
    const persisted = await repository.findOne({
      where: { sku: targetProduct.sku },
    });
    expect(persisted?.inventoryCount).toBe(
      targetProduct.inventoryCount + restockQuantity
    );
  } finally {
    await lifecycle.finish();
  }
};
