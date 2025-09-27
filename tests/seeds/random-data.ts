import { userStatuses } from '../entities/defaults';
import { numericRanges, randomEntityConfig } from './seed-configuration';
import { createRandomGenerator } from './random-generator';
import type { CategorySeed, OrderSeed, ProductSeed, SeedDataset, UserSeed } from './types';
import { fixedCategories, fixedProducts, fixedUsers } from './fixed-data';

const priceFractionDigits = 2;
const categoryPool = ['Outdoors', 'Fitness', 'Gaming', 'Gourmet', 'Wellness', 'Music', 'Travel', 'Home Office'];
const firstNames = ['Liam', 'Emma', 'Noah', 'Olivia', 'Ethan', 'Ava', 'Lucas', 'Mia', 'Mason', 'Sophia'];
const lastNames = ['Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Martinez', 'Lopez', 'Gonzalez'];
const bioSnippets = [
  'Enjoys building resilient systems.',
  'Focuses on customer experience.',
  'Believes in continuous learning.',
  'Works on collaborative teams.',
  'Advocates for inclusive products.'
];
const cityPool = ['Berlin', 'Madrid', 'Toronto', 'San Francisco', 'Tokyo', 'Sydney', 'Lisbon', 'Copenhagen'];
const countryPool = ['Germany', 'Spain', 'Canada', 'United States', 'Japan', 'Australia', 'Portugal', 'Denmark'];
const streetPool = ['Innovation Street', 'Harmony Avenue', 'Discovery Road', 'Inspiration Boulevard', 'Synergy Lane'];
const productAdjectives = ['Quantum', 'Solar', 'Nebula', 'Velocity', 'Aurora', 'Fusion', 'Vertex', 'Pulse'];
const productNouns = ['Headphones', 'Router', 'Monitor', 'Lamp', 'Backpack', 'Notebook', 'Speaker', 'Camera'];
const skuCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const minBirthYear = 1960;
const maxBirthYear = 2000;
const minMonth = 0;
const maxMonth = 11;
const minDay = 1;
const maxDay = 28;

const formatCurrency = (value: number): string => {
  return value.toFixed(priceFractionDigits);
};

const pickUniqueValues = (values: ReadonlyArray<string>, count: number, seed: string): string[] => {
  const random = createRandomGenerator(seed);
  const shuffled = random.shuffle(values);
  return shuffled.slice(0, count);
};

const createRandomCategories = (seed: string): CategorySeed[] => {
  const selections = pickUniqueValues(categoryPool, randomEntityConfig.categories, `${seed}-categories`);
  return selections.map((name) => ({ name }));
};

const createBirthDate = (randomSeed: string): Date => {
  const random = createRandomGenerator(randomSeed);
  const year = random.nextInt(minBirthYear, maxBirthYear);
  const month = random.nextInt(minMonth, maxMonth);
  const day = random.nextInt(minDay, maxDay);
  return new Date(Date.UTC(year, month, day));
};

const generateEmail = (firstName: string, lastName: string, seed: string): string => {
  const random = createRandomGenerator(seed);
  const suffix = random.nextInt(100, 999);
  return `${firstName}.${lastName}${suffix}@example.com`.toLowerCase();
};

const createRandomUsers = (seed: string): UserSeed[] => {
  const random = createRandomGenerator(`${seed}-users`);
  const users: UserSeed[] = [];
  for (let index = 0; index < randomEntityConfig.users; index += 1) {
    const firstName = random.pick(firstNames);
    const lastName = random.pick(lastNames);
    const fullName = `${firstName} ${lastName}`;
    const email = generateEmail(firstName, lastName, `${seed}-${index}`);
    const marketingOptIn = random.nextInt(0, 1) === 1;
    const birthDate = createBirthDate(`${seed}-${fullName}`);
    const addresses = Array.from({ length: randomEntityConfig.addressesPerUser }, (_, addressIndex) => {
      return {
        street: `${random.nextInt(10, 999)} ${random.pick(streetPool)}`,
        city: random.pick(cityPool),
        country: random.pick(countryPool),
        postalCode: String(random.nextInt(10000, 99999)),
        isPrimary: addressIndex === 0
      };
    });
    users.push({
      fullName,
      email,
      status: userStatuses.active,
      marketingOptIn,
      profile: {
        bio: random.pick(bioSnippets),
        birthDate
      },
      addresses
    });
  }
  return users;
};

const generateSku = (seed: string): string => {
  const random = createRandomGenerator(seed);
  const characters: string[] = [];
  for (let index = 0; index < 8; index += 1) {
    const selectedIndex = random.nextInt(0, skuCharacters.length - 1);
    characters.push(skuCharacters[selectedIndex]);
  }
  return characters.join('');
};

const createRandomProducts = (seed: string, categories: ReadonlyArray<CategorySeed>): ProductSeed[] => {
  const random = createRandomGenerator(`${seed}-products`);
  const products: ProductSeed[] = [];
  for (let index = 0; index < randomEntityConfig.products; index += 1) {
    const adjective = random.pick(productAdjectives);
    const noun = random.pick(productNouns);
    const name = `${adjective} ${noun}`;
    const sku = generateSku(`${seed}-${name}-${index}`);
    const priceValue = random.nextInt(numericRanges.price.min, numericRanges.price.max) + random.nextFloat();
    const inventoryCount = random.nextInt(numericRanges.inventory.min, numericRanges.inventory.max);
    const category = random.pick(categories);
    products.push({
      name,
      sku,
      price: formatCurrency(priceValue),
      inventoryCount,
      categoryName: category.name
    });
  }
  return products;
};

export const buildSeedDataset = (seed: string): SeedDataset => {
  const categories = [...fixedCategories, ...createRandomCategories(seed)];
  const products = [...fixedProducts, ...createRandomProducts(seed, categories)];
  const users = [...fixedUsers, ...createRandomUsers(seed)];
  const orders: OrderSeed[] = [];
  return { categories, products, users, orders };
};
