export const seedEnvironment = {
  variable: 'TEST_SEED',
  fallback: 'typeorm-transactional-tests'
} as const;

export const randomEntityConfig = {
  users: 3,
  addressesPerUser: 2,
  ordersPerUser: 2,
  itemsPerOrder: 3,
  categories: 3,
  products: 5
} as const;

export const numericRanges = {
  price: { min: 10, max: 500 },
  inventory: { min: 0, max: 250 },
  quantity: { min: 1, max: 4 }
} as const;
