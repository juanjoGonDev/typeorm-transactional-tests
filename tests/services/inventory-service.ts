import type { DataSource } from "typeorm";
import type { IsolationLevel } from "typeorm/driver/types/IsolationLevel";
import { Product } from "../entities";

const productNotFoundMessage = "Product not found for sku";
const nonPositiveQuantityMessage = "Quantity must be greater than zero for sku";

export interface InventoryRestockItem {
  readonly sku: string;
  readonly quantity: number;
}

export class TypeormTestDbInventoryService {
  private readonly dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  public async restock(
    items: ReadonlyArray<InventoryRestockItem>
  ): Promise<Product[]> {
    if (items.length === 0) {
      return [];
    }

    return await this.dataSource.transaction(async (manager) => {
      const productRepository = manager.getRepository(Product);
      const restockedProducts: Product[] = [];

      for (const item of items) {
        if (item.quantity <= 0) {
          throw new Error(`${nonPositiveQuantityMessage}: ${item.sku}`);
        }

        const product = await productRepository.findOne({
          where: { sku: item.sku },
        });

        if (product === null) {
          throw new Error(`${productNotFoundMessage}: ${item.sku}`);
        }

        product.inventoryCount += item.quantity;
        restockedProducts.push(product);
      }

      return await productRepository.save(restockedProducts);
    });
  }
}
