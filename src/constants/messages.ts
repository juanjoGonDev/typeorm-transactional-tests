export const errorMessages = {
  dataSourceNotInitialized: 'Transactional tests require an initialized data source.',
  transactionAlreadyStarted: 'A transactional test context is already active for the provided data source.',
  transactionCallbackMissing: 'Transactional execution requires a callback to operate on the shared entity manager.'
} as const;
