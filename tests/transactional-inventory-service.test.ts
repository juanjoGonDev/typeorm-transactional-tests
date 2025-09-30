import { describe, expect, it } from "@jest/globals";
import { In } from "typeorm";
import { fixedProducts } from "./seeds/fixed-data";
import { seedDatabase } from "./seeds";
import { testDataSource } from "./setup";
import { Product } from "./entities";
import { TypeormTestDbInventoryService } from "./services/inventory-service";

const suiteTitle = "TypeORM test database inventory service";
const restockQuantityPrimary = 4;
const restockQuantitySecondary = 7;
const invalidQuantity = 0;
const resolveProductPair = (): [string, string] => {
  const [first, second] = fixedProducts;
  if (first === undefined || second === undefined) {
    throw new Error("Insufficient fixed products to run the inventory tests.");
  }
  return [first.sku, second.sku];
};

describe(suiteTitle, () => {
  it("restocks multiple products within a transactional boundary", async () => {
    await seedDatabase(testDataSource.manager);
    const [firstSku, secondSku] = resolveProductPair();
    const repository = testDataSource.getRepository(Product);
    const before = await repository.find({
      where: { sku: In([firstSku, secondSku]) },
    });
    const inventoryBySku = new Map(before.map((product) => [product.sku, product.inventoryCount]));

    const service = new TypeormTestDbInventoryService(testDataSource);
    const restocked = await service.restock([
      { sku: firstSku, quantity: restockQuantityPrimary },
      { sku: secondSku, quantity: restockQuantitySecondary },
    ]);

    expect(restocked).toHaveLength(2);
    const after = await repository.find({
      where: { sku: In([firstSku, secondSku]) },
    });
    after.forEach((product) => {
      const original = inventoryBySku.get(product.sku);
      expect(original).toBeDefined();
      if (original === undefined) {
        return;
      }
      const expectedIncrement =
        product.sku === firstSku ? restockQuantityPrimary : restockQuantitySecondary;
      expect(product.inventoryCount).toBe(original + expectedIncrement);
    });
  });

  it("does not mutate inventory when validation fails", async () => {
    await seedDatabase(testDataSource.manager);
    const [firstSku] = resolveProductPair();
    const service = new TypeormTestDbInventoryService(testDataSource);

    await expect(
      service.restock([{ sku: firstSku, quantity: invalidQuantity }])
    ).rejects.toThrow();

    const repository = testDataSource.getRepository(Product);
    const product = await repository.findOne({
      where: { sku: firstSku },
    });
    expect(product).not.toBeNull();
    if (product === null) {
      return;
    }
    const expected = fixedProducts.find((candidate) => candidate.sku === firstSku);
    expect(expected).toBeDefined();
    if (expected === undefined) {
      return;
    }
    expect(product.inventoryCount).toBe(expected.inventoryCount);
  });

  it("restores inventory levels after lifecycle rollback", async () => {
    await seedDatabase(testDataSource.manager);
    const [firstSku, secondSku] = resolveProductPair();
    const repository = testDataSource.getRepository(Product);
    const products = await repository.find({
      where: { sku: In([firstSku, secondSku]) },
    });
    const expectedInventory = new Map(
      fixedProducts
        .filter((product) => product.sku === firstSku || product.sku === secondSku)
        .map((product) => [product.sku, product.inventoryCount])
    );
    products.forEach((product) => {
      const expected = expectedInventory.get(product.sku);
      expect(expected).toBeDefined();
      if (expected === undefined) {
        return;
      }
      expect(product.inventoryCount).toBe(expected);
    });
  });
});
