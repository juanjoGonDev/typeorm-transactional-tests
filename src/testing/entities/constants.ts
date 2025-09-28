export const tableNames = {
  user: 'users',
  profile: 'profiles',
  address: 'addresses',
  category: 'categories',
  product: 'products',
  order: 'orders',
  orderItem: 'order_items',
  payment: 'payments'
} as const;

export const columnLengths = {
  email: 160,
  fullName: 120,
  street: 160,
  city: 80,
  country: 80,
  bio: 512,
  sku: 32,
  status: 32,
  postalCode: 32,
  categoryName: 80,
  paymentProvider: 64,
  transactionReference: 64
} as const;

export const decimalConfig = {
  pricePrecision: 12,
  priceScale: 2
} as const;
