import type { EntityManager } from "typeorm";
import { seedEnvironment } from "./seed-configuration";
import { buildSeedDataset } from "./random-data";
import type { SeedDataset } from "./types";
import { Category, Product, User, Profile, Address } from "../entities";

export interface SeedSummary {
  readonly categories: number;
  readonly products: number;
  readonly users: number;
}

const resolveSeedValue = (): string => {
  return process.env[seedEnvironment.variable] ?? seedEnvironment.fallback;
};

const persistCategories = async (
  manager: EntityManager,
  dataset: SeedDataset
): Promise<Map<string, Category>> => {
  const repository = manager.getRepository(Category);
  const entities = dataset.categories.map((category) =>
    repository.create(category)
  );
  const saved = await repository.save(entities);
  return new Map(saved.map((category) => [category.name, category]));
};

const persistProducts = async (
  manager: EntityManager,
  dataset: SeedDataset,
  categories: Map<string, Category>
): Promise<Map<string, Product>> => {
  const repository = manager.getRepository(Product);
  const entities = dataset.products.map((product) => {
    const category = categories.get(product.categoryName);
    if (category === undefined) {
      throw new Error(`Missing category for product ${product.name}`);
    }
    return repository.create({
      name: product.name,
      sku: product.sku,
      price: product.price,
      inventoryCount: product.inventoryCount,
      category,
    });
  });
  const saved = await repository.save(entities);
  return new Map(saved.map((product) => [product.sku, product]));
};

const persistUsers = async (
  manager: EntityManager,
  dataset: SeedDataset
): Promise<Map<string, User>> => {
  const repository = manager.getRepository(User);
  const entities = dataset.users.map((user) => {
    return repository.create({
      fullName: user.fullName,
      email: user.email,
      status: user.status,
      marketingOptIn: user.marketingOptIn,
      profile: manager.create(Profile, user.profile),
      addresses: user.addresses.map((address) =>
        manager.create(Address, address)
      ),
    });
  });
  const saved = await repository.save(entities);
  return new Map(saved.map((user) => [user.email, user]));
};

export const seedDatabase = async (
  manager: EntityManager
): Promise<SeedSummary> => {
  const seed = resolveSeedValue();
  const dataset = buildSeedDataset(seed);
  const categories = await persistCategories(manager, dataset);
  const products = await persistProducts(manager, dataset, categories);
  const users = await persistUsers(manager, dataset);
  return {
    categories: categories.size,
    products: products.size,
    users: users.size,
  };
};
