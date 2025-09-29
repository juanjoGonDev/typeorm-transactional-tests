export const errorMessages = {
  dataSourceNotInitialized: 'TypeORM test database context requires an initialized data source.',
  transactionAlreadyStarted: 'A TypeORM test database context is already active for the provided data source.',
  transactionCallbackMissing:
    'TypeORM test database execution requires a callback to operate on the shared entity manager.'
} as const;
