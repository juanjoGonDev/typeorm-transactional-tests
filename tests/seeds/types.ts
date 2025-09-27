export interface AddressSeed {
  readonly street: string;
  readonly city: string;
  readonly country: string;
  readonly postalCode: string;
  readonly isPrimary: boolean;
}

export interface ProfileSeed {
  readonly bio: string;
  readonly birthDate: Date;
}

export interface UserSeed {
  readonly fullName: string;
  readonly email: string;
  readonly status: string;
  readonly marketingOptIn: boolean;
  readonly profile: ProfileSeed;
  readonly addresses: ReadonlyArray<AddressSeed>;
}

export interface CategorySeed {
  readonly name: string;
}

export interface ProductSeed {
  readonly name: string;
  readonly sku: string;
  readonly price: string;
  readonly inventoryCount: number;
  readonly categoryName: string;
}

export interface OrderItemSeed {
  readonly sku: string;
  readonly quantity: number;
  readonly unitPrice: string;
}

export interface PaymentSeed {
  readonly provider: string;
  readonly transactionReference: string;
  readonly status: string;
  readonly amount: string;
  readonly processedAt: Date;
}

export interface OrderSeed {
  readonly userEmail: string;
  readonly status: string;
  readonly total: string;
  readonly payment: PaymentSeed;
  readonly items: ReadonlyArray<OrderItemSeed>;
}

export interface SeedDataset {
  readonly users: ReadonlyArray<UserSeed>;
  readonly categories: ReadonlyArray<CategorySeed>;
  readonly products: ReadonlyArray<ProductSeed>;
  readonly orders: ReadonlyArray<OrderSeed>;
}
