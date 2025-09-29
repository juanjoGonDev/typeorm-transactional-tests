import { describe, expect, it } from "@jest/globals";
import { In } from "typeorm";
import { fixedProducts, fixedUsers } from "./seeds/fixed-data";
import { seedDatabase } from "./seeds";
import { testDataSource } from "./setup";
import { TypeormTestDbOrderService } from "./services/order-service";
import { Product } from "./entities";
import { paymentStatuses } from "./entities/defaults";

const suiteTitle = "TypeORM test database order service";
const providerName = "service-stripe";
const orderQuantityFirst = 2;
const orderQuantitySecond = 1;

const resolveProductSkus = (): [string, string] => {
  const [first, second] = fixedProducts;
  if (first === undefined || second === undefined) {
    throw new Error("Insufficient fixed products to run the service tests.");
  }
  return [first.sku, second.sku];
};

const resolveUserEmail = (): string => {
  const [firstUser] = fixedUsers;
  if (firstUser === undefined) {
    throw new Error("Insufficient fixed users to run the service tests.");
  }
  return firstUser.email;
};

describe(suiteTitle, () => {
  it("creates a complex order inside a transactional boundary", async () => {
    await seedDatabase(testDataSource.manager);
    const [firstSku, secondSku] = resolveProductSkus();
    const userEmail = resolveUserEmail();
    const productRepository = testDataSource.getRepository(Product);
    const productsBefore = await productRepository.find({
      where: { sku: In([firstSku, secondSku]) },
    });

    const service = new TypeormTestDbOrderService(testDataSource);
    const order = await service.placeOrder({
      userEmail,
      provider: providerName,
      items: [
        { sku: firstSku, quantity: orderQuantityFirst },
        { sku: secondSku, quantity: orderQuantitySecond },
      ],
    });

    expect(order.items).toHaveLength(2);
    expect(order.payment.provider).toBe(providerName);
    expect(order.payment.status).toBe(paymentStatuses.settled);

    const productsAfter = await productRepository.find({
      where: { sku: In([firstSku, secondSku]) },
    });
    productsAfter.forEach((product) => {
      const before = productsBefore.find(
        (candidate) => candidate.sku === product.sku
      );
      expect(before).toBeDefined();
      if (before === undefined) {
        return;
      }
      const orderedQuantity =
        product.sku === firstSku ? orderQuantityFirst : orderQuantitySecond;
      expect(product.inventoryCount).toBe(
        before.inventoryCount - orderedQuantity
      );
    });
  });

  it("restores product inventory after the rollback finishes", async () => {
    await seedDatabase(testDataSource.manager);
    const [firstSku, secondSku] = resolveProductSkus();
    const productRepository = testDataSource.getRepository(Product);
    const products = await productRepository.find({
      where: { sku: In([firstSku, secondSku]) },
    });
    const expectations = new Map(
      fixedProducts
        .filter(
          (product) => product.sku === firstSku || product.sku === secondSku
        )
        .map((product) => [product.sku, product.inventoryCount])
    );
    products.forEach((product) => {
      const expectedInventory = expectations.get(product.sku);
      expect(expectedInventory).toBeDefined();
      if (expectedInventory === undefined) {
        return;
      }
      expect(product.inventoryCount).toBe(expectedInventory);
    });
  });
});
