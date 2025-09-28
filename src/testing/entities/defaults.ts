export const userStatuses = {
  active: 'active',
  inactive: 'inactive'
} as const;

export const orderStatuses = {
  created: 'created',
  completed: 'completed',
  cancelled: 'cancelled'
} as const;

export const paymentStatuses = {
  pending: 'pending',
  settled: 'settled',
  failed: 'failed'
} as const;

export const booleanDefaults = {
  addressPrimary: false,
  marketingOptIn: false
} as const;
