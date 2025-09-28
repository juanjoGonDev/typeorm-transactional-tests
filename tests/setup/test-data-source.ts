import { DataSource } from 'typeorm';
import { resolveTestDatabaseConfiguration } from '../config/database';
import { testEntities } from '../../src/testing/entities';

const configuration = resolveTestDatabaseConfiguration(testEntities);

export const testDataSource = new DataSource(configuration.options);

export const prepareTestDatabase = async (): Promise<void> => {
  await configuration.prepare();
};
